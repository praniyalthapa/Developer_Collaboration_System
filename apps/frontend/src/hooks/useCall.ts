import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "../lib/apiClient";
import type { AppSocket } from "../lib/socket";

// STUN is the baseline and is ALWAYS tried first: ICE ranks direct/STUN
// candidates above TURN, so a relay is only used when a direct peer-to-peer
// path can't be formed. These plain STUN servers are the offline fallback used
// if the backend's /turn-credentials endpoint can't be reached.
const FALLBACK_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

// TURN credentials live on the backend (fetched from Metered) so the API key is
// never shipped to the browser and a new account can be swapped in without
// rebuilding the frontend. Cache the result for the session.
let cachedIceServers: RTCIceServer[] | null = null;
const fetchIceServers = async (): Promise<RTCIceServer[]> => {
  if (cachedIceServers) return cachedIceServers;
  try {
    const res = await apiClient.get<{ data: RTCIceServer[] }>("/turn-credentials");
    cachedIceServers = res.data.data?.length ? res.data.data : FALLBACK_ICE_SERVERS;
  } catch {
    cachedIceServers = FALLBACK_ICE_SERVERS;
  }
  return cachedIceServers;
};

export interface RemotePeer {
  userName: string;
  stream: MediaStream | null;
}

export interface CallApi {
  inCall: boolean;
  micOn: boolean;
  camOn: boolean;
  sharing: boolean;
  localStream: MediaStream | null;
  remotePeers: Record<string, RemotePeer>;
  error: string;
  joinCall: (room: string) => Promise<void>;
  leaveCall: () => void;
  toggleMic: () => void;
  toggleCam: () => void;
  toggleScreenShare: () => Promise<void>;
}

export const useCall = (
  socket: AppSocket | null,
  userName: string,
): CallApi => {
  const socketRef = useRef<AppSocket | null>(socket);
  socketRef.current = socket;

  const peersRef = useRef(new Map<string, RTCPeerConnection>());
  // ICE candidates can arrive before the peer's remoteDescription is set (they
  // race with the async offer/answer handling). Adding one too early throws and
  // the candidate is lost, which can silently break media. Buffer per peer and
  // flush once the remote description is in place.
  const pendingIceRef = useRef(new Map<string, RTCIceCandidateInit[]>());
  const mediaRef = useRef<MediaStream | null>(null);
  const screenRef = useRef<MediaStream | null>(null);
  const iceServersRef = useRef<RTCIceServer[]>(FALLBACK_ICE_SERVERS);
  const namesRef = useRef(new Map<string, string>());
  const inCallRef = useRef(false);
  const roomRef = useRef("");

  const [inCall, setInCall] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<Record<string, RemotePeer>>({});
  const [error, setError] = useState("");

  const teardown = useCallback(() => {
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
    pendingIceRef.current.clear();
    mediaRef.current?.getTracks().forEach((track) => track.stop());
    mediaRef.current = null;
    screenRef.current?.getTracks().forEach((track) => track.stop());
    screenRef.current = null;
    namesRef.current.clear();
    setLocalStream(null);
    setRemotePeers({});
    setSharing(false);
    inCallRef.current = false;
    setInCall(false);
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    const createPeer = (remoteId: string, name: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
      namesRef.current.set(remoteId, name);
      setRemotePeers((prev) => ({
        ...prev,
        [remoteId]: { userName: name, stream: prev[remoteId]?.stream ?? null },
      }));

      mediaRef.current
        ?.getTracks()
        .forEach((track) => pc.addTrack(track, mediaRef.current as MediaStream));

      // Guarantee audio/video m-lines even when we have no local tracks, so a
      // user without a camera/mic can still receive the remote stream.
      const localKinds = new Set(
        (mediaRef.current?.getTracks() ?? []).map((track) => track.kind),
      );
      if (!localKinds.has("audio")) {
        pc.addTransceiver("audio", { direction: "recvonly" });
      }
      if (!localKinds.has("video")) {
        pc.addTransceiver("video", { direction: "recvonly" });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("callSignalIce", {
            to: remoteId,
            candidate: event.candidate.toJSON(),
          });
        }
      };
      pc.ontrack = (event) => {
        const [stream] = event.streams;
        setRemotePeers((prev) => ({
          ...prev,
          [remoteId]: {
            userName: namesRef.current.get(remoteId) ?? name,
            stream: stream ?? null,
          },
        }));
      };

      peersRef.current.set(remoteId, pc);
      return pc;
    };

    const onReady = async ({
      peers,
    }: {
      peers: Array<{ socketId: string; userName: string }>;
    }) => {
      for (const peer of peers) {
        const pc = createPeer(peer.socketId, peer.userName);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("callSignalOffer", { to: peer.socketId, sdp: offer });
      }
    };

    const onPeerJoined = ({
      socketId,
      userName: name,
    }: {
      socketId: string;
      userName: string;
    }) => {
      namesRef.current.set(socketId, name);
    };

    const flushPendingIce = async (from: string, pc: RTCPeerConnection) => {
      const queued = pendingIceRef.current.get(from);
      if (!queued?.length) return;
      pendingIceRef.current.delete(from);
      for (const candidate of queued) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {
          /* ignore invalid candidates */
        }
      }
    };

    const onOffer = async ({
      from,
      sdp,
    }: {
      from: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      const pc =
        peersRef.current.get(from) ??
        createPeer(from, namesRef.current.get(from) ?? "Peer");
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      await flushPendingIce(from, pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("callSignalAnswer", { to: from, sdp: answer });
    };

    const onAnswer = async ({
      from,
      sdp,
    }: {
      from: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      const pc = peersRef.current.get(from);
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      await flushPendingIce(from, pc);
    };

    const onIce = async ({
      from,
      candidate,
    }: {
      from: string;
      candidate: RTCIceCandidateInit;
    }) => {
      const pc = peersRef.current.get(from);
      // Until the remote description exists, addIceCandidate would throw and the
      // candidate would be lost — queue it and flush after set*Description.
      if (!pc || !pc.remoteDescription) {
        const queue = pendingIceRef.current.get(from) ?? [];
        queue.push(candidate);
        pendingIceRef.current.set(from, queue);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        /* ignore invalid candidates */
      }
    };

    const onPeerLeft = ({ socketId }: { socketId: string }) => {
      peersRef.current.get(socketId)?.close();
      peersRef.current.delete(socketId);
      setRemotePeers((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    };

    socket.on("callReady", onReady);
    socket.on("callPeerJoined", onPeerJoined);
    socket.on("callOffer", onOffer);
    socket.on("callAnswer", onAnswer);
    socket.on("callIce", onIce);
    socket.on("callPeerLeft", onPeerLeft);

    return () => {
      socket.off("callReady", onReady);
      socket.off("callPeerJoined", onPeerJoined);
      socket.off("callOffer", onOffer);
      socket.off("callAnswer", onAnswer);
      socket.off("callIce", onIce);
      socket.off("callPeerLeft", onPeerLeft);
    };
  }, [socket]);

  useEffect(() => () => teardown(), [teardown]);

  const joinCall = useCallback(async (room: string) => {
    const activeSocket = socketRef.current;
    if (!activeSocket || inCallRef.current) return;
    // Load ICE servers (STUN + TURN relay creds) before any peer is created.
    iceServersRef.current = await fetchIceServers();
    // getUserMedia only exists in a secure context (HTTPS or localhost). When
    // the app is opened over http://<lan-ip> it's undefined, so guard first to
    // give a clear message instead of a cryptic crash.
    let stream: MediaStream | null = null;
    let insecure = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      insecure = true;
    } else {
      // Best-effort media: video+audio → audio only → none. Never block the
      // call itself — a user without devices can still see/hear the other side.
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
        } catch {
          stream = null;
        }
      }
    }
    mediaRef.current = stream;
    setLocalStream(stream);
    const hasVideo = Boolean(stream && stream.getVideoTracks().length > 0);
    setMicOn(Boolean(stream && stream.getAudioTracks().length > 0));
    setCamOn(hasVideo);
    setError(
      insecure
        ? "Camera and microphone need a secure page. Open the app via http://localhost or HTTPS — not an http://<ip-address> URL."
        : !stream
          ? "No camera or microphone available — you joined as a viewer."
          : !hasVideo
            ? "Camera unavailable — it may be in use by another tab or app. The other side won't see your video."
            : "",
    );
    inCallRef.current = true;
    roomRef.current = room;
    setInCall(true);
    activeSocket.emit("callJoin", { sessionId: room, userName });
  }, [userName]);

  const leaveCall = useCallback(() => {
    if (roomRef.current) {
      socketRef.current?.emit("callLeave", { sessionId: roomRef.current });
    }
    roomRef.current = "";
    teardown();
  }, [teardown]);

  const toggleMic = useCallback(() => {
    const tracks = mediaRef.current?.getAudioTracks() ?? [];
    const enabled = tracks.some((track) => track.enabled);
    tracks.forEach((track) => {
      track.enabled = !enabled;
    });
    setMicOn(!enabled);
  }, []);

  const toggleCam = useCallback(() => {
    const tracks = mediaRef.current?.getVideoTracks() ?? [];
    const enabled = tracks.some((track) => track.enabled);
    tracks.forEach((track) => {
      track.enabled = !enabled;
    });
    setCamOn(!enabled);
  }, []);

  const stopScreenShare = useCallback(async () => {
    screenRef.current?.getTracks().forEach((track) => track.stop());
    screenRef.current = null;
    const cameraTrack = mediaRef.current?.getVideoTracks()[0] ?? null;
    for (const pc of peersRef.current.values()) {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(cameraTrack);
    }
    setLocalStream(mediaRef.current);
    setSharing(false);
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      screenRef.current = display;
      const screenTrack = display.getVideoTracks()[0];
      for (const [remoteId, pc] of peersRef.current.entries()) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          await sender.replaceTrack(screenTrack);
        } else {
          pc.addTrack(screenTrack, display);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketRef.current?.emit("callSignalOffer", { to: remoteId, sdp: offer });
        }
      }
      screenTrack.onended = () => {
        void stopScreenShare();
      };
      setLocalStream(display);
      setSharing(true);
    } catch {
      /* user cancelled the picker */
    }
  }, [stopScreenShare]);

  const toggleScreenShare = useCallback(async () => {
    if (sharing) await stopScreenShare();
    else await startScreenShare();
  }, [sharing, startScreenShare, stopScreenShare]);

  return {
    inCall,
    micOn,
    camOn,
    sharing,
    localStream,
    remotePeers,
    error,
    joinCall,
    leaveCall,
    toggleMic,
    toggleCam,
    toggleScreenShare,
  };
};
