import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { createSocket } from "../lib/socket";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { getReceivedRequests } from "../api/user.api";
import { setRequests } from "../features/requestSlice";
import { playMessageChime } from "../lib/notify";
import { useToast } from "./toastStore";
import { OnlineUsersContext } from "./presenceStore";

export const PresenceProvider = ({ children }: { children: ReactNode }) => {
  const userId = useAppSelector((state) => state.user?._id);
  const [online, setOnline] = useState<Set<string>>(new Set());
  const { push } = useToast();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

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

    // A new connection request arrived — surface it as a toast the user can
    // click to jump straight to their pending requests.
    socket.on("connectionRequestReceived", ({ fromName }) => {
      push({
        title: "New connection request",
        body: `${fromName} wants to connect with you`,
        variant: "info",
        onClick: () => navigate("/requests"),
      });
      playMessageChime();
      // Refresh the pending-request list so the Requests nav badge ticks up.
      getReceivedRequests()
        .then((data) => dispatch(setRequests(data)))
        .catch(() => undefined);
    });

    return () => {
      socket.disconnect();
      setOnline(new Set());
    };
  }, [userId, push, navigate, dispatch]);

  return (
    <OnlineUsersContext.Provider value={online}>
      {children}
    </OnlineUsersContext.Provider>
  );
};
