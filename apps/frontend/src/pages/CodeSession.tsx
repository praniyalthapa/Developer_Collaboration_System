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

// Editor "tab" metadata per language — the filename shown in the editor chrome
// mirrors what the backend actually writes to disk when running the code.
const LANG_META: Record<string, { file: string; color: string }> = {
  javascript: { file: "main.js", color: "#f7df1e" },
  typescript: { file: "main.ts", color: "#3178c6" },
  python: { file: "main.py", color: "#3776ab" },
  java: { file: "Main.java", color: "#f89820" },
  go: { file: "main.go", color: "#00add8" },
};

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
  // The participants list (from the server) includes ourselves, so a call only
  // makes sense once someone with a different userId is also in the session.
  const otherPresent = participants.some((p) => p.userId !== user?._id);
  const langMeta = LANG_META[language] ?? { file: "main.txt", color: "#8b5cf6" };
  const [copied, setCopied] = useState(false);
  const call = useCall(socket, userName, user?._id);

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

  const handleCopySession = () => {
    if (!sessionId) return;
    void navigator.clipboard?.writeText(sessionId).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  };

  if (loading) return <FullScreenLoader label="Opening session..." />;

  return (
    <div className="fixed inset-0 flex flex-col bg-base-200">
      <header className="glass-strong z-20 flex items-center justify-between gap-4 border-b border-base-content/10 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-extrabold text-primary-content shadow-sm">
            DC
          </span>
          <div className="leading-tight">
            <h1 className="text-sm font-bold sm:text-base">Pair Programming</h1>
            <button
              type="button"
              onClick={handleCopySession}
              title="Copy session ID"
              className="group flex items-center gap-1 font-mono text-[11px] text-base-content/45 transition-colors hover:text-primary"
            >
              <span className="max-w-[130px] truncate">#{sessionId}</span>
              {copied ? (
                <span className="text-success">copied!</span>
              ) : (
                <svg className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              connected ? "bg-success/15 text-success" : "bg-error/15 text-error"
            }`}
          >
            <span className="relative flex h-2 w-2">
              {connected ? (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/70" />
              ) : null}
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  connected ? "bg-success" : "bg-error"
                }`}
              />
            </span>
            {connected ? "Live" : "Offline"}
          </span>

          {participants.length > 0 ? (
            <div className="hidden items-center -space-x-2 sm:flex">
              {participants.slice(0, 4).map((p) => (
                <span
                  key={p.socketId}
                  title={p.userName}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-[11px] font-semibold text-primary-content ring-2 ring-base-100"
                >
                  {p.userName.charAt(0).toUpperCase()}
                </span>
              ))}
              {participants.length > 4 ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-base-300 text-[10px] font-semibold ring-2 ring-base-100">
                  +{participants.length - 4}
                </span>
              ) : null}
            </div>
          ) : null}

          <LanguageSelect value={language} onChange={handleLanguageChange} />
          <button
            type="button"
            className="btn btn-brand btn-sm gap-1.5"
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
            className="btn btn-ghost btn-sm gap-1.5 text-error hover:bg-error/10"
            onClick={() => navigate("/feed")}
            title="Leave session"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-3 overflow-hidden p-3 lg:grid-cols-4">
        <div className="flex min-h-0 flex-col lg:col-span-3">
          <div className="surface relative flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Editor window chrome: traffic lights + active filename + typing */}
            <div className="flex items-center justify-between border-b border-base-content/10 bg-base-200/60 px-4 py-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-error/70" />
                  <span className="h-3 w-3 rounded-full bg-warning/70" />
                  <span className="h-3 w-3 rounded-full bg-success/70" />
                </div>
                <span className="flex items-center gap-1.5 rounded-md bg-base-100/70 px-2 py-0.5 font-mono text-xs">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: langMeta.color }} />
                  {langMeta.file}
                </span>
              </div>
              {typingUser ? (
                <span className="flex items-center gap-1.5 text-xs font-medium text-warning">
                  <span className="flex gap-0.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-warning [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-warning [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-warning" />
                  </span>
                  {typingUser} is typing
                </span>
              ) : null}
            </div>

            <div className="min-h-0 flex-1">
              <CodeEditor language={language} onMount={handleEditorMount} />
            </div>

            {/* Terminal-style output */}
            <div className="flex max-h-52 flex-col border-t border-base-content/10 bg-base-300/40">
              <div className="flex items-center gap-2 border-b border-base-content/5 px-4 py-1.5">
                <svg className="h-3.5 w-3.5 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 17l6-6-6-6M12 19h8" />
                </svg>
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-base-content/60">
                  Output
                </span>
                {running ? (
                  <span className="ml-auto flex items-center gap-1.5 text-[11px] text-base-content/50">
                    <span className="loading loading-spinner loading-xs" />
                    running
                  </span>
                ) : null}
              </div>
              <pre className="overflow-auto whitespace-pre-wrap px-4 py-3 font-mono text-xs leading-relaxed text-base-content/85">
                {output || (
                  <span className="text-base-content/35">
                    Press <span className="kbd-key">Run</span> to execute your code…
                  </span>
                )}
              </pre>
            </div>
          </div>
        </div>

        <aside className="flex min-h-0 flex-col gap-3 overflow-auto">
          <CallPanel
            call={call}
            room={sessionId ?? ""}
            onStart={handleStartCall}
            canStart={otherPresent}
          />
          <div className="surface flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">
                Participants
              </h2>
              <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[11px] font-semibold text-primary">
                {participants.length}
              </span>
            </div>
            {participants.length === 0 ? (
              <p className="py-2 text-sm text-base-content/50">Waiting for others to join…</p>
            ) : (
              participants.map((participant) => {
                const mine = participant.userId === user?._id;
                return (
                  <div
                    key={participant.socketId}
                    className="flex items-center gap-3 rounded-xl bg-base-200/60 p-2 transition-colors hover:bg-base-200"
                  >
                    <span className="relative">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-semibold text-primary-content">
                        {participant.userName.charAt(0).toUpperCase()}
                      </span>
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success ring-2 ring-base-100" />
                    </span>
                    <span className="truncate text-sm font-medium">
                      {participant.userName}
                      {mine ? (
                        <span className="ml-1 text-xs font-normal text-base-content/45">(you)</span>
                      ) : null}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="surface flex min-h-64 flex-1 flex-col p-4">
            <h2 className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-base-content/50">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Session chat
            </h2>
            <div className="flex-1 space-y-2.5 overflow-auto pr-1">
              {chatMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5M21 12a9 9 0 0 1-13.5 7.8L3 21l1.2-4.5A9 9 0 1 1 21 12z" />
                    </svg>
                  </span>
                  <p className="text-sm text-base-content/50">
                    Say hi to your pair — messages here are visible to everyone in
                    the session.
                  </p>
                </div>
              ) : (
                chatMessages.map((message, index) => {
                  const mine = message.userName === userName;
                  return (
                    <div
                      key={`${message.at}-${index}`}
                      className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
                    >
                      <span className="mb-0.5 px-1 text-[10px] text-base-content/45">
                        {mine ? "You" : message.userName}
                      </span>
                      <span
                        className={`max-w-[90%] break-words px-3 py-1.5 text-sm shadow-sm ${
                          mine
                            ? "rounded-2xl rounded-br-md bg-primary text-primary-content"
                            : "rounded-2xl rounded-bl-md bg-base-200"
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
              className="mt-3 flex items-center gap-2 rounded-full border border-base-content/10 bg-base-200/60 p-1 pl-4 focus-within:border-primary/50"
              onSubmit={(event) => {
                event.preventDefault();
                handleSendChat();
              }}
            >
              <input
                type="text"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Message the session…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-base-content/40"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="btn btn-brand btn-sm btn-circle"
                title="Send"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
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
