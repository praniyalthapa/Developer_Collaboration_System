import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { removeUserFromFeed, setFeed } from "../features/feedSlice";
import { getSmartMatches } from "../api/smartMatch.api";
import { getFeed } from "../api/user.api";
import { sendRequest } from "../api/request.api";
import { getErrorMessage } from "../lib/apiClient";
import { SwipeDeck } from "../components/SwipeDeck";
import { FullScreenLoader } from "../components/ui/Loader";
import { EmptyState } from "../components/ui/EmptyState";
import type { FeedUser } from "../types/models";

const PAGE_SIZE = 12;

const Feed = () => {
  const dispatch = useAppDispatch();
  const feed = useAppSelector((state) => state.feed);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const loadingMoreRef = useRef(false);

  const loadPage = useCallback(async (pageNumber: number): Promise<FeedUser[]> => {
    try {
      const result = await getSmartMatches(pageNumber, PAGE_SIZE);
      setHasMore(pageNumber < result.totalPages);
      return result.matches.map((match) => ({
        ...match.user,
        similarity: match.similarity,
        sharedSkills: match.sharedSkills,
      }));
    } catch {
      const fallback = await getFeed(pageNumber, PAGE_SIZE);
      setHasMore(fallback.length === PAGE_SIZE);
      return fallback;
    }
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadPage(1)
      .then((users) => {
        if (active) {
          dispatch(setFeed(users));
          setPage(1);
        }
      })
      .catch((loadError) => {
        if (active) setError(getErrorMessage(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dispatch, loadPage]);

  useEffect(() => {
    if (!feed || feed.length > 4 || !hasMore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    loadPage(page + 1)
      .then((next) => {
        dispatch(setFeed([...(feed ?? []), ...next]));
        setPage((current) => current + 1);
      })
      .catch(() => undefined)
      .finally(() => {
        loadingMoreRef.current = false;
      });
  }, [feed, hasMore, page, loadPage, dispatch]);

  const handleDecision = async (id: string, status: "interested" | "ignored") => {
    setBusy(true);
    dispatch(removeUserFromFeed(id));
    try {
      await sendRequest(status, id);
    } catch (actionError) {
      const message = getErrorMessage(actionError);
      // The card is already removed; a pre-existing request is a no-op, not an error worth surfacing.
      if (!/already exists/i.test(message)) {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <FullScreenLoader label="Finding your best matches..." />;
  }

  if (!feed || feed.length === 0) {
    return (
      <EmptyState
        title="You're all caught up"
        description="No more matches right now. Add skills to your profile to surface more developers."
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Discover <span className="gradient-text">developers</span>
        </h1>
        <p className="mt-1 font-mono text-sm text-base-content/60">
          {feed.length} match{feed.length === 1 ? "" : "es"} ranked by shared skills
        </p>
      </div>

      {error ? (
        <div className="alert alert-warning text-sm">
          <span>{error}</span>
        </div>
      ) : null}

      <SwipeDeck users={feed} busy={busy} onDecision={handleDecision} />
    </div>
  );
};

export default Feed;
