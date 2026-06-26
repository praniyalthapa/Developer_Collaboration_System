import { useEffect, useMemo, useState } from "react";
import { getSentRequests } from "../api/user.api";
import { cancelRequest } from "../api/request.api";
import { getErrorMessage } from "../lib/apiClient";
import { timeAgo } from "../lib/format";
import { Avatar } from "../components/Avatar";
import { PageHeader } from "../components/PageHeader";
import { FullScreenLoader } from "../components/ui/Loader";
import { EmptyState } from "../components/ui/EmptyState";
import type { ConnectionStatus, SentRequest } from "../types/models";

const STATUS_META: Record<
  ConnectionStatus,
  { label: string; badge: string; accent: string }
> = {
  interested: { label: "Pending", badge: "badge-info", accent: "bg-info" },
  accepted: { label: "Accepted", badge: "badge-success", accent: "bg-success" },
  rejected: { label: "Declined", badge: "badge-error", accent: "bg-error" },
  ignored: { label: "Passed", badge: "badge-ghost", accent: "bg-base-content/30" },
};

const Sent = () => {
  const [sent, setSent] = useState<SentRequest[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getSentRequests()
      .then((data) => {
        if (active) setSent(data);
      })
      .catch((fetchError) => {
        if (active) {
          setError(getErrorMessage(fetchError));
          setSent([]);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => {
    const counts = { pending: 0, accepted: 0, declined: 0 };
    for (const request of sent ?? []) {
      if (request.status === "interested" || request.status === "ignored") counts.pending += 1;
      else if (request.status === "accepted") counts.accepted += 1;
      else if (request.status === "rejected") counts.declined += 1;
    }
    return counts;
  }, [sent]);

  const handleCancel = async (requestId: string) => {
    setBusyId(requestId);
    try {
      await cancelRequest(requestId);
      setSent((current) =>
        current ? current.filter((request) => request._id !== requestId) : current,
      );
    } catch (cancelError) {
      setError(getErrorMessage(cancelError));
    } finally {
      setBusyId(null);
    }
  };

  if (sent === null) return <FullScreenLoader label="Loading sent requests..." />;

  const header = (
    <PageHeader
      icon="send"
      eyebrow="Outbox"
      title="Sent requests"
      description="Requests you've sent and their current status."
    />
  );

  if (sent.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          title="No sent requests"
          description="Connect with developers from Discover to see them here."
        />
      </>
    );
  }

  return (
    <>
      {header}

      <div className="mb-6 flex flex-wrap gap-3">
        <span className="rounded-full border border-info/30 bg-info/10 px-3 py-1.5 font-mono text-xs text-info">
          {summary.pending} pending
        </span>
        <span className="rounded-full border border-success/30 bg-success/10 px-3 py-1.5 font-mono text-xs text-success">
          {summary.accepted} accepted
        </span>
        <span className="rounded-full border border-error/30 bg-error/10 px-3 py-1.5 font-mono text-xs text-error">
          {summary.declined} declined
        </span>
      </div>

      {error ? (
        <div className="alert alert-warning mb-4 text-sm">
          <span>{error}</span>
        </div>
      ) : null}

      <div className="stagger space-y-3">
        {sent.map((request) => {
          const target = request.toUserId;
          const meta = STATUS_META[request.status];
          const canCancel =
            request.status === "interested" || request.status === "ignored";
          return (
            <div
              key={request._id}
              className="surface surface-hover flex items-center gap-4 overflow-hidden p-4 pl-0"
            >
              <span className={`h-12 w-1.5 rounded-full ${meta.accent}`} />
              <Avatar
                firstName={target.firstName}
                lastName={target.lastName}
                photoUrl={target.photoUrl}
                size="w-12 h-12"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {target.firstName} {target.lastName}
                </p>
                <p className="truncate font-mono text-xs text-base-content/50">
                  {target.skills.slice(0, 3).join(" · ") || "developer"}
                  {request.createdAt ? `  ·  sent ${timeAgo(request.createdAt)}` : ""}
                </p>
              </div>
              <span className={`badge ${meta.badge} badge-sm`}>{meta.label}</span>
              {canCancel ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-base-content/60 hover:text-error"
                  disabled={busyId === request._id}
                  onClick={() => handleCancel(request._id)}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default Sent;
