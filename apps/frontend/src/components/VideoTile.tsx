import { useEffect, useRef } from "react";

interface VideoTileProps {
  stream: MediaStream | null;
  label: string;
  muted?: boolean;
  placeholder?: string;
}

export const VideoTile = ({ stream, label, muted, placeholder }: VideoTileProps) => {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);

  const hasVideo = Boolean(stream && stream.getVideoTracks().length > 0);

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-base-content/10 bg-black">
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        className="h-full w-full object-cover"
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
