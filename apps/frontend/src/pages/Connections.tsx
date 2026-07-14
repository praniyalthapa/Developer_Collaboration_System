import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { setConnections } from "../features/connectionSlice";
import { getConnections } from "../api/user.api";
import { listChats } from "../api/chat.api";
import { timeAgo } from "../lib/format";
import { getActiveChat } from "../lib/activeChat";
import { Avatar } from "../components/Avatar";
import { Chat } from "../components/Chat";
import { PageHeader } from "../components/PageHeader";
import { Icon } from "../components/icons";
import { useOnlineUsers } from "../context/presenceStore";
import { FullScreenLoader } from "../components/ui/Loader";
import { EmptyState } from "../components/ui/EmptyState";
import type { ChatSummary, SafeUser } from "../types/models";

const Connections = () => {
  const dispatch = useAppDispatch();
  const connections = useAppSelector((state) => state.connection);
  const onlineUsers = useOnlineUsers();
  const [loading, setLoading] = useState(true);
  const [chatMap, setChatMap] = useState<Record<string, ChatSummary>>({});
  const [selected, setSelected] = useState<SafeUser | null>(null);
  const [query, setQuery] = useState("");

  const loadChats = () => {
    listChats()
      .then((chats) => {
        const map: Record<string, ChatSummary> = {};
        for (const chat of chats) {
          if (chat.participant) map[chat.participant._id] = chat;
        }
        setChatMap(map);
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    getConnections()
      .then((data) => {
        if (active) dispatch(setConnections(data));
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    loadChats();
    return () => {
      active = false;
    };
  }, [dispatch]);

  // Live inbox updates: when a message arrives, update that conversation's
  // preview + unread count so the list can reorder without a refetch.
  useEffect(() => {
    const onMessage = (event: Event) => {
      const detail = (
        event as CustomEvent<{ fromUserId: string; text: string; createdAt: string }>
      ).detail;
      if (!detail) return;
      const { fromUserId, text, createdAt } = detail;
      setChatMap((current) => {
        const existing = current[fromUserId];
        const viewing = getActiveChat() === fromUserId;
        return {
          ...current,
          [fromUserId]: {
            _id: existing?._id ?? fromUserId,
            participant: existing?.participant ?? null,
            latestMessage: { _id: `${createdAt}-${fromUserId}`, text, createdAt, senderId: fromUserId },
            unreadCount: viewing ? 0 : (existing?.unreadCount ?? 0) + 1,
          },
        };
      });
    };
    window.addEventListener("dc:message", onMessage);
    return () => window.removeEventListener("dc:message", onMessage);
  }, []);

  const totalUnread = useMemo(
    () => Object.values(chatMap).reduce((sum, chat) => sum + chat.unreadCount, 0),
    [chatMap],
  );

  const filtered = useMemo(() => {
    if (!connections) return [];
    const q = query.trim().toLowerCase();
    const matches = !q
      ? connections
      : connections.filter(
          (c) =>
            `${c.firstName} ${c.lastName ?? ""}`.toLowerCase().includes(q) ||
            c.skills.some((skill) => skill.toLowerCase().includes(q)),
        );
    // Messenger-style: most recent conversation first; connections with no
    // messages fall to the bottom in their existing order (stable sort).
    const lastActivity = (id: string) => {
      const at = chatMap[id]?.latestMessage?.createdAt;
      return at ? new Date(at).getTime() : 0;
    };
    return [...matches].sort((a, b) => lastActivity(b._id) - lastActivity(a._id));
  }, [connections, query, chatMap]);

  const selectConnection = (connection: SafeUser) => {
    setChatMap((current) => {
      const existing = current[connection._id];
      if (!existing) return current;
      return { ...current, [connection._id]: { ...existing, unreadCount: 0 } };
    });
    setSelected(connection);
  };

  if (loading) return <FullScreenLoader label="Loading connections..." />;

  if (!connections || connections.length === 0) {
    return (
      <>
        <PageHeader
          icon="users"
          eyebrow="Network"
          title="Connections"
          description="Developers you've matched with."
        />
        <EmptyState
          title="No connections yet"
          description="Head to Discover and connect with developers to start collaborating."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        icon="users"
        eyebrow="Network"
        title="Connections"
        description="Pick a conversation on the left to chat, call, or pair-program."
        actions={
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 font-mono text-xs text-primary">
            {totalUnread} unread
          </span>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <div
          className={`surface flex max-h-[78vh] flex-col overflow-hidden ${
            selected ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="border-b border-base-content/10 p-3">
            <div className="flex items-center gap-2 rounded-full bg-base-200 px-3.5 py-2">
              <Icon name="search" className="h-4 w-4 shrink-0 text-base-content/40" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search connections"
                className="w-full bg-transparent text-sm outline-none placeholder:text-base-content/40"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.map((connection) => {
              const chat = chatMap[connection._id];
              const isActive = selected?._id === connection._id;
              return (
                <div
                  key={connection._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectConnection(connection)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") selectConnection(connection);
                  }}
                  className={`flex cursor-pointer items-center gap-3 border-b border-base-content/[0.07] px-3.5 py-3 transition-colors last:border-b-0 ${
                    isActive ? "bg-primary/10" : "hover:bg-base-content/[0.04]"
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar
                      firstName={connection.firstName}
                      lastName={connection.lastName}
                      photoUrl={connection.photoUrl}
                      size="w-11 h-11"
                      className="ring-1 ring-base-content/10"
                    />
                    {onlineUsers.has(connection._id) ? (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-base-100 bg-success"
                        title="Online"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold leading-tight">
                        {connection.firstName} {connection.lastName}
                      </h3>
                      {chat?.latestMessage ? (
                        <span className="shrink-0 font-mono text-[10px] text-base-content/40">
                          {timeAgo(chat.latestMessage.createdAt)}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-base-content/55">
                        {chat?.latestMessage
                          ? chat.latestMessage.text
                          : "No messages yet"}
                      </p>
                      {chat && chat.unreadCount > 0 ? (
                        <span className="badge badge-primary badge-xs shrink-0 font-mono">
                          {chat.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 ? (
              <p className="py-10 text-center font-mono text-xs text-base-content/50">
                No matches for "{query}".
              </p>
            ) : null}
          </div>
        </div>

        <div className={selected ? "block" : "hidden lg:block"}>
          {selected ? (
            <Chat
              key={selected._id}
              targetUser={selected}
              onBack={() => {
                setSelected(null);
                loadChats();
              }}
            />
          ) : (
            <div className="surface flex h-[72vh] flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon name="message" className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">Your messages</p>
                <p className="mt-1 max-w-xs text-sm text-base-content/55">
                  Select a connection to chat, start a video call, or jump into a
                  shared code session.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Connections;
