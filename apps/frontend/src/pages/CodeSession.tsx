import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import { getCodeSession } from "../api/codeSession.api";
import { createSocket, type AppSocket, type Participant } from "../lib/socket";
import { runCode } from "../lib/runCode";
import { useCall } from "../hooks/useCall";
import { CodeEditor } from "../components/CodeEditor";
import { CallPanel } from "../components/CallPanel";
import { LanguageSelect } from "../components/LanguageSelect";
import { FullScreenLoader } from "../components/ui/Loader";

const CodeSession = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.user);

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [connected, setConnected] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<AppSocket | null>(null);

  const socketRef = useRef<AppSocket | null>(null);
  const codeTimer = useRef<number | null>(null);
  const typingTimer = useRef<number | null>(null);

  const userName = user ? `${user.firstName} ${user.lastName ?? ""}`.trim() : "";
  const call = useCall(socket, userName);

  useEffect(() => {
    if (!sessionId) return undefined;
    let active = true;
    getCodeSession(sessionId)
      .then((session) => {
        if (!active) return;
        setCode(session.code);
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
    const socket = createSocket();
    socketRef.current = socket;
    setSocket(socket);

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("joinCodeSession", { sessionId, userId: user._id, userName });
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("codeUpdate", ({ code: incoming, language: incomingLanguage }) => {
      setCode(incoming);
      if (incomingLanguage) setLanguage(incomingLanguage);
    });
    socket.on("languageUpdate", ({ language: incoming }) => setLanguage(incoming));
    socket.on("participantJoined", ({ participants: next }) => setParticipants(next));
    socket.on("participantLeft", ({ participants: next }) => setParticipants(next));
    socket.on("userTyping", ({ userName: typer }) => {
      setTypingUser(typer);
      if (typingTimer.current) window.clearTimeout(typingTimer.current);
      typingTimer.current = window.setTimeout(() => setTypingUser(null), 2500);
    });
    socket.on("userStoppedTyping", () => setTypingUser(null));

    return () => {
      socket.emit("leaveCodeSession", { sessionId, userName });
      socket.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [sessionId, user, userName]);

  const handleCodeChange = (next: string) => {
    setCode(next);
    if (!socketRef.current || !connected || !sessionId) return;
    socketRef.current.emit("userTyping", { sessionId, userName });
    if (codeTimer.current) window.clearTimeout(codeTimer.current);
    codeTimer.current = window.setTimeout(() => {
      socketRef.current?.emit("codeChange", { sessionId, code: next });
      socketRef.current?.emit("userStoppedTyping", { sessionId });
    }, 300);
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
    const result = await runCode(language, code);
    setOutput(result.output);
    setRunning(false);
  };

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
          <div className="surface flex min-h-0 flex-1 flex-col overflow-hidden">
            {typingUser ? (
              <div className="bg-warning/15 px-4 py-1 text-xs text-base-content/70">
                {typingUser} is typing...
              </div>
            ) : null}
            <div className="min-h-0 flex-1">
              <CodeEditor value={code} language={language} onChange={handleCodeChange} />
            </div>
            <div className="max-h-48 overflow-auto border-t border-base-300 bg-base-300/40 p-3">
              <p className="mb-1 text-xs font-semibold text-success">Output</p>
              <pre className="whitespace-pre-wrap font-mono text-xs">
                {output || "Run your code to see the output here."}
              </pre>
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-3 overflow-auto">
          <CallPanel call={call} room={sessionId ?? ""} />
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
        </aside>
      </div>
    </div>
  );
};

export default CodeSession;
