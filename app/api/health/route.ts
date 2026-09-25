import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    const { count, error } = await admin
      .from("guests")
      .select("id", { count: "exact", head: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      guests: count ?? 0,
      phoneOtp: process.env.NEXT_PUBLIC_PHONE_OTP === "true",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Not connected.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
