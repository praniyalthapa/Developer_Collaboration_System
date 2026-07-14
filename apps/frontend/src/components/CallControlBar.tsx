import type { ReactNode } from "react";
import type { CallApi } from "../hooks/useCall";

const CircleButton = ({
  active,
  danger,
  onClick,
  label,
  big,
  children,
}: {
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
  label: string;
  big?: boolean;
  children: ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    className={`btn btn-circle ${big ? "btn-md" : "btn-sm"} ${
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

const icon = (big?: boolean) => (big ? "h-5 w-5" : "h-4 w-4");

// Shared mic / camera / screen-share / hang-up controls used by the compact
// call surfaces (CallPanel, CallDock) and the fullscreen CallScreen, so the
// buttons look and behave identically everywhere. `extra` slots in a
// surface-specific control (e.g. the expand-to-fullscreen toggle) before the
// end-call button.
export const CallControlBar = ({
  call,
  onEnd,
  endLabel = "Leave call",
  big,
  extra,
}: {
  call: CallApi;
  onEnd: () => void;
  endLabel?: string;
  big?: boolean;
  extra?: ReactNode;
}) => (
  <div className={`flex items-center justify-center ${big ? "gap-3" : "gap-2"}`}>
    <CircleButton
      big={big}
      active={call.micOn}
      onClick={call.toggleMic}
      label={call.micOn ? "Mute" : "Unmute"}
    >
      {call.micOn ? (
        <svg className={icon(big)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 10a7 7 0 0 0 14 0M12 17v4" />
        </svg>
      ) : (
        <svg className={icon(big)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 1l22 22M9 9v3a3 3 0 0 0 5 2M15 10V5a3 3 0 0 0-6 0M5 10a7 7 0 0 0 12 5M12 17v4" />
        </svg>
      )}
    </CircleButton>
    <CircleButton
      big={big}
      active={call.camOn}
      onClick={call.toggleCam}
      label={call.camOn ? "Turn camera off" : "Turn camera on"}
    >
      <svg className={icon(big)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M23 7l-7 5 7 5V7z" />
        <rect x="1" y="5" width="15" height="14" rx="2" />
      </svg>
    </CircleButton>
    <CircleButton
      big={big}
      active={call.sharing}
      onClick={() => void call.toggleScreenShare()}
      label={call.sharing ? "Stop sharing" : "Share screen"}
    >
      <svg className={icon(big)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    </CircleButton>
    {extra}
    <CircleButton big={big} danger onClick={onEnd} label={endLabel}>
      <svg className={icon(big)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15.46l-5.27-.61-2.52 2.52a15.05 15.05 0 0 1-6.59-6.59l2.53-2.53L8.54 3H3.03C2.45 13.18 10.82 21.55 21 20.97v-5.51z" />
        <path d="M23 1L1 23" />
      </svg>
    </CircleButton>
  </div>
);
