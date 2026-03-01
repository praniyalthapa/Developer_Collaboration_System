import axios from "axios";
import React, { useEffect } from "react";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addFeed } from "../utils/feedSlice";
import UserCard from "./UserCard";

const Feed = () => {
    const dispatch = useDispatch();
    const feed = useSelector((store) => store.feed);

    const getFeed = async () => {
        try {
            const response = await axios.get(
                `${BASE_URL}/smart-matches?page=1&limit=10`,
                { withCredentials: true }
            );

            console.log("Smart Feed API response:", response.data);

            // Extract users + similarity score from smart matches
            const users = response.data.matches.map((m) => ({
                ...m.user,
                similarity: m.similarity,
            }));

            dispatch(addFeed(users));
        } catch (err) {
            console.log("Smart match error:", err);

            // Fallback to regular feed if smart match fails
            try {
                const fallback = await axios.get(
                    `${BASE_URL}/feed?limit=10`,
                    { withCredentials: true }
                );
                dispatch(addFeed(fallback.data?.data || []));
            } catch (fallbackErr) {
                console.log("Feed fallback error:", fallbackErr);
                dispatch(addFeed([]));
            }
        }
    };

    useEffect(() => {
        getFeed();
    }, []);

    // Loading state
    if (feed === null || feed === undefined) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3">
                <div className="loading loading-spinner loading-lg"></div>
                <p className="text-base-content/60 text-sm">
                    Finding your best matches...
                </p>
            </div>
        );
    }

    // Empty state
    if (feed.length <= 0) {
        return (
            <div className="hero min-h-[60vh] bg-base-200 rounded-2xl">
                <div className="hero-content text-center">
                    <div className="max-w-md">
                        <div className="text-6xl mb-4">🎯</div>
                        <h1 className="text-4xl font-bold">No matches found!</h1>
                        <p className="py-6 opacity-80">
                            Add more skills to your profile to get better matches!
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={getFeed}
                        >
                            🔄 Refresh
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="my-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 px-2">
                <div>
                    
                    <p className="text-sm text-base-content/60 mt-1">
                        Developers matched based on your skills
                    </p>
                </div>
                <button
                    className="btn btn-ghost btn-sm"
                    onClick={getFeed}
                >
                    🔄 Refresh
                </button>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 justify-items-center">
                {feed.map((user) => (
                    <UserCard
                        key={user._id}
                        user={user}
                        showActions={true}
                    />
                ))}
            </div>
        </div>
    );
};

export default Feed;