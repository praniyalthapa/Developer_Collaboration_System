import { useEffect, useState, type ReactNode } from "react";
import { createSocket } from "../lib/socket";
import { useAppSelector } from "../app/hooks";
import { OnlineUsersContext } from "./presenceStore";

export const PresenceProvider = ({ children }: { children: ReactNode }) => {
  const userId = useAppSelector((state) => state.user?._id);
  const [online, setOnline] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return undefined;
    const socket = createSocket();

    socket.on("connect", () => socket.emit("presenceJoin", { userId }));
    socket.on("presenceState", ({ userIds }) => setOnline(new Set(userIds)));
    socket.on("presenceOnline", ({ userId: id }) =>
      setOnline((previous) => new Set(previous).add(id)),
    );
    socket.on("presenceOffline", ({ userId: id }) =>
      setOnline((previous) => {
        const next = new Set(previous);
        next.delete(id);
        return next;
      }),
    );

    return () => {
      socket.disconnect();
      setOnline(new Set());
    };
  }, [userId]);

  return (
    <OnlineUsersContext.Provider value={online}>
      {children}
    </OnlineUsersContext.Provider>
  );
};
