import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { FeedUser } from "../types/models";

type FeedState = FeedUser[] | null;

const initialState = null as FeedState;

const feedSlice = createSlice({
  name: "feed",
  initialState,
  reducers: {
    setFeed: (_state, action: PayloadAction<FeedUser[]>) => action.payload,
    removeUserFromFeed: (state, action: PayloadAction<string>) =>
      state ? state.filter((user) => user._id !== action.payload) : state,
    prependUserToFeed: (state, action: PayloadAction<FeedUser>) =>
      state ? [action.payload, ...state] : [action.payload],
    clearFeed: () => null,
  },
});

export const { setFeed, removeUserFromFeed, prependUserToFeed, clearFeed } =
  feedSlice.actions;
export default feedSlice.reducer;
