import { NextResponse } from "next/server";
import { getGuestSession } from "@/lib/session";
import {
  findGuestByEmail,
  findGuestByPhone,
  getSupabaseAdmin,
  guestPersonalName,
  normalizePhone,
} from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      guestFirstName?: string;
      guestLastName?: string;
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

    let guest = null;
    let guestError: string | null = null;

    if (phone) {
      ({ guest, error: guestError } = await findGuestByPhone(phone));
    } else if (session?.email) {
      ({ guest, error: guestError } = await findGuestByEmail(session.email));
    } else if (session?.id) {
      const admin = getSupabaseAdmin();
      const { data, error } = await admin
        .from("guests")
        .select("id, phone, email, first_name, last_name, addressee, name, tier")
        .eq("id", session.id)
        .maybeSingle();
      guestError = error?.message || null;
      guest = data
        ? {
            id: data.id,
            phone: data.phone,
            email: data.email,
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            addressee: data.addressee || "",
            name: data.name || "",
            tier: data.tier,
          }
        : null;
    }

    if (guestError) {
      return NextResponse.json({ error: guestError }, { status: 500 });
    }
    if (!guest) {
      return NextResponse.json(
        {
          warning: true,
          error: "This guest is not on the guest list.",
        },
        { status: 403 }
      );
    }

    const guestPhone = normalizePhone(guest.phone || "") || guest.id;
    const firstName =
      (body.guestFirstName || guest.first_name || session?.first_name || "").trim();
    const lastName =
      (body.guestLastName || guest.last_name || session?.last_name || "").trim();
    const fullName =
      `${firstName} ${lastName}`.trim() ||
      body.guestNames ||
      guestPersonalName(guest) ||
      session?.name ||
      "";

    if (!firstName || !lastName) {
      return NextResponse.json(
        {
          warning: true,
          error: "First name and last name are required.",
        },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();
    const payload = {
      guest_id: guest.id,
      guest_phone: guestPhone,
      guest_first_name: firstName,
      guest_last_name: lastName,
      guest_names: fullName,
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
      if (/guest_first_name|guest_last_name/i.test(error.message)) {
        const { guest_first_name: _f, guest_last_name: _l, ...legacy } = payload;
        const retry = await admin
          .from("rsvps")
          .upsert(legacy, { onConflict: "guest_phone" })
          .select("id, updated_at")
          .single();
        if (retry.error) {
          return NextResponse.json({ error: retry.error.message }, { status: 500 });
        }
        return NextResponse.json({ ok: true, rsvp: retry.data });
      }
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
      return NextResponse.json({ rsvp: null, previouslyFilled: false });
    }

    const admin = getSupabaseAdmin();

    if (session.id) {
      const { data: byId, error: byIdError } = await admin
        .from("rsvps")
        .select("*")
        .eq("guest_id", session.id)
        .maybeSingle();

      if (byIdError) {
        return NextResponse.json({ error: byIdError.message }, { status: 500 });
      }
      if (byId) {
        return NextResponse.json({ rsvp: byId, previouslyFilled: true });
      }
    }

    if (session.phone) {
      const { data, error } = await admin
        .from("rsvps")
        .select("*")
        .eq("guest_phone", session.phone)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        rsvp: data,
        previouslyFilled: Boolean(data),
      });
    }

    return NextResponse.json({ rsvp: null, previouslyFilled: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lookup failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
