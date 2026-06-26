import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CurrentUser } from "../types/models";

type UserState = CurrentUser | null;

const initialState = null as UserState;

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (_state, action: PayloadAction<CurrentUser>) => action.payload,
    clearUser: () => null,
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
