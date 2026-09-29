import { NextResponse } from "next/server";
import { getGuestSession, setGuestSession } from "@/lib/session";
import {
  findGuestByLogin,
  getSupabaseAnon,
  guestDisplayName,
  isEmail,
  normalizeEmail,
  normalizePhone,
  phoneLookupKeys,
  toE164,
  type GuestRecord,
  type GuestTier,
} from "@/lib/supabase";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function mapGuest(row: GuestRecord): GuestRecord {
  return {
    id: row.id,
    phone: row.phone,
    email: row.email || null,
    first_name: row.first_name || "",
    last_name: row.last_name || "",
    addressee: row.addressee || "",
    name: row.name || guestDisplayName(row),
    tier: row.tier as GuestTier,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      phone?: string;
      email?: string;
      login?: string;
      otp?: string;
    };

    const rawLogin = (body.login || body.email || body.phone || "").trim();
    if (!rawLogin) {
      return json(
        {
          warning: true,
          error: "Enter the phone number or email from your invitation.",
        },
        400
      );
    }

    const emailLogin = isEmail(rawLogin);
    if (!emailLogin && !phoneLookupKeys(rawLogin).length) {
      return json(
        {
          warning: true,
          error:
            "Enter a valid 10-digit phone number or the email from your invitation.",
        },
        400
      );
    }

    const otpEnabled = process.env.NEXT_PUBLIC_PHONE_OTP === "true";
    const { guest: guestRow, error: guestError } =
      await findGuestByLogin(rawLogin);

    if (guestError) {
      return json({ error: guestError }, 500);
    }

    if (!guestRow) {
      return json(
        {
          warning: true,
          error: emailLogin
            ? "This email is not on the guest list. Use the email from your invitation."
            : "This phone number is not on the guest list. Use the number from your invitation.",
        },
        403
      );
    }

    const guest = mapGuest(guestRow);
    const digits = normalizePhone(guest.phone || "");
    const label = guestDisplayName(guest);

    if (otpEnabled && !emailLogin) {
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
        return json({ guest, found: label !== "Guest" });
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
    return json({
      guest,
      found: label !== "Guest",
      login: emailLogin ? normalizeEmail(rawLogin) : digits,
    });
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
