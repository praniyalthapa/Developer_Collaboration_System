import { useEffect } from "react";
import { useCallContext } from "../context/callStore";
import { Avatar } from "./Avatar";

// A short repeating ring tone via the Web Audio API (no asset needed).
const useRingtone = (active: boolean): void => {
  useEffect(() => {
    if (!active) return undefined;
    let ctx: AudioContext | null = null;
    let interval: number | undefined;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      ctx = new AudioCtx();
      const beep = () => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 480;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      };
      beep();
      interval = window.setInterval(beep, 2500);
    } catch {
      /* autoplay blocked — the visual dialog still shows */
    }
    return () => {
      if (interval) window.clearInterval(interval);
      ctx?.close().catch(() => undefined);
    };
  }, [active]);
};

export const IncomingCallDialog = () => {
  const { status, peer, accept, decline } = useCallContext();
  const showing = status === "incoming";
  useRingtone(showing);

  if (!showing || !peer) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="surface w-full max-w-xs rounded-2xl p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center">
          <span className="absolute h-20 w-20 animate-ping rounded-full bg-primary/30" />
          <Avatar
            firstName={peer.name}
            photoUrl={peer.photoUrl}
            size="w-20 h-20"
            className="relative ring-2 ring-primary/40"
          />
        </div>
        <h3 className="mt-4 text-lg font-bold">{peer.name}</h3>
        <p className="mt-1 font-mono text-xs text-base-content/55">
          Incoming video call…
        </p>

        <div className="mt-6 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={decline}
            className="flex flex-col items-center gap-1.5"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-error text-white shadow-lg transition hover:brightness-110">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15.46l-5.27-.61-2.52 2.52a15.05 15.05 0 0 1-6.59-6.59l2.53-2.53L8.54 3H3.03C2.45 13.18 10.82 21.55 21 20.97v-5.51z" />
                <path d="M23 1L1 23" />
              </svg>
            </span>
            <span className="text-xs text-base-content/60">Decline</span>
          </button>
          <button
            type="button"
            onClick={accept}
            className="flex flex-col items-center gap-1.5"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success text-white shadow-lg transition hover:brightness-110">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" />
              </svg>
            </span>
            <span className="text-xs text-base-content/60">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
};
