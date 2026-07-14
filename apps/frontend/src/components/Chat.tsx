import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import { getChat } from "../api/chat.api";
import { createCodeSession } from "../api/codeSession.api";
import { createSocket, type AppSocket } from "../lib/socket";
import { getErrorMessage } from "../lib/apiClient";
import { formatTime } from "../lib/format";
import { setActiveChat } from "../lib/activeChat";
import { clearUnreadTitle } from "../lib/notify";
import { Avatar } from "./Avatar";
import { InlineLoader } from "./ui/Loader";
import { Icon } from "./icons";
import { useIsOnline } from "../context/presenceStore";
import { useCallContext } from "../context/callStore";
import type { ChatMessage, SafeUser } from "../types/models";

interface ChatProps {
  targetUser: SafeUser;
  onBack?: () => void;
}

const getSenderId = (message: ChatMessage): string =>
  typeof message.senderId === "string" ? message.senderId : message.senderId._id;

const Check = () => (
  <svg viewBox="0 0 14 10" className="h-2.5 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 5l3.5 3.5L13 1" />
  </svg>
);

// WhatsApp-style ticks for our own messages: one tick = sent (recipient
// offline), two grey ticks = delivered, two blue ticks = read.
const MessageTicks = ({ status }: { status?: ChatMessage["status"] }) => {
  if (!status) return null;
  const title = status === "read" ? "Read" : status === "delivered" ? "Delivered" : "Sent";
  const color = status === "read" ? "text-sky-300" : "text-primary-content/60";
  return (
    <span className={`inline-flex items-center ${color}`} title={title} aria-label={title}>
      <Check />
      {status !== "sent" ? (
        <span className="-ml-[7px]">
          <Check />
        </span>
      ) : null}
    </span>
  );
};

export const Chat = ({ targetUser, onBack }: ChatProps) => {
  const currentUser = useAppSelector((state) => state.user);
  const online = useIsOnline(targetUser._id);
  const navigate = useNavigate();
  const callCtx = useCallContext();
  const inCallWithTarget =
    callCtx.peer?.userId === targetUser._id &&
    (callCtx.status === "outgoing" || callCtx.status === "active");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<AppSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const startCall = () =>
    callCtx.startCall({
      userId: targetUser._id,
      name: `${targetUser.firstName} ${targetUser.lastName ?? ""}`.trim(),
      photoUrl: targetUser.photoUrl,
    });

  useEffect(() => {
    setActiveChat(targetUser._id);
    clearUnreadTitle();
    return () => setActiveChat(null);
  }, [targetUser._id]);

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
    const me = currentUser._id;
    const activeSocket = createSocket();
    socketRef.current = activeSocket;

    const markRead = () => {
      activeSocket.emit("markRead", { userId: me, targetUserId: targetUser._id });
      // Tell the global unread badge to refresh — the conversation is now read.
      window.dispatchEvent(new Event("chat:read"));
    };

    activeSocket.on("connect", () => {
      activeSocket.emit("joinChat", { userId: me, targetUserId: targetUser._id });
      // Join our own user room so delivered/read receipts for our sent
      // messages reach this socket.
      activeSocket.emit("presenceJoin", { userId: me });
      markRead();
    });

    activeSocket.on("messageReceived", (payload) => {
      if (payload.senderId === me) {
        // Reconcile our optimistic message with the server id + status.
        setMessages((previous) =>
          previous.map((message) =>
            message.clientId && message.clientId === payload.clientId
              ? { ...message, _id: payload._id, status: payload.status, clientId: undefined }
              : message,
          ),
        );
        return;
      }
      setMessages((previous) => [
        ...previous,
        {
          _id: payload._id,
          senderId: {
            _id: payload.senderId,
            firstName: payload.firstName,
            lastName: payload.lastName,
          },
          text: payload.text,
          status: payload.status,
          createdAt: payload.createdAt,
        },
      ]);
      // We're looking at this conversation, so the message is read right away.
      markRead();
    });

    // Our sent messages became delivered (recipient came online / was online).
    activeSocket.on("messagesDelivered", ({ withUserId }) => {
      if (withUserId !== targetUser._id) return;
      setMessages((previous) =>
        previous.map((message) =>
          getSenderId(message) === me && message.status === "sent"
            ? { ...message, status: "delivered" }
            : message,
        ),
      );
    });

    // Recipient opened the chat — our sent messages are now read (blue ticks).
    activeSocket.on("messagesRead", ({ withUserId }) => {
      if (withUserId !== targetUser._id) return;
      setMessages((previous) =>
        previous.map((message) =>
          getSenderId(message) === me && message.status !== "read"
            ? { ...message, status: "read" }
            : message,
        ),
      );
    });

    return () => {
      activeSocket.off("messageReceived");
      activeSocket.off("messagesDelivered");
      activeSocket.off("messagesRead");
      activeSocket.disconnect();
      socketRef.current = null;
    };
  }, [currentUser, targetUser._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !currentUser || !socketRef.current) return;
    const clientId = crypto.randomUUID();
    socketRef.current.emit("sendMessage", {
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      userId: currentUser._id,
      targetUserId: targetUser._id,
      text,
      clientId,
    });
    setMessages((previous) => [
      ...previous,
      {
        clientId,
        senderId: {
          _id: currentUser._id,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
        },
        text,
        status: "sent",
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
              {inCallWithTarget ? "in call" : online ? "online" : "offline"}
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
          {inCallWithTarget ? (
            <button
              type="button"
              onClick={callCtx.hangUp}
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
              onClick={startCall}
              disabled={callCtx.status !== "idle"}
              className="btn btn-primary btn-sm gap-1.5"
              title={
                callCtx.status !== "idle"
                  ? "You're already in a call"
                  : "Start a video call"
              }
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
                key={message._id ?? message.clientId ?? index}
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
                  <p className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
                    <span>{formatTime(message.createdAt)}</span>
                    {mine ? <MessageTicks status={message.status} /> : null}
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
