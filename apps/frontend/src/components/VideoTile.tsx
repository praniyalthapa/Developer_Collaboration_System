import { useEffect, useRef } from "react";

interface VideoTileProps {
  stream: MediaStream | null;
  label: string;
  muted?: boolean;
  placeholder?: string;
  // Override the default `aspect-video` box — e.g. "h-full w-full" to fill a
  // fullscreen stage cell.
  className?: string;
  // "cover" crops to fill (good for small tiles); "contain" letterboxes so a
  // shared screen or a whole camera frame is never cropped (good when large).
  fit?: "cover" | "contain";
}

export const VideoTile = ({
  stream,
  label,
  muted,
  placeholder,
  className,
  fit = "cover",
}: VideoTileProps) => {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    el.srcObject = stream;
    el.muted = Boolean(muted);
    if (!stream) return undefined;

    let cancelled = false;
    let unmuteHandler: (() => void) | null = null;

    // Autoplay policy: browsers (especially mobile Safari/Chrome) refuse to
    // autoplay UNMUTED media without a user gesture — play() rejects with
    // NotAllowedError and the tile stays black. A muted element always plays,
    // which is why the local ("You") tile works but a remote one doesn't.
    // Fallback: if unmuted play is blocked, play muted so the VIDEO is at least
    // visible, then restore audio on the next tap anywhere in the page.
    const tryPlay = async () => {
      try {
        await el.play();
      } catch (err) {
        if (cancelled) return;
        // AbortError is the benign "interrupted by a new load" race — ignore.
        // NotAllowedError is the autoplay block we need to recover from.
        if ((err as DOMException)?.name === "NotAllowedError" && !muted) {
          el.muted = true;
          el.play().catch(() => undefined);
          if (!unmuteHandler) {
            unmuteHandler = () => {
              el.muted = Boolean(muted);
              el.play().catch(() => undefined);
              if (unmuteHandler) {
                window.removeEventListener("pointerdown", unmuteHandler);
                unmuteHandler = null;
              }
            };
            window.addEventListener("pointerdown", unmuteHandler);
          }
        }
      }
    };

    void tryPlay();
    el.addEventListener("loadedmetadata", tryPlay);
    return () => {
      cancelled = true;
      el.removeEventListener("loadedmetadata", tryPlay);
      if (unmuteHandler) window.removeEventListener("pointerdown", unmuteHandler);
    };
  }, [stream, muted]);

  const hasVideo = Boolean(stream && stream.getVideoTracks().length > 0);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-base-content/10 bg-black ${
        className ?? "aspect-video"
      }`}
    >
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        className={`h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"}`}
      />
      {!hasVideo ? (
        <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-white/50">
          {placeholder ?? "camera off"}
        </div>
      ) : null}
      <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">
        {label}
      </span>
    </div>
  );
};
