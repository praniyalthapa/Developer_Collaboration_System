import { createContext, useContext } from "react";
import type { CallApi } from "../hooks/useCall";

export type CallStatus = "idle" | "outgoing" | "incoming" | "active";

export interface CallTarget {
  userId: string;
  name: string;
  photoUrl?: string;
}

export interface CallContextApi {
  status: CallStatus;
  peer: CallTarget | null;
  media: CallApi;
  startCall: (target: CallTarget) => void;
  accept: () => void;
  decline: () => void;
  hangUp: () => void;
}

const noop = (): void => undefined;

export const CallContext = createContext<CallContextApi | null>(null);

export const useCallContext = (): CallContextApi => {
  const ctx = useContext(CallContext);
  if (!ctx) {
    throw new Error("useCallContext must be used within a CallProvider");
  }
  return ctx;
};

export const callRoomId = (a: string, b: string): string =>
  [a, b].sort().join("::");

export { noop };
