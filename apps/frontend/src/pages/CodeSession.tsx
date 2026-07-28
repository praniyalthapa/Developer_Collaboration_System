import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as Y from "yjs";
import type { OnMount } from "@monaco-editor/react";
import { useAppSelector } from "../app/hooks";
import { getCodeSession } from "../api/codeSession.api";
import { createSocket, type AppSocket, type Participant } from "../lib/socket";
import { bindMonacoYjs } from "../lib/monacoBinding";
import { runCode } from "../lib/runCode";
import { useCall } from "../hooks/useCall";
import { CodeEditor } from "../components/CodeEditor";
import { CallPanel } from "../components/CallPanel";
import { LanguageSelect } from "../components/LanguageSelect";
import { FullScreenLoader } from "../components/ui/Loader";

interface SessionChatMessage {
  userName: string;
  text: string;
  at: string;
}

const CodeSession = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.user);

  const [language, setLanguage] = useState("javascript");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [connected, setConnected] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const [chatMessages, setChatMessages] = useState<SessionChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  // Name of whoever started the video call, while we're being rung.
  const [incomingCallFrom, setIncomingCallFrom] = useState<string | null>(null);

  const socketRef = useRef<AppSocket | null>(null);
  const typingTimer = useRef<number | null>(null);
  const typingStopTimer = useRef<number | null>(null);
  const bindingCleanup = useRef<(() => void) | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const wasInCallRef = useRef(false);

  // The shared CRDT document — created once and kept for the page's lifetime.
  const docRef = useRef<Y.Doc | undefined>(undefined);
  if (!docRef.current) docRef.current = new Y.Doc();

  const userName = user ? `${user.firstName} ${user.lastName ?? ""}`.trim() : "";
  const call = useCall(socket, userName);

  useEffect(() => {
    if (!sessionId) return undefined;
    let active = true;
    getCodeSession(sessionId)
      .then((session) => {
        if (!active) return;
        setLanguage(session.language);
      })
      .catch(() => navigate("/feed", { replace: true }))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [sessionId, navigate]);

  useEffect(() => {
    if (!sessionId || !user) return undefined;
    const doc = docRef.current;
    if (!doc) return undefined;
    const socket = createSocket();
    socketRef.current = socket;
    setSocket(socket);

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("joinCodeSession", { sessionId, userId: user._id, userName });
    });
    socket.on("disconnect", () => setConnected(false));

    // Incoming CRDT state/updates are applied with a "remote" origin so our own
    // update handler below doesn't echo them straight back to the server.
    socket.on("yjsSync", ({ update }) => {
      Y.applyUpdate(doc, Uint8Array.from(update), "remote");
    });
    socket.on("yjsUpdate", ({ update }) => {
      Y.applyUpdate(doc, Uint8Array.from(update), "remote");
    });

    socket.on("languageUpdate", ({ language: incoming }) => setLanguage(incoming));
    socket.on("participantJoined", ({ participants: next }) => setParticipants(next));
    socket.on("participantLeft", ({ participants: next }) => {
      setParticipants(next);
      // The person who was ringing us may have left — drop the prompt.
      setIncomingCallFrom(null);
    });

    // Someone in the session started the video call and is ringing us.
    socket.on("sessionCallRinging", ({ fromName }) => setIncomingCallFrom(fromName));
    socket.on("sessionCallRingingCancel", () => setIncomingCallFrom(null));
    socket.on("userTyping", ({ userName: typer }) => {
      setTypingUser(typer);
      if (typingTimer.current) window.clearTimeout(typingTimer.current);
      typingTimer.current = window.setTimeout(() => setTypingUser(null), 2500);
    });
    socket.on("userStoppedTyping", () => setTypingUser(null));
    socket.on("sessionChatMessage", (message) =>
      setChatMessages((previous) => [...previous, message]),
    );

    // Local edits (origin !== "remote") get relayed to the server, and we ping a
    // lightweight "typing" indicator that stops shortly after the last keystroke.
    const onDocUpdate = (update: Uint8Array, origin: unknown): void => {
      if (origin === "remote") return;
      socket.emit("yjsUpdate", { sessionId, update: Array.from(update) });
      socket.emit("userTyping", { sessionId, userName });
      if (typingStopTimer.current) window.clearTimeout(typingStopTimer.current);
      typingStopTimer.current = window.setTimeout(() => {
        socket.emit("userStoppedTyping", { sessionId });
      }, 1200);
    };
    doc.on("update", onDocUpdate);

    return () => {
      doc.off("update", onDocUpdate);
      socket.emit("leaveCodeSession", { sessionId, userName });
      socket.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [sessionId, user, userName]);

  useEffect(() => {
    return () => bindingCleanup.current?.();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // When the caller leaves the call, tell the others to stop ringing.
  useEffect(() => {
    if (wasInCallRef.current && !call.inCall && socketRef.current && sessionId) {
      socketRef.current.emit("sessionCallInviteCancel", { sessionId });
    }
    wasInCallRef.current = call.inCall;
  }, [call.inCall, sessionId]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    const doc = docRef.current;
    if (!doc) return;
    bindingCleanup.current?.();
    bindingCleanup.current = bindMonacoYjs(doc.getText("monaco"), editor, monaco);
  };

  const handleLanguageChange = (next: string) => {
    setLanguage(next);
    if (socketRef.current && connected && sessionId) {
      socketRef.current.emit("languageChange", { sessionId, language: next });
    }
  };

  const handleRun = async () => {
    setRunning(true);
    setOutput("");
    const code = docRef.current?.getText("monaco").toString() ?? "";
    const result = await runCode(language, code);
    setOutput(result.output);
    setRunning(false);
  };

  const handleSendChat = () => {
    const text = chatInput.trim();
    if (!text || !socketRef.current || !sessionId) return;
    socketRef.current.emit("sessionChat", { sessionId, userName, text });
    setChatInput("");
  };

  // Caller side: after joining the call, ring the other participants.
  const handleStartCall = () => {
    if (!socketRef.current || !sessionId) return;
    socketRef.current.emit("sessionCallInvite", { sessionId, fromName: userName });
  };

  const handleAcceptCall = () => {
    setIncomingCallFrom(null);
    if (sessionId) void call.joinCall(sessionId);
  };

  const handleDeclineCall = () => setIncomingCallFrom(null);

  if (loading) return <FullScreenLoader label="Opening session..." />;

  return (
    <div className="fixed inset-0 flex flex-col bg-base-200">
      <header className="flex items-center justify-between border-b border-base-300 bg-base-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">Pair programming</h1>
          <span className={`badge ${connected ? "badge-success" : "badge-error"}`}>
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSelect value={language} onChange={handleLanguageChange} />
          <button
            type="button"
            className="btn btn-success btn-sm gap-1.5"
            onClick={handleRun}
            disabled={running}
            title="Run code"
          >
            {running ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
            {running ? "Running..." : "Run"}
          </button>
          <button
            type="button"
            className="btn btn-error btn-sm"
            onClick={() => navigate("/feed")}
          >
            Leave
          </button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-3 overflow-hidden p-3 lg:grid-cols-4">
        <div className="flex min-h-0 flex-col lg:col-span-3">
          <div className="surface relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1">
              <CodeEditor language={language} onMount={handleEditorMount} />
            </div>
            {/* Overlay, not a layout row, so it never pushes the editor up/down. */}
            {typingUser ? (
              <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-warning/90 px-3 py-1 text-xs font-medium text-warning-content shadow">
                {typingUser} is typing...
              </div>
            ) : null}
            <div className="max-h-48 overflow-auto border-t border-base-300 bg-base-300/40 p-3">
              <p className="mb-1 text-xs font-semibold text-success">Output</p>
              <pre className="whitespace-pre-wrap font-mono text-xs">
                {output || "Run your code to see the output here."}
              </pre>
            </div>
          </div>
        </div>

        <aside className="flex min-h-0 flex-col gap-3 overflow-auto">
          <CallPanel call={call} room={sessionId ?? ""} onStart={handleStartCall} />
          <div className="surface flex flex-col gap-3 p-4">
            <h2 className="font-semibold">Participants ({participants.length})</h2>
            {participants.length === 0 ? (
              <p className="text-sm text-base-content/60">Waiting for others to join...</p>
            ) : (
              participants.map((participant) => (
                <div
                  key={participant.socketId}
                  className="flex items-center gap-3 rounded-lg bg-base-200 p-2"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm text-primary-content">
                    {participant.userName.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate text-sm">{participant.userName}</span>
                </div>
              ))
            )}
          </div>

          <div className="surface flex min-h-64 flex-1 flex-col p-4">
            <h2 className="mb-2 font-semibold">Session chat</h2>
            <div className="flex-1 space-y-2 overflow-auto pr-1">
              {chatMessages.length === 0 ? (
                <p className="text-sm text-base-content/60">
                  Say hi to your pair — messages here are visible to everyone in
                  this session.
                </p>
              ) : (
                chatMessages.map((message, index) => {
                  const mine = message.userName === userName;
                  return (
                    <div
                      key={`${message.at}-${index}`}
                      className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
                    >
                      <span className="text-[10px] text-base-content/50">
                        {mine ? "You" : message.userName}
                      </span>
                      <span
                        className={`max-w-[90%] break-words rounded-lg px-3 py-1.5 text-sm ${
                          mine
                            ? "bg-primary text-primary-content"
                            : "bg-base-200"
                        }`}
                      >
                        {message.text}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                handleSendChat();
              }}
            >
              <input
                type="text"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Message the session..."
                className="input input-bordered input-sm flex-1"
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Send
              </button>
            </form>
          </div>
        </aside>
      </div>

      {incomingCallFrom && !call.inCall ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="surface w-full max-w-xs rounded-2xl p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center">
              <span className="absolute h-16 w-16 animate-ping rounded-full bg-primary/30" />
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-content">
                {incomingCallFrom.charAt(0).toUpperCase()}
              </span>
            </div>
            <h3 className="mt-4 text-lg font-bold">{incomingCallFrom}</h3>
            <p className="mt-1 text-sm text-base-content/60">
              wants you to join the video call
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleDeclineCall}
                className="btn btn-error btn-sm flex-1"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={handleAcceptCall}
                className="btn btn-success btn-sm flex-1"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CodeSession;
