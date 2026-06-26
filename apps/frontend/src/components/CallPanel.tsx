import type { CallApi } from "../hooks/useCall";
import { VideoTile } from "./VideoTile";

const ControlButton = ({
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
        ? "bg-error/15 text-error hover:bg-error/25 border-error/30"
        : active
          ? "bg-primary/20 text-primary border-primary/40"
          : "border-base-content/15 bg-base-100/60 text-base-content/70"
    }`}
  >
    {children}
  </button>
);

export const CallPanel = ({ call }: { call: CallApi }) => {
  const remotes = Object.entries(call.remotePeers);

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
          onClick={() => void call.joinCall()}
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

      <div className="mt-3 flex items-center justify-center gap-2">
        <ControlButton active={call.micOn} onClick={call.toggleMic} label={call.micOn ? "Mute" : "Unmute"}>
          {call.micOn ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 10a7 7 0 0 0 14 0M12 17v4" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 1l22 22M9 9v3a3 3 0 0 0 5 2M15 10V5a3 3 0 0 0-6 0M5 10a7 7 0 0 0 12 5M12 17v4" />
            </svg>
          )}
        </ControlButton>
        <ControlButton active={call.camOn} onClick={call.toggleCam} label={call.camOn ? "Turn camera off" : "Turn camera on"}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 7l-7 5 7 5V7z" />
            <rect x="1" y="5" width="15" height="14" rx="2" />
          </svg>
        </ControlButton>
        <ControlButton active={call.sharing} onClick={() => void call.toggleScreenShare()} label={call.sharing ? "Stop sharing" : "Share screen"}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
        </ControlButton>
        <ControlButton danger onClick={call.leaveCall} label="Leave call">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15.46l-5.27-.61-2.52 2.52a15.05 15.05 0 0 1-6.59-6.59l2.53-2.53L8.54 3H3.03C2.45 13.18 10.82 21.55 21 20.97v-5.51z" />
            <path d="M23 1L1 23" />
          </svg>
        </ControlButton>
      </div>
    </div>
  );
};
