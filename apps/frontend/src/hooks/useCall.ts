import { useCallback, useEffect, useRef, useState } from "react";
import type { AppSocket } from "../lib/socket";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

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
  joinCall: () => Promise<void>;
  leaveCall: () => void;
  toggleMic: () => void;
  toggleCam: () => void;
  toggleScreenShare: () => Promise<void>;
}

export const useCall = (
  socket: AppSocket | null,
  sessionId: string,
  userName: string,
): CallApi => {
  const socketRef = useRef<AppSocket | null>(socket);
  socketRef.current = socket;

  const peersRef = useRef(new Map<string, RTCPeerConnection>());
  const mediaRef = useRef<MediaStream | null>(null);
  const screenRef = useRef<MediaStream | null>(null);
  const namesRef = useRef(new Map<string, string>());
  const inCallRef = useRef(false);

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
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      namesRef.current.set(remoteId, name);
      setRemotePeers((prev) => ({
        ...prev,
        [remoteId]: { userName: name, stream: prev[remoteId]?.stream ?? null },
      }));

      mediaRef.current
        ?.getTracks()
        .forEach((track) => pc.addTrack(track, mediaRef.current as MediaStream));

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
      await peersRef.current
        .get(from)
        ?.setRemoteDescription(new RTCSessionDescription(sdp));
    };

    const onIce = async ({
      from,
      candidate,
    }: {
      from: string;
      candidate: RTCIceCandidateInit;
    }) => {
      try {
        await peersRef.current
          .get(from)
          ?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        /* ignore late candidates */
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

  const joinCall = useCallback(async () => {
    const activeSocket = socketRef.current;
    if (!activeSocket || inCallRef.current) return;
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
      }
      mediaRef.current = stream;
      setLocalStream(stream);
      setMicOn(stream.getAudioTracks().length > 0);
      setCamOn(stream.getVideoTracks().length > 0);
      setError("");
      inCallRef.current = true;
      setInCall(true);
      activeSocket.emit("callJoin", { sessionId, userName });
    } catch {
      setError("Could not access camera or microphone. Check permissions.");
    }
  }, [sessionId, userName]);

  const leaveCall = useCallback(() => {
    socketRef.current?.emit("callLeave", { sessionId });
    teardown();
  }, [sessionId, teardown]);

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
