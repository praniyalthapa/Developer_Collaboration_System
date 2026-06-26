import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ReceivedRequest } from "../types/models";

type RequestState = ReceivedRequest[] | null;

const initialState = null as RequestState;

const requestSlice = createSlice({
  name: "request",
  initialState,
  reducers: {
    setRequests: (_state, action: PayloadAction<ReceivedRequest[]>) =>
      action.payload,
    removeRequest: (state, action: PayloadAction<string>) =>
      state ? state.filter((request) => request._id !== action.payload) : state,
  },
});

export const { setRequests, removeRequest } = requestSlice.actions;
export default requestSlice.reducer;
