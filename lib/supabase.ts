import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in .env."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getSupabaseAnon(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Set them in .env."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function normalizePhone(value: string): string {
  return (value || "").replace(/\D/g, "");
}

/** Digit forms that should match a guest row stored as 10 digits or with a leading 1. */
export function phoneLookupKeys(value: string): string[] {
  const clean = normalizePhone(value);
  const keys = new Set<string>();
  if (clean.length >= 10) keys.add(clean);
  if (clean.length === 11 && clean.startsWith("1")) keys.add(clean.slice(1));
  if (clean.length > 10) keys.add(clean.slice(-10));
  return [...keys];
}

export async function findGuestByPhone(phone: string) {
  const keys = phoneLookupKeys(phone);
  if (!keys.length) return { guest: null as GuestRecord | null, error: null as string | null };

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("guests")
    .select("id, phone, name, tier")
    .in("phone", keys);

  if (error) return { guest: null, error: error.message };

  const rows = (data || []) as GuestRecord[];
  const preferred = keys.find((key) => key.length === 10);
  const guest = rows.find((row) => row.phone === preferred) || rows[0] || null;
  return { guest, error: null };
}

export function toE164(digits: string, defaultCountry = "1"): string {
  const clean = normalizePhone(digits);
  if (clean.startsWith("1") && clean.length === 11) return `+${clean}`;
  if (clean.length === 10) return `+${defaultCountry}${clean}`;
  if (digits.trim().startsWith("+")) return `+${clean}`;
  return `+${clean}`;
}

export type GuestTier = "both" | "brunch" | "night";

export type GuestRecord = {
  id: string;
  phone: string;
  name: string;
  tier: GuestTier;
};
