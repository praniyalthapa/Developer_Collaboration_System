import { useEffect, useState } from "react";
import { useCallContext } from "../context/callStore";
import { VideoTile } from "./VideoTile";
import { CallControlBar } from "./CallControlBar";
import { CallScreen } from "./CallScreen";

const ExpandButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    title="Fullscreen"
    aria-label="Fullscreen"
    className="btn btn-circle btn-sm border-base-content/15 bg-base-100/60 text-base-content/70"
  >
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  </button>
);

export const CallDock = () => {
  const { status, peer, media, hangUp } = useCallContext();
  const [fullscreen, setFullscreen] = useState(false);

  // The provider keeps this component mounted across calls, so clear any stale
  // fullscreen state once we return to idle.
  useEffect(() => {
    if (status === "idle" || status === "incoming") setFullscreen(false);
  }, [status]);

  if (status !== "outgoing" && status !== "active") return null;

  const remotes = Object.entries(media.remotePeers);
  const endCall = () => {
    hangUp();
    setFullscreen(false);
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[80] w-[min(92vw,22rem)]">
        <div className="surface gradient-border overflow-hidden rounded-2xl p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="truncate text-sm font-semibold">
              {peer?.name ?? "Video call"}
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-wider text-success">
              {status === "outgoing" ? "● calling" : "● live"}
            </span>
          </div>

          <div className="space-y-2">
            {status === "outgoing" && remotes.length === 0 ? (
              <p className="rounded-lg bg-base-content/5 px-3 py-2 text-center font-mono text-xs text-base-content/55">
                Calling {peer?.name ?? "…"} — waiting for them to answer…
              </p>
            ) : (
              remotes.map(([id, remote]) => (
                <VideoTile
                  key={id}
                  stream={remote.stream}
                  label={remote.userName}
                  placeholder="connecting…"
                />
              ))
            )}
            <div className="w-28">
              <VideoTile
                stream={media.localStream}
                label="You"
                muted
                placeholder="camera off"
              />
            </div>
          </div>

          {media.error ? (
            <p className="mt-2 text-xs text-error">{media.error}</p>
          ) : null}

          <div className="mt-3">
            <CallControlBar
              call={media}
              onEnd={endCall}
              endLabel="End call"
              extra={<ExpandButton onClick={() => setFullscreen(true)} />}
            />
          </div>
        </div>
      </div>

      {fullscreen ? (
        <CallScreen
          call={media}
          title={peer?.name ?? "Video call"}
          status={status}
          onEnd={endCall}
          endLabel="End call"
          onMinimize={() => setFullscreen(false)}
        />
      ) : null}
    </>
  );
};
