import { NextResponse } from "next/server";
import { getGuestSession, setGuestSession } from "@/lib/session";
import {
  findGuestByPhone,
  getSupabaseAnon,
  normalizePhone,
  phoneLookupKeys,
  toE164,
  type GuestRecord,
  type GuestTier,
} from "@/lib/supabase";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function mapGuest(row: {
  id: string;
  phone: string;
  name: string;
  tier: string;
}): GuestRecord {
  return {
    id: row.id,
    phone: row.phone,
    name: row.name,
    tier: row.tier as GuestTier,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      phone?: string;
      otp?: string;
    };
    const digits = normalizePhone(body.phone || "");

    if (!phoneLookupKeys(digits).length) {
      return json(
        {
          warning: true,
          error: "Enter the 10-digit phone number from your invitation.",
        },
        400
      );
    }

    const otpEnabled = process.env.NEXT_PUBLIC_PHONE_OTP === "true";
    const { guest: guestRow, error: guestError } = await findGuestByPhone(digits);

    if (guestError) {
      return json({ error: guestError }, 500);
    }

    if (!guestRow) {
      return json(
        {
          warning: true,
          error:
            "This phone number is not on the guest list. Use the number from your invitation.",
        },
        403
      );
    }

    const guest = mapGuest(guestRow);

    if (otpEnabled) {
      const anon = getSupabaseAnon();
      const e164 = toE164(digits);

      if (body.otp) {
        const { error: verifyError } = await anon.auth.verifyOtp({
          phone: e164,
          token: body.otp.trim(),
          type: "sms",
        });
        if (verifyError) {
          return json({ error: verifyError.message, needsOtp: true }, 401);
        }
        await setGuestSession(guest);
        return json({ guest, found: guest.name !== "Guest" });
      }

      const { error: otpError } = await anon.auth.signInWithOtp({ phone: e164 });
      if (otpError) {
        return json({ error: otpError.message }, 500);
      }
      return json({
        needsOtp: true,
        message: "Enter the 6-digit code we texted you, then Unlock again.",
      });
    }

    await setGuestSession(guest);
    return json({ guest, found: guest.name !== "Guest" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed.";
    return json({ error: message }, 500);
  }
}

export async function GET() {
  const session = await getGuestSession();
  if (!session) return json({ guest: null }, 200);
  return json({ guest: session });
}

export async function DELETE() {
  const { clearGuestSession } = await import("@/lib/session");
  await clearGuestSession();
  return json({ ok: true });
}
