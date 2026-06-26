import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { FeedUser } from "../types/models";
import { getAvatarGradient, getInitials, resolvePhotoUrl } from "../lib/photo";

type Direction = "left" | "right";

interface SwipeDeckProps {
  users: FeedUser[];
  busy?: boolean;
  onDecision: (id: string, status: "interested" | "ignored") => void;
}

const SWIPE_THRESHOLD = 110;

const DeckCardContent = ({ user }: { user: FeedUser }) => {
  const [imageError, setImageError] = useState(false);
  const resolved = resolvePhotoUrl(user.photoUrl);
  const showImage = Boolean(resolved) && !imageError;
  const matchPercent =
    user.similarity !== undefined ? Math.round(user.similarity * 100) : null;

  return (
    <>
      {showImage ? (
        <img
          src={resolved}
          alt={`${user.firstName} ${user.lastName ?? ""}`}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
          onError={() => setImageError(true)}
        />
      ) : (
        <div
          className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${getAvatarGradient(
            `${user.firstName}${user.lastName ?? ""}`,
          )} text-7xl font-bold text-white`}
        >
          {getInitials(user.firstName, user.lastName)}
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/25" />

      {matchPercent !== null ? (
        <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="font-mono text-xs font-semibold text-white">
            {matchPercent}% match
          </span>
        </div>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 space-y-3 p-6 text-white">
        <div>
          <h3 className="text-2xl font-extrabold tracking-tight drop-shadow">
            {user.firstName} {user.lastName}
          </h3>
          {user.age && user.gender ? (
            <p className="font-mono text-xs text-white/75">
              {user.age} · {user.gender}
            </p>
          ) : null}
        </div>
        {user.about ? (
          <p className="line-clamp-2 text-sm text-white/85">{user.about}</p>
        ) : null}
        {user.skills.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {user.skills.slice(0, 5).map((skill) => (
              <span
                key={skill}
                className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 font-mono text-[11px] font-medium text-white backdrop-blur"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
};

export const SwipeDeck = ({ users, busy = false, onDecision }: SwipeDeckProps) => {
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [exitDir, setExitDir] = useState<Direction | null>(null);
  const startRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef({ x: 0, y: 0 });

  const top = users[0];

  const commit = (direction: Direction) => {
    if (!top || busy || exitDir) return;
    setExitDir(direction);
    const id = top._id;
    const status = direction === "right" ? "interested" : "ignored";
    window.setTimeout(() => {
      onDecision(id, status);
      setExitDir(null);
      setDrag({ x: 0, y: 0 });
      dragRef.current = { x: 0, y: 0 };
    }, 280);
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!top || exitDir || busy) return;
      if (event.key === "ArrowRight") commit("right");
      if (event.key === "ArrowLeft") commit("left");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [top, exitDir, busy]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (busy || exitDir) return;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    startRef.current = { x: event.clientX, y: event.clientY };
    setDragging(true);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const next = {
      x: event.clientX - startRef.current.x,
      y: event.clientY - startRef.current.y,
    };
    dragRef.current = next;
    setDrag(next);
  };

  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    const { x } = dragRef.current;
    if (x > SWIPE_THRESHOLD) commit("right");
    else if (x < -SWIPE_THRESHOLD) commit("left");
    else {
      setDrag({ x: 0, y: 0 });
      dragRef.current = { x: 0, y: 0 };
    }
  };

  const likeOpacity = Math.min(Math.max(drag.x / 110, 0), 1);
  const nopeOpacity = Math.min(Math.max(-drag.x / 110, 0), 1);

  const topStyle = (): CSSProperties => {
    if (exitDir) {
      const sign = exitDir === "right" ? 1 : -1;
      return {
        transform: `translateX(${sign * 130}%) rotate(${sign * 22}deg)`,
        opacity: 0,
        transition: "transform 0.3s ease, opacity 0.3s ease",
      };
    }
    return {
      transform: `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x * 0.05}deg)`,
      transition: dragging ? "none" : "transform 0.3s cubic-bezier(0.22,1,0.36,1)",
      cursor: dragging ? "grabbing" : "grab",
    };
  };

  const stack = users.slice(0, 3);

  return (
    <div className="flex flex-col items-center gap-7">
      <div className="relative h-[30rem] w-full max-w-sm select-none sm:h-[32rem]">
        {stack
          .map((user, index) => ({ user, index }))
          .reverse()
          .map(({ user, index }) => {
            const isTop = index === 0;
            const depthStyle: CSSProperties = isTop
              ? topStyle()
              : {
                  transform: `translateY(${index * 14}px) scale(${1 - index * 0.05})`,
                  transition: "transform 0.3s ease",
                  filter: "brightness(0.85)",
                };
            return (
              <div
                key={user._id}
                className="gradient-border absolute inset-0 overflow-hidden rounded-[1.5rem] bg-base-300 shadow-card-hover"
                style={{ ...depthStyle, zIndex: 10 - index }}
                onPointerDown={isTop ? onPointerDown : undefined}
                onPointerMove={isTop ? onPointerMove : undefined}
                onPointerUp={isTop ? onPointerUp : undefined}
                onPointerCancel={isTop ? onPointerUp : undefined}
              >
                <DeckCardContent user={user} />
                {isTop ? (
                  <>
                    <span
                      className="pointer-events-none absolute left-5 top-6 -rotate-12 rounded-lg border-4 border-emerald-400 px-3 py-1 font-mono text-xl font-extrabold uppercase tracking-wider text-emerald-400"
                      style={{ opacity: likeOpacity }}
                    >
                      Connect
                    </span>
                    <span
                      className="pointer-events-none absolute right-5 top-6 rotate-12 rounded-lg border-4 border-rose-400 px-3 py-1 font-mono text-xl font-extrabold uppercase tracking-wider text-rose-400"
                      style={{ opacity: nopeOpacity }}
                    >
                      Pass
                    </span>
                  </>
                ) : null}
              </div>
            );
          })}
      </div>

      <div className="flex items-center gap-5">
        <button
          type="button"
          aria-label="Pass"
          disabled={busy || !top}
          onClick={() => commit("left")}
          className="btn btn-circle btn-lg border border-base-content/15 bg-base-100/70 text-rose-400 hover:border-rose-400 hover:bg-rose-400/10"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Connect"
          disabled={busy || !top}
          onClick={() => commit("right")}
          className="btn btn-circle btn-lg btn-brand"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      <p className="font-mono text-xs text-base-content/50">
        Drag the card, tap a button, or use{" "}
        <span className="kbd-key">←</span> <span className="kbd-key">→</span>
      </p>
    </div>
  );
};
