import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../features/userSlice";
import feedReducer from "../features/feedSlice";
import connectionReducer from "../features/connectionSlice";
import requestReducer from "../features/requestSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    feed: feedReducer,
    connection: connectionReducer,
    request: requestReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
