import { useEffect, useState } from "react";
import type { CallApi } from "../hooks/useCall";
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

export const CallPanel = ({
  call,
  room,
  onStart,
}: {
  call: CallApi;
  room: string;
  onStart?: () => void;
}) => {
  const remotes = Object.entries(call.remotePeers);
  const [fullscreen, setFullscreen] = useState(false);

  // If the call ends (peer leaves, we hang up elsewhere), drop out of fullscreen
  // so the overlay never lingers over an empty call.
  useEffect(() => {
    if (!call.inCall) setFullscreen(false);
  }, [call.inCall]);

  if (!call.inCall) {
    return (
      <div className="surface gradient-border p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 7l-7 5 7 5V7z" />
            <rect x="1" y="5" width="15" height="14" rx="2" />
          </svg>
          Video call
        </h3>
        <p className="mt-1 text-xs text-base-content/55">
          Talk and share your screen while you pair-program.
        </p>
        {call.error ? (
          <p className="mt-2 text-xs text-error">{call.error}</p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            void call.joinCall(room);
            onStart?.();
          }}
          className="btn btn-brand btn-sm mt-3 w-full"
        >
          Start call
        </button>
      </div>
    );
  }

  return (
    <div className="surface gradient-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Video call</h3>
        <span className="font-mono text-[10px] uppercase tracking-wider text-success">
          ● live
        </span>
      </div>

      <div className="space-y-2">
        {remotes.length === 0 ? (
          <p className="rounded-lg bg-base-content/5 px-3 py-2 text-xs text-base-content/55">
            Waiting for the other developer to join the call...
          </p>
        ) : (
          remotes.map(([id, peer]) => (
            <VideoTile
              key={id}
              stream={peer.stream}
              label={peer.userName}
              placeholder="connecting..."
            />
          ))
        )}
        <VideoTile stream={call.localStream} label="You" muted placeholder="camera off" />
      </div>

      {call.error ? (
        <p className="mt-2 text-xs text-error">{call.error}</p>
      ) : null}

      <div className="mt-3">
        <CallControlBar
          call={call}
          onEnd={call.leaveCall}
          endLabel="Leave call"
          extra={<ExpandButton onClick={() => setFullscreen(true)} />}
        />
      </div>

      {fullscreen ? (
        <CallScreen
          call={call}
          title="Video call"
          status="active"
          onEnd={() => {
            call.leaveCall();
            setFullscreen(false);
          }}
          endLabel="Leave call"
          onMinimize={() => setFullscreen(false)}
        />
      ) : null}
    </div>
  );
};
