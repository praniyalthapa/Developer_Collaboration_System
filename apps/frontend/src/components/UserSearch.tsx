import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchUsers } from "../api/user.api";
import { sendRequest } from "../api/request.api";
import { getErrorMessage } from "../lib/apiClient";
import { useToast } from "../context/toastStore";
import { Avatar } from "./Avatar";
import { Icon } from "./icons";
import type { RelationshipStatus, SearchUser } from "../types/models";

export const UserSearch = () => {
  const { push } = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const reqRef = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const token = (reqRef.current += 1);
    const timer = window.setTimeout(() => {
      searchUsers(q)
        .then((users) => {
          if (reqRef.current === token) setResults(users);
        })
        .catch(() => {
          if (reqRef.current === token) setResults([]);
        })
        .finally(() => {
          if (reqRef.current === token) setLoading(false);
        });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const connect = async (user: SearchUser) => {
    setSent((current) => ({ ...current, [user._id]: true }));
    try {
      await sendRequest("interested", user._id);
      push({
        variant: "success",
        title: `Request sent to ${user.firstName}`,
      });
    } catch (error) {
      const message = getErrorMessage(error);
      if (/already exists/i.test(message)) {
        // A request already exists (pending/handled) — that is NOT the same as
        // being connected, so keep the button in its "requested" state and say so.
        push({
          variant: "info",
          title: `A request already exists with ${user.firstName}`,
        });
      } else {
        setSent((current) => ({ ...current, [user._id]: false }));
        push({ variant: "error", title: "Could not send request", body: message });
      }
    }
  };

  // A just-sent request (optimistic) takes precedence over the fetched status.
  const effectiveStatus = (user: SearchUser): RelationshipStatus =>
    sent[user._id] ? "requested" : user.connectionStatus;

  const showResults = useMemo(() => query.trim().length >= 2, [query]);

  return (
    <div className="surface p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Icon name="search" className="h-4 w-4 text-primary" />
        Find a developer by name
      </h2>
      <div className="mt-3 flex items-center gap-2 rounded-full bg-base-200 px-3.5 py-2">
        <Icon name="search" className="h-4 w-4 shrink-0 text-base-content/40" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Type a name to send a connection request…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-base-content/40"
        />
      </div>

      {showResults ? (
        <div className="mt-3 space-y-1.5">
          {loading ? (
            <p className="py-4 text-center font-mono text-xs text-base-content/50">
              Searching…
            </p>
          ) : results.length === 0 ? (
            <p className="py-4 text-center font-mono text-xs text-base-content/50">
              No developers match "{query.trim()}".
            </p>
          ) : (
            results.map((user) => (
              <div
                key={user._id}
                className="flex items-center gap-3 rounded-xl border border-base-content/[0.07] px-3 py-2"
              >
                <Avatar
                  firstName={user.firstName}
                  lastName={user.lastName}
                  photoUrl={user.photoUrl}
                  size="w-10 h-10"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="truncate text-xs text-base-content/55">
                    {user.skills.length > 0
                      ? user.skills.slice(0, 3).join(" · ")
                      : "Developer"}
                  </p>
                </div>
                {(() => {
                  const status = effectiveStatus(user);
                  if (status === "connected") {
                    return (
                      <span className="btn btn-ghost btn-sm no-animation shrink-0 cursor-default gap-1 text-success">
                        <Icon name="check" className="h-4 w-4" />
                        Connected
                      </span>
                    );
                  }
                  if (status === "requested") {
                    return (
                      <button
                        type="button"
                        disabled
                        className="btn btn-sm shrink-0"
                      >
                        Requested
                      </button>
                    );
                  }
                  if (status === "incoming") {
                    return (
                      <button
                        type="button"
                        onClick={() => navigate("/requests")}
                        className="btn btn-secondary btn-sm shrink-0"
                      >
                        Respond
                      </button>
                    );
                  }
                  return (
                    <button
                      type="button"
                      onClick={() => void connect(user)}
                      className="btn btn-primary btn-sm shrink-0"
                    >
                      Connect
                    </button>
                  );
                })()}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
};
