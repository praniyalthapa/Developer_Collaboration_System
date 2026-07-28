import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import { useCall } from "../hooks/useCall";
import { createSocket, type AppSocket } from "../lib/socket";
import { getActiveChat } from "../lib/activeChat";
import { bumpUnreadTitle, clearUnreadTitle, playMessageChime } from "../lib/notify";
import { useToast } from "./toastStore";
import {
  CallContext,
  callRoomId,
  type CallStatus,
  type CallTarget,
} from "./callStore";
import { IncomingCallDialog } from "../components/IncomingCallDialog";
import { CallDock } from "../components/CallDock";

export const CallProvider = ({ children }: { children: ReactNode }) => {
  const currentUser = useAppSelector((state) => state.user);
  const myId = currentUser?._id;
  const myName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName ?? ""}`.trim()
    : "";

  const { push } = useToast();
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const media = useCall(socket, myName, myId);

  const [status, setStatus] = useState<CallStatus>("idle");
  const [peer, setPeer] = useState<CallTarget | null>(null);

  const sockRef = useRef<AppSocket | null>(null);
  const roomRef = useRef("");
  const statusRef = useRef<CallStatus>("idle");
  statusRef.current = status;
  const peerRef = useRef<CallTarget | null>(null);
  peerRef.current = peer;
  const mediaRef = useRef(media);
  mediaRef.current = media;
  const pushRef = useRef(push);
  pushRef.current = push;

  const reset = useCallback(() => {
    roomRef.current = "";
    setPeer(null);
    setStatus("idle");
  }, []);

  useEffect(() => {
    if (!myId) return undefined;
    const s = createSocket();
    sockRef.current = s;
    setSocket(s);

    s.on("connect", () => s.emit("presenceJoin", { userId: myId }));

    s.on("callIncoming", ({ room, fromUserId, fromName }) => {
      // Already busy → auto-decline so the caller isn't left hanging.
      if (statusRef.current !== "idle") {
        s.emit("callInviteResponse", { toUserId: fromUserId, room, accepted: false });
        return;
      }
      roomRef.current = room;
      setPeer({ userId: fromUserId, name: fromName });
      setStatus("incoming");
    });

    s.on("callAccepted", ({ room }) => {
      if (statusRef.current === "outgoing" && roomRef.current === room) {
        setStatus("active");
      }
    });

    s.on("callDeclined", ({ room }) => {
      if (statusRef.current === "outgoing" && roomRef.current === room) {
        pushRef.current({
          variant: "info",
          title: `${peerRef.current?.name ?? "They"} declined the call`,
        });
        mediaRef.current.leaveCall();
        roomRef.current = "";
        setPeer(null);
        setStatus("idle");
      }
    });

    s.on("callCancelled", ({ room }) => {
      if (statusRef.current === "incoming" && roomRef.current === room) {
        pushRef.current({
          variant: "info",
          title: `Missed call from ${peerRef.current?.name ?? "someone"}`,
        });
        roomRef.current = "";
        setPeer(null);
        setStatus("idle");
      }
    });

    s.on("messageNotification", (payload) => {
      const { fromUserId, fromName, text } = payload;
      // Let the inbox reorder / update preview + unread for every message,
      // even the one currently open.
      window.dispatchEvent(new CustomEvent("dc:message", { detail: payload }));
      // Toast, sound and tab-title badge only when NOT already viewing it.
      if (getActiveChat() === fromUserId) return;
      playMessageChime();
      bumpUnreadTitle();
      pushRef.current({
        variant: "message",
        title: fromName,
        body: text,
        onClick: () => navigateRef.current("/connections"),
      });
    });

    return () => {
      s.disconnect();
      sockRef.current = null;
      setSocket(null);
    };
  }, [myId]);

  // Clear the unread-message tab title once the user comes back to the app.
  useEffect(() => {
    const clear = () => clearUnreadTitle();
    window.addEventListener("focus", clear);
    document.addEventListener("visibilitychange", clear);
    return () => {
      window.removeEventListener("focus", clear);
      document.removeEventListener("visibilitychange", clear);
    };
  }, []);

  // In a 1:1 call, when the other side leaves the mesh, end the call locally.
  const hadRemoteRef = useRef(false);
  const remoteCount = Object.keys(media.remotePeers).length;
  useEffect(() => {
    if (remoteCount > 0) {
      hadRemoteRef.current = true;
      return;
    }
    if (hadRemoteRef.current && statusRef.current === "active") {
      hadRemoteRef.current = false;
      pushRef.current({ variant: "info", title: "Call ended" });
      mediaRef.current.leaveCall();
      reset();
    }
  }, [remoteCount, reset]);

  const startCall = useCallback(
    (target: CallTarget) => {
      const s = sockRef.current;
      if (!s || !myId || statusRef.current !== "idle") return;
      const room = callRoomId(myId, target.userId);
      roomRef.current = room;
      setPeer(target);
      setStatus("outgoing");
      hadRemoteRef.current = false;
      void mediaRef.current.joinCall(room);
      s.emit("callInvite", {
        toUserId: target.userId,
        room,
        fromUserId: myId,
        fromName: myName,
      });
    },
    [myId, myName],
  );

  const accept = useCallback(() => {
    const s = sockRef.current;
    const p = peerRef.current;
    if (!s || !p || statusRef.current !== "incoming") return;
    s.emit("callInviteResponse", {
      toUserId: p.userId,
      room: roomRef.current,
      accepted: true,
    });
    hadRemoteRef.current = false;
    void mediaRef.current.joinCall(roomRef.current);
    setStatus("active");
  }, []);

  const decline = useCallback(() => {
    const s = sockRef.current;
    const p = peerRef.current;
    if (s && p) {
      s.emit("callInviteResponse", {
        toUserId: p.userId,
        room: roomRef.current,
        accepted: false,
      });
    }
    reset();
  }, [reset]);

  const hangUp = useCallback(() => {
    const s = sockRef.current;
    const p = peerRef.current;
    // Still ringing them → tell them to stop.
    if (s && p && statusRef.current === "outgoing") {
      s.emit("callCancel", { toUserId: p.userId, room: roomRef.current });
    }
    mediaRef.current.leaveCall();
    reset();
  }, [reset]);

  const value = useMemo(
    () => ({ status, peer, media, startCall, accept, decline, hangUp }),
    [status, peer, media, startCall, accept, decline, hangUp],
  );

  return (
    <CallContext.Provider value={value}>
      {children}
      <IncomingCallDialog />
      <CallDock />
    </CallContext.Provider>
  );
};
