import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SafeUser } from "../types/models";

type ConnectionState = SafeUser[] | null;

const initialState = null as ConnectionState;

const connectionSlice = createSlice({
  name: "connection",
  initialState,
  reducers: {
    setConnections: (_state, action: PayloadAction<SafeUser[]>) =>
      action.payload,
    clearConnections: () => null,
  },
});

export const { setConnections, clearConnections } = connectionSlice.actions;
export default connectionSlice.reducer;
