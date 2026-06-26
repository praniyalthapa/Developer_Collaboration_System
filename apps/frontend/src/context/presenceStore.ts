import { createContext, useContext } from "react";

export const OnlineUsersContext = createContext<Set<string>>(new Set());

export const useOnlineUsers = (): Set<string> => useContext(OnlineUsersContext);

export const useIsOnline = (userId?: string): boolean => {
  const online = useContext(OnlineUsersContext);
  return userId ? online.has(userId) : false;
};
