import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CallApi } from "../hooks/useCall";
import { VideoTile } from "./VideoTile";
import { CallControlBar } from "./CallControlBar";

// An immersive, full-viewport call view shared by the code-session panel and
// the messaging dock. The remote peer(s) fill the stage while the local camera
// sits as a small picture-in-picture. "Minimize" collapses back to the compact
// surface; the expand button toggles true browser fullscreen on top of that.
export const CallScreen = ({
  call,
  title,
  status,
  onEnd,
  endLabel,
  onMinimize,
}: {
  call: CallApi;
  title: string;
  // "outgoing" shows a "calling…" state; anything else reads as a live call.
  status?: "outgoing" | "active";
  onEnd: () => void;
  endLabel?: string;
  onMinimize: () => void;
}) => {
  const remotes = Object.entries(call.remotePeers);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nativeFs, setNativeFs] = useState(false);

  // Esc collapses the overlay — but only when we're NOT in native fullscreen,
  // where the browser uses Esc to exit fullscreen first.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.fullscreenElement) onMinimize();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onMinimize]);

  useEffect(() => {
    const sync = () => setNativeFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleNativeFs = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    } else {
      void containerRef.current?.requestFullscreen?.().catch(() => undefined);
    }
  };

  const waiting = remotes.length === 0;

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col bg-base-300"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate text-sm font-semibold">{title}</h3>
          <span className="font-mono text-[10px] uppercase tracking-wider text-success">
            {status === "outgoing" ? "● calling" : "● live"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleNativeFs}
            title={nativeFs ? "Exit fullscreen" : "Fullscreen"}
            aria-label={nativeFs ? "Exit fullscreen" : "Fullscreen"}
            className="btn btn-circle btn-sm border-base-content/15 bg-base-100/60 text-base-content/70"
          >
            {nativeFs ? (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={onMinimize}
            title="Minimize"
            aria-label="Minimize"
            className="btn btn-circle btn-sm border-base-content/15 bg-base-100/60 text-base-content/70"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 14h6v6M14 10h6V4M14 10l7-7M3 21l7-7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 px-4 pb-2">
        {waiting ? (
          <div className="flex h-full items-center justify-center">
            <p className="rounded-lg bg-base-content/5 px-4 py-3 text-center font-mono text-sm text-base-content/60">
              {status === "outgoing"
                ? `Calling ${title} — waiting for them to answer…`
                : "Waiting for the other side to join the call…"}
            </p>
          </div>
        ) : (
          <div
            className={`grid h-full gap-3 ${
              remotes.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {remotes.map(([id, peer]) => (
              <VideoTile
                key={id}
                stream={peer.stream}
                label={peer.userName}
                placeholder="connecting…"
                fit="contain"
                className="h-full w-full"
              />
            ))}
          </div>
        )}

        <div className="absolute bottom-3 right-6 w-40 max-w-[38vw] shadow-2xl">
          <VideoTile stream={call.localStream} label="You" muted placeholder="camera off" />
        </div>
      </div>

      {call.error ? (
        <p className="px-4 text-center text-xs text-error">{call.error}</p>
      ) : null}

      <div className="flex justify-center py-4">
        <CallControlBar call={call} big onEnd={onEnd} endLabel={endLabel} />
      </div>
    </div>,
    document.body,
  );
};
