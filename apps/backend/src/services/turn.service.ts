import { env, turnEnabled } from "../config/env";
import { logger } from "../utils/logger";

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

// STUN is ALWAYS included and always tried first: ICE gives host/STUN (direct)
// candidates higher priority than TURN, so the relay is only ever used when a
// direct peer-to-peer path can't be established. Free and low-latency by default.
const STUN_SERVERS: IceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

// Metered's TURN credentials are static per account, so cache them and avoid
// hitting their API on every call. Refresh hourly.
const CACHE_TTL_MS = 60 * 60 * 1000;
let cache: { servers: IceServer[]; at: number } | null = null;

export const getIceServers = async (): Promise<IceServer[]> => {
  if (!turnEnabled) return STUN_SERVERS;
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.servers;

  try {
    const url = `https://${env.METERED_DOMAIN}/api/v1/turn/credentials?apiKey=${env.METERED_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Metered API responded ${response.status}`);
    }
    const turnServers = (await response.json()) as IceServer[];
    // STUN first (direct-path preference), then the TURN relay as fallback.
    const servers = [...STUN_SERVERS, ...turnServers];
    cache = { servers, at: Date.now() };
    return servers;
  } catch (error) {
    logger.error("Failed to fetch TURN credentials from Metered", error);
    // Never break calls: fall back to the last good creds, or STUN-only.
    return cache?.servers ?? STUN_SERVERS;
  }
};
