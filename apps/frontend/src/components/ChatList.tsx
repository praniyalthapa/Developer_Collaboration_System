import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { listChats } from "../api/chat.api";

export const ChatList = () => {
  const [unreadTotal, setUnreadTotal] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const refresh = useCallback(() => {
    listChats()
      .then((chats) =>
        setUnreadTotal(chats.reduce((total, chat) => total + chat.unreadCount, 0)),
      )
      .catch(() => undefined);
  }, []);

  // Re-check the unread count on mount and whenever the route changes, so
  // reading messages and moving around the app keeps the badge honest.
  useEffect(() => {
    refresh();
  }, [refresh, location.pathname]);

  useEffect(() => {
    // A conversation was just read — give the server a beat to persist the
    // read receipt, then refresh so the badge actually clears.
    const onRead = () => window.setTimeout(refresh, 400);
    const onFocus = () => refresh();
    window.addEventListener("chat:read", onRead);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("chat:read", onRead);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  return (
    <button
      type="button"
      onClick={() => navigate("/connections")}
      className="btn btn-ghost btn-circle btn-sm relative"
      title="Messages"
      aria-label="Messages"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      {unreadTotal > 0 ? (
        <span className="badge badge-primary badge-xs absolute -right-1 -top-1">
          {unreadTotal > 9 ? "9+" : unreadTotal}
        </span>
      ) : null}
    </button>
  );
};
