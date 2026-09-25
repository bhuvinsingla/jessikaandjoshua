import { cookies } from "next/headers";
import type { GuestRecord } from "./supabase";

export const SESSION_COOKIE = "wedding_guest_session";

export type GuestSession = GuestRecord;

export async function setGuestSession(guest: GuestSession) {
  const store = await cookies();
  store.set(SESSION_COOKIE, JSON.stringify(guest), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getGuestSession(): Promise<GuestSession | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GuestSession;
  } catch {
    return null;
  }
}

export async function clearGuestSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
