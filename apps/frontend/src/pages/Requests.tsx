import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { removeRequest, setRequests } from "../features/requestSlice";
import { getReceivedRequests } from "../api/user.api";
import { reviewRequest, type ReviewStatus } from "../api/request.api";
import { getErrorMessage } from "../lib/apiClient";
import { timeAgo } from "../lib/format";
import { Avatar } from "../components/Avatar";
import { SkillChips } from "../components/SkillChips";
import { PageHeader } from "../components/PageHeader";
import { Icon } from "../components/icons";
import { FullScreenLoader } from "../components/ui/Loader";
import { EmptyState } from "../components/ui/EmptyState";

const Requests = () => {
  const dispatch = useAppDispatch();
  const requests = useAppSelector((state) => state.request);
  const mySkills = useAppSelector((state) => state.user?.skills ?? []);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    getReceivedRequests()
      .then((data) => {
        if (active) dispatch(setRequests(data));
      })
      .catch((fetchError) => {
        if (active) setError(getErrorMessage(fetchError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dispatch]);

  const handleReview = async (status: ReviewStatus, requestId: string) => {
    setBusyId(requestId);
    try {
      await reviewRequest(status, requestId);
      dispatch(removeRequest(requestId));
    } catch (reviewError) {
      setError(getErrorMessage(reviewError));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <FullScreenLoader label="Loading requests..." />;

  const header = (
    <PageHeader
      icon="inbox"
      eyebrow="Inbox"
      title="Connection requests"
      description="Developers who want to connect with you."
      actions={
        requests && requests.length > 0 ? (
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 font-mono text-sm text-primary">
            {requests.length} pending
          </span>
        ) : undefined
      }
    />
  );

  if (!requests || requests.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          title="You're all caught up"
          description="When developers want to connect, their requests will appear here."
        />
      </>
    );
  }

  return (
    <>
      {header}

      {error ? (
        <div className="alert alert-warning mb-4 text-sm">
          <span>{error}</span>
        </div>
      ) : null}

      <div className="stagger grid gap-4 lg:grid-cols-2">
        {requests.map((request) => {
          const sender = request.fromUserId;
          const busy = busyId === request._id;
          return (
            <div
              key={request._id}
              className="surface gradient-border surface-hover flex flex-col gap-4 p-5"
            >
              <div className="flex items-start gap-4">
                <Avatar
                  firstName={sender.firstName}
                  lastName={sender.lastName}
                  photoUrl={sender.photoUrl}
                  size="w-16 h-16"
                  className="ring-2 ring-primary/25"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-primary">
                    wants to connect
                  </p>
                  <h3 className="truncate text-lg font-semibold">
                    {sender.firstName} {sender.lastName}
                  </h3>
                  <p className="font-mono text-xs text-base-content/50">
                    {[
                      sender.age && sender.gender
                        ? `${sender.age} · ${sender.gender}`
                        : null,
                      timeAgo(request.createdAt),
                    ]
                      .filter(Boolean)
                      .join("  ·  ")}
                  </p>
                </div>
              </div>

              {sender.about ? (
                <p className="line-clamp-2 text-sm text-base-content/70">
                  {sender.about}
                </p>
              ) : null}

              <SkillChips skills={sender.skills} mySkills={mySkills} max={6} />

              <div className="mt-1 flex gap-2.5">
                <button
                  type="button"
                  className="btn btn-ghost flex-1 gap-2 border border-base-content/15 hover:border-error hover:text-error"
                  disabled={busy}
                  onClick={() => handleReview("rejected", request._id)}
                >
                  <Icon name="close" className="h-4 w-4" />
                  Decline
                </button>
                <button
                  type="button"
                  className="btn btn-brand flex-[1.4] gap-2"
                  disabled={busy}
                  onClick={() => handleReview("accepted", request._id)}
                >
                  <Icon name="check" className="h-4 w-4" />
                  Accept
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default Requests;
