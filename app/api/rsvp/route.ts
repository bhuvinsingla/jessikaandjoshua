import { NextResponse } from "next/server";
import { getGuestSession } from "@/lib/session";
import { findGuestByPhone, getSupabaseAdmin, normalizePhone } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      guestNames?: string;
      guestPhone?: string;
      brunchAttending?: string;
      brunchKids?: string;
      barAttending?: string;
      dietary?: string;
      jukeboxTrack?: string;
      jukeboxArtist?: string;
      spotifyUrl?: string;
    };

    const session = await getGuestSession();
    const phone = normalizePhone(session?.phone || body.guestPhone || "");

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required to save your RSVP." },
        { status: 400 }
      );
    }

    const { guest, error: guestError } = await findGuestByPhone(phone);
    if (guestError) {
      return NextResponse.json({ error: guestError }, { status: 500 });
    }
    if (!guest) {
      return NextResponse.json(
        {
          warning: true,
          error: "This phone number is not on the guest list.",
        },
        { status: 403 }
      );
    }

    const admin = getSupabaseAdmin();
    const payload = {
      guest_id: guest.id,
      guest_phone: guest.phone,
      guest_names: body.guestNames || guest.name || session?.name || "",
      brunch_attending: body.brunchAttending || null,
      brunch_kids: body.brunchKids || "0",
      bar_attending: body.barAttending || null,
      dietary: body.dietary || "None",
      jukebox_track: body.jukeboxTrack || "",
      jukebox_artist: body.jukeboxArtist || "",
      spotify_url: body.spotifyUrl || "",
    };

    const { data, error } = await admin
      .from("rsvps")
      .upsert(payload, { onConflict: "guest_phone" })
      .select("id, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, rsvp: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "RSVP failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getGuestSession();
    if (!session) {
      return NextResponse.json({ rsvp: null });
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("rsvps")
      .select("*")
      .eq("guest_phone", session.phone)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rsvp: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lookup failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
