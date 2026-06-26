import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import { getChat } from "../api/chat.api";
import { createCodeSession } from "../api/codeSession.api";
import { createSocket, type AppSocket } from "../lib/socket";
import { getErrorMessage } from "../lib/apiClient";
import { formatTime } from "../lib/format";
import { useCall } from "../hooks/useCall";
import { Avatar } from "./Avatar";
import { VideoTile } from "./VideoTile";
import { InlineLoader } from "./ui/Loader";
import { Icon } from "./icons";
import { useIsOnline } from "../context/presenceStore";
import type { ChatMessage, SafeUser } from "../types/models";

interface ChatProps {
  targetUser: SafeUser;
  onBack?: () => void;
}

const getSenderId = (message: ChatMessage): string =>
  typeof message.senderId === "string" ? message.senderId : message.senderId._id;

const CallControl = ({
  active,
  danger,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    className={`btn btn-circle btn-sm ${
      danger
        ? "border-error/30 bg-error/15 text-error hover:bg-error/25"
        : active
          ? "border-primary/40 bg-primary/20 text-primary"
          : "border-base-content/15 bg-base-100/60 text-base-content/70"
    }`}
  >
    {children}
  </button>
);

export const Chat = ({ targetUser, onBack }: ChatProps) => {
  const currentUser = useAppSelector((state) => state.user);
  const online = useIsOnline(targetUser._id);
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const socketRef = useRef<AppSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const userName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName ?? ""}`.trim()
    : "";
  const callRoom = currentUser
    ? [currentUser._id, targetUser._id].sort().join("::")
    : "";
  const call = useCall(socket, callRoom, userName);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getChat(targetUser._id)
      .then((chat) => {
        if (active) setMessages(chat.messages);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [targetUser._id]);

  useEffect(() => {
    if (!currentUser) return undefined;
    const activeSocket = createSocket();
    socketRef.current = activeSocket;
    setSocket(activeSocket);

    activeSocket.on("connect", () => {
      activeSocket.emit("joinChat", {
        userId: currentUser._id,
        targetUserId: targetUser._id,
      });
    });
    activeSocket.on("messageReceived", (payload) => {
      if (payload.senderId === currentUser._id) return;
      setMessages((previous) => [
        ...previous,
        {
          senderId: {
            _id: payload.senderId,
            firstName: payload.firstName,
            lastName: payload.lastName,
          },
          text: payload.text,
          createdAt: payload.createdAt,
        },
      ]);
    });

    return () => {
      activeSocket.off("messageReceived");
      activeSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [currentUser, targetUser._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !currentUser || !socketRef.current) return;
    socketRef.current.emit("sendMessage", {
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      userId: currentUser._id,
      targetUserId: targetUser._id,
      text,
    });
    setMessages((previous) => [
      ...previous,
      {
        senderId: {
          _id: currentUser._id,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
        },
        text,
        createdAt: new Date().toISOString(),
      },
    ]);
    setDraft("");
  };

  const handleStartCoding = async () => {
    try {
      const session = await createCodeSession(targetUser._id);
      navigate(`/code-session/${session.sessionId}`);
    } catch (error) {
      alert(getErrorMessage(error, "Could not start a coding session"));
    }
  };

  const remotes = Object.entries(call.remotePeers);

  return (
    <div className="surface flex h-[calc(100vh-9rem)] flex-col lg:h-[72vh]">
      <div className="flex items-center justify-between gap-2 border-b border-base-content/10 p-3 sm:p-4">
        <div className="flex min-w-0 items-center gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="btn btn-ghost btn-circle btn-sm lg:hidden"
              aria-label="Back"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          ) : null}
          <Avatar
            firstName={targetUser.firstName}
            lastName={targetUser.lastName}
            photoUrl={targetUser.photoUrl}
            size="w-10 h-10"
          />
          <div className="min-w-0">
            <h3 className="truncate font-semibold leading-tight">
              {targetUser.firstName} {targetUser.lastName}
            </h3>
            <p className="flex items-center gap-1.5 font-mono text-[11px] text-base-content/50">
              {online ? <span className="h-1.5 w-1.5 rounded-full bg-success" /> : null}
              {call.inCall ? "in call" : online ? "online" : "offline"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleStartCoding}
            className="btn btn-ghost btn-sm gap-1.5 border border-base-content/15"
            title="Start a code session"
          >
            <Icon name="code" className="h-4 w-4" />
            <span className="hidden sm:inline">Code together</span>
          </button>
          {call.inCall ? (
            <button
              type="button"
              onClick={call.leaveCall}
              className="btn btn-sm gap-1.5 border-error/30 bg-error/15 text-error hover:bg-error/25"
              title="End call"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15.46l-5.27-.61-2.52 2.52a15.05 15.05 0 0 1-6.59-6.59l2.53-2.53L8.54 3H3.03C2.45 13.18 10.82 21.55 21 20.97v-5.51z" />
                <path d="M23 1L1 23" />
              </svg>
              <span className="hidden sm:inline">End</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void call.joinCall()}
              className="btn btn-primary btn-sm gap-1.5"
              title="Start a video call"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" />
              </svg>
              <span className="hidden sm:inline">Video call</span>
            </button>
          )}
        </div>
      </div>

      {call.inCall ? (
        <div className="border-b border-base-content/10 bg-base-200/60 p-3">
          {call.error ? (
            <p className="mb-2 text-xs text-error">{call.error}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            {remotes.length === 0 ? (
              <p className="font-mono text-xs text-base-content/55">
                Waiting for {targetUser.firstName} to join the call...
              </p>
            ) : (
              remotes.map(([id, peer]) => (
                <div key={id} className="w-44">
                  <VideoTile stream={peer.stream} label={peer.userName} placeholder="connecting..." />
                </div>
              ))
            )}
            <div className="w-32">
              <VideoTile stream={call.localStream} label="You" muted placeholder="camera off" />
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <CallControl active={call.micOn} onClick={call.toggleMic} label="Toggle mic">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="2" width="6" height="12" rx="3" />
                  <path d="M5 10a7 7 0 0 0 14 0M12 17v4" />
                </svg>
              </CallControl>
              <CallControl active={call.camOn} onClick={call.toggleCam} label="Toggle camera">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 7l-7 5 7 5V7z" />
                  <rect x="1" y="5" width="15" height="14" rx="2" />
                </svg>
              </CallControl>
              <CallControl active={call.sharing} onClick={() => void call.toggleScreenShare()} label="Share screen">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
              </CallControl>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {loading ? (
          <InlineLoader />
        ) : messages.length === 0 ? (
          <p className="mt-8 text-center text-sm text-base-content/55">
            Send the first message to {targetUser.firstName}.
          </p>
        ) : (
          messages.map((message, index) => {
            const mine = currentUser
              ? getSenderId(message) === currentUser._id
              : false;
            return (
              <div
                key={message._id ?? index}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    mine
                      ? "bg-primary text-primary-content"
                      : "bg-base-200 text-base-content"
                  }`}
                >
                  <p className="break-words text-sm">{message.text}</p>
                  <p className="mt-1 text-right text-[10px] opacity-70">
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 border-t border-base-content/10 p-3 sm:p-4">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={`Message ${targetUser.firstName}...`}
          className="input input-bordered flex-1"
          maxLength={2000}
        />
        <button type="submit" className="btn btn-primary" disabled={!draft.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};
