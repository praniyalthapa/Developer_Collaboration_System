import { useState } from "react";
import type { FeedUser } from "../types/models";
import { getAvatarGradient, getInitials, resolvePhotoUrl } from "../lib/photo";

interface UserCardProps {
  user: FeedUser;
  showActions?: boolean;
  busy?: boolean;
  onPass?: (id: string) => void;
  onConnect?: (id: string) => void;
}

const matchColor = (score: number): string => {
  if (score >= 60) return "hsl(142 71% 45%)";
  if (score >= 30) return "hsl(38 92% 50%)";
  return "hsl(199 89% 48%)";
};

const MatchRing = ({ score }: { score: number }) => (
  <div
    className="flex h-12 w-12 items-center justify-center rounded-full"
    style={{
      background: `conic-gradient(${matchColor(score)} ${score}%, rgba(255,255,255,0.18) 0)`,
    }}
  >
    <div className="flex h-9 w-9 flex-col items-center justify-center rounded-full bg-base-100/90 text-[11px] font-bold leading-none">
      {score}
      <span className="text-[7px] font-medium opacity-60">MATCH</span>
    </div>
  </div>
);

export const UserCard = ({
  user,
  showActions = true,
  busy = false,
  onPass,
  onConnect,
}: UserCardProps) => {
  const [imageError, setImageError] = useState(false);
  const resolved = resolvePhotoUrl(user.photoUrl);
  const showImage = Boolean(resolved) && !imageError;
  const matchPercent =
    user.similarity !== undefined ? Math.round(user.similarity * 100) : null;

  return (
    <div className="surface surface-hover group flex w-full max-w-sm flex-col overflow-hidden">
      <figure className="relative h-52 overflow-hidden bg-base-300">
        {showImage ? (
          <img
            src={resolved}
            alt={`${user.firstName} ${user.lastName ?? ""}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${getAvatarGradient(
              `${user.firstName}${user.lastName ?? ""}`,
            )} text-5xl font-bold text-white`}
          >
            {getInitials(user.firstName, user.lastName)}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent" />
        {matchPercent !== null ? (
          <div className="absolute right-3 top-3">
            <MatchRing score={matchPercent} />
          </div>
        ) : null}
        <div className="absolute inset-x-4 bottom-3 text-white drop-shadow">
          <h3 className="text-lg font-bold leading-tight">
            {user.firstName} {user.lastName}
          </h3>
          {user.age && user.gender ? (
            <p className="text-xs text-white/80">
              {user.age} · {user.gender}
            </p>
          ) : null}
        </div>
      </figure>

      <div className="flex flex-1 flex-col gap-3 p-5">
        {user.about ? (
          <p className="line-clamp-2 text-sm text-base-content/70">{user.about}</p>
        ) : null}

        {user.skills.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {user.skills.slice(0, 5).map((skill) => (
              <span key={skill} className="skill-chip">
                {skill}
              </span>
            ))}
            {user.skills.length > 5 ? (
              <span className="skill-chip">+{user.skills.length - 5}</span>
            ) : null}
          </div>
        ) : null}

        <div className="flex-1" />

        {showActions && onPass && onConnect ? (
          <div className="flex gap-2.5">
            <button
              type="button"
              className="btn btn-ghost flex-1 border border-base-content/15"
              disabled={busy}
              onClick={() => onPass(user._id)}
            >
              Pass
            </button>
            <button
              type="button"
              className="btn btn-brand flex-1"
              disabled={busy}
              onClick={() => onConnect(user._id)}
            >
              Connect
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
