import { toast, type Id } from "react-toastify";

type Guest = {
  id: string;
  name: string;
  phone: string;
  tier: "both" | "brunch" | "night";
};

type ItunesTrack = {
  trackName: string;
  artistName: string;
  artworkUrl100?: string;
  previewUrl?: string;
};

declare global {
  interface Window {
    showPage: (pageName: string) => void;
    setGuestTier: (tier: Guest["tier"], guestName?: string) => void;
    performGuestLookup: () => Promise<void>;
    quickSearch: (phoneNum: string) => void;
    selectSong: (
      trackName: string,
      artistName: string,
      artworkUrl: string,
      previewUrl: string
    ) => void;
    playPreview: (url: string) => void;
    clearSelectedSong: () => void;
  }
}

function normalizePhone(str: string) {
  return str ? str.replace(/\D/g, "") : "";
}

function showToast(
  type: "success" | "error" | "warning" | "info",
  message: string,
  id?: Id | null
) {
  if (id != null) {
    toast.update(id, {
      render: message,
      type,
      isLoading: false,
      autoClose: 4000,
      closeOnClick: true,
      position: "bottom-right",
    });
    return;
  }
  toast[type](message, {
    autoClose: 4000,
    closeOnClick: true,
    position: "bottom-right",
  });
}

export function initWeddingSite() {
  const targetDate = new Date("January 30, 2027 11:00:00").getTime();
  let currentTier: Guest["tier"] = "both";
  let pendingPhone = "";
  let searchDebounce: ReturnType<typeof setTimeout> | null = null;
  let activeAudioPreview: HTMLAudioElement | null = null;
  let countdownTimer: ReturnType<typeof setInterval> | null = null;

  function showPage(pageName: string) {
    const landing = document.getElementById("pageLanding");
    const invitation = document.getElementById("pageInvitation");
    if (!landing || !invitation) return;

    if (pageName === "invitation") {
      landing.classList.add("hidden");
      invitation.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      invitation.classList.add("hidden");
      landing.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
      void fetch("/api/auth/login", { method: "DELETE" });
      showToast("info", "Signed out.");
    }
  }

  function updateCountdown() {
    const now = new Date().getTime();
    const difference = targetDate - now;
    if (difference <= 0) return;

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    const set = (id: string, value: number) => {
      const el = document.getElementById(id);
      if (el) el.innerText = String(value).padStart(2, "0");
    };
    set("days", days);
    set("hours", hours);
    set("minutes", minutes);
    set("seconds", seconds);
  }

  function setGuestTier(tier: Guest["tier"], guestName?: string) {
    currentTier = tier;

    const eventsGrid = document.getElementById("eventsGrid");
    const eventCardBrunch = document.getElementById("eventCardBrunch");
    const eventCardNight = document.getElementById("eventCardNight");
    const rsvpBrunchBlock = document.getElementById("rsvpBrunchBlock");
    const rsvpNightBlock = document.getElementById("rsvpNightBlock");
    const dresscodeGrid = document.getElementById("dresscodeGrid");
    const dresscodeCardBrunch = document.getElementById("dresscodeCardBrunch");
    const dresscodeCardNight = document.getElementById("dresscodeCardNight");
    const greetingName = document.getElementById("greetingName");
    const greetingDetail = document.getElementById("greetingDetail");
    const scheduleDesc = document.getElementById("scheduleDescription");
    const dresscodeSubtitle = document.getElementById("dresscodeSubtitle");
    const rsvpGuestNamesInput = document.getElementById(
      "rsvpGuestNamesInput"
    ) as HTMLInputElement | null;

    ["Both", "Brunch", "Night", "Locked"].forEach((id) => {
      const btn = document.getElementById("tierBtn" + id);
      if (btn) {
        btn.className =
          "px-2 py-1.5 rounded-lg border text-[10px] font-semibold transition bg-stone-900 border-stone-800 text-stone-300 hover:text-white";
      }
    });

    const activeBtn = document.getElementById(
      "tierBtn" +
        (tier === "both" ? "Both" : tier.charAt(0).toUpperCase() + tier.slice(1))
    );
    if (activeBtn) {
      activeBtn.className =
        "px-2 py-1.5 rounded-lg border text-[10px] font-semibold transition bg-brand-plum border-brand-plum text-white shadow-sm";
    }

    if (guestName && rsvpGuestNamesInput) {
      rsvpGuestNamesInput.value = guestName;
    }

    if (tier === "brunch") {
      eventCardBrunch?.classList.remove("hidden");
      eventCardNight?.classList.add("hidden");
      if (eventsGrid) eventsGrid.className = "grid grid-cols-1 max-w-xl mx-auto";
      rsvpBrunchBlock?.classList.remove("hidden");
      rsvpNightBlock?.classList.add("hidden");
      dresscodeCardBrunch?.classList.remove("hidden");
      dresscodeCardNight?.classList.add("hidden");
      if (dresscodeGrid)
        dresscodeGrid.className = "grid grid-cols-1 max-w-xl mx-auto";
      if (dresscodeSubtitle)
        dresscodeSubtitle.innerText =
          "Below are attire guidelines for the morning celebration.";
      if (greetingName)
        greetingName.innerText = `Welcome, ${guestName || "Guest"}! 🍷`;
      if (greetingDetail)
        greetingDetail.innerText =
          "You are warmly invited to Our Family & Friends Tapas Brunch.";
      if (scheduleDesc)
        scheduleDesc.innerText =
          "Here are the details for our morning Tapas Brunch at Barcelona Wine Bar.";
    } else if (tier === "night") {
      eventCardBrunch?.classList.add("hidden");
      eventCardNight?.classList.remove("hidden");
      if (eventsGrid) eventsGrid.className = "grid grid-cols-1 max-w-xl mx-auto";
      rsvpBrunchBlock?.classList.add("hidden");
      rsvpNightBlock?.classList.remove("hidden");
      dresscodeCardBrunch?.classList.add("hidden");
      dresscodeCardNight?.classList.remove("hidden");
      if (dresscodeGrid)
        dresscodeGrid.className = "grid grid-cols-1 max-w-xl mx-auto";
      if (dresscodeSubtitle)
        dresscodeSubtitle.innerText =
          "Below are attire guidelines for the evening celebration.";
      if (greetingName)
        greetingName.innerText = `Welcome, ${guestName || "Guest"}! 🍸`;
      if (greetingDetail)
        greetingDetail.innerText =
          "You are warmly invited to Creative Black Tie @ Donna's on White Oak.";
      if (scheduleDesc)
        scheduleDesc.innerText =
          "Here are the details for our Creative Black Tie night out at Donna's.";
    } else {
      eventCardBrunch?.classList.remove("hidden");
      eventCardNight?.classList.remove("hidden");
      if (eventsGrid)
        eventsGrid.className = "grid md:grid-cols-2 gap-8 lg:gap-12";
      rsvpBrunchBlock?.classList.remove("hidden");
      rsvpNightBlock?.classList.remove("hidden");
      dresscodeCardBrunch?.classList.remove("hidden");
      dresscodeCardNight?.classList.remove("hidden");
      if (dresscodeGrid) dresscodeGrid.className = "grid md:grid-cols-2 gap-8";
      if (dresscodeSubtitle)
        dresscodeSubtitle.innerText =
          "Below are attire guidelines for both events.";
      if (greetingName)
        greetingName.innerText = `Welcome, ${guestName || "Guest"}! ✨`;
      if (greetingDetail)
        greetingDetail.innerText =
          "You are invited to Brunch at 11 AM and Creative Black Tie at 8 PM.";
      if (scheduleDesc)
        scheduleDesc.innerText =
          "We are so excited to celebrate with you across both events of our wedding day!";
    }

    showPage("invitation");
  }

  async function performGuestLookup() {
    const input = document.getElementById(
      "guestSearchInput"
    ) as HTMLInputElement | null;
    const rawQuery = input?.value.trim() || "";
    if (!rawQuery) {
      showToast("warning", "Enter the phone number from your invitation.");
      return;
    }

    const lookupToast = toast.loading("Checking the guest list...", {
      position: "bottom-right",
    });

    const looksLikeOtp = /^\d{6}$/.test(rawQuery.replace(/\s/g, ""));
    const phone = looksLikeOtp ? pendingPhone : normalizePhone(rawQuery);
    const otp = looksLikeOtp ? rawQuery.replace(/\s/g, "") : undefined;

    if (!looksLikeOtp) pendingPhone = phone;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: pendingPhone || phone, otp }),
      });
      const data = await res.json();

      if (data.needsOtp) {
        showToast(
          "info",
          data.message ||
            "Enter the 6-digit code we texted you, then Unlock again.",
          lookupToast
        );
        if (input) {
          input.value = "";
          input.placeholder = "6-digit code";
          input.focus();
        }
        return;
      }

      if (!res.ok || !data.guest) {
        void fetch("/api/auth/login", { method: "DELETE" });
        showToast(
          data.warning ? "warning" : "error",
          data.error || "This phone number is not on the guest list.",
          lookupToast
        );
        return;
      }

      const guest = data.guest as Guest;
      if (input && pendingPhone) {
        input.placeholder = "e.g. (713) 555-0101";
      }
      setGuestTier(guest.tier, guest.name);
      showToast("success", `Welcome, ${guest.name}. You're signed in.`, lookupToast);
    } catch (error) {
      showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Could not reach the invitation server.",
        lookupToast
      );
    }
  }

  function quickSearch(phoneNum: string) {
    const input = document.getElementById(
      "guestSearchInput"
    ) as HTMLInputElement | null;
    if (input) input.value = phoneNum;
    void performGuestLookup();
  }

  function renderSearchResults(results: ItunesTrack[]) {
    const searchResultsDropdown = document.getElementById(
      "searchResultsDropdown"
    );
    if (!searchResultsDropdown) return;

    if (!results || results.length === 0) {
      searchResultsDropdown.innerHTML = `<div class="p-4 text-xs text-stone-500 text-center">No songs found. Try searching another title.</div>`;
      searchResultsDropdown.classList.remove("hidden");
      return;
    }

    searchResultsDropdown.innerHTML = results
      .map((track) => {
        const artwork = track.artworkUrl100
          ? track.artworkUrl100.replace("100x100bb", "200x200bb")
          : "https://placehold.co/100x100/3a152e/ffffff?text=🎵";
        const trackTitleSafe = track.trackName.replace(/'/g, "\\'");
        const artistTitleSafe = track.artistName.replace(/'/g, "\\'");
        return `
                    <div onclick="selectSong('${trackTitleSafe}', '${artistTitleSafe}', '${artwork}', '${track.previewUrl || ""}')" 
                        class="p-3 hover:bg-stone-50 cursor-pointer flex items-center justify-between gap-3 transition">
                        <div class="flex items-center gap-3 min-w-0">
                            <img src="${artwork}" alt="${track.trackName}" class="w-10 h-10 rounded-lg object-cover shrink-0 border border-stone-200">
                            <div class="min-w-0">
                                <h6 class="text-xs font-bold text-stone-900 truncate">${track.trackName}</h6>
                                <p class="text-[11px] text-stone-500 truncate">${track.artistName}</p>
                            </div>
                        </div>
                        ${
                          track.previewUrl
                            ? `
                            <button type="button" onclick="event.stopPropagation(); playPreview('${track.previewUrl}')" 
                                class="p-2 text-stone-400 hover:text-brand-plum text-xs flex items-center gap-1 font-bold shrink-0">
                                ▶ Preview
                            </button>
                        `
                            : ""
                        }
                    </div>
                `;
      })
      .join("");
    searchResultsDropdown.classList.remove("hidden");
  }

  function playPreview(url: string) {
    if (activeAudioPreview) activeAudioPreview.pause();
    activeAudioPreview = new Audio(url);
    void activeAudioPreview.play();
  }

  function selectSong(
    trackName: string,
    artistName: string,
    artworkUrl: string,
    _previewUrl: string
  ) {
    if (activeAudioPreview) activeAudioPreview.pause();
    const selectedTrackName = document.getElementById("selectedTrackName");
    const selectedArtistName = document.getElementById("selectedArtistName");
    const selectedTrackArt = document.getElementById(
      "selectedTrackArt"
    ) as HTMLImageElement | null;
    const spotifySearchLink = document.getElementById(
      "spotifySearchLink"
    ) as HTMLAnchorElement | null;
    const selectedSongData = document.getElementById(
      "selectedSongData"
    ) as HTMLInputElement | null;
    const selectedSongCard = document.getElementById("selectedSongCard");
    const searchResultsDropdown = document.getElementById(
      "searchResultsDropdown"
    );
    const songSearchInput = document.getElementById(
      "songSearchInput"
    ) as HTMLInputElement | null;

    if (selectedTrackName) selectedTrackName.innerText = trackName;
    if (selectedArtistName) selectedArtistName.innerText = artistName;
    if (selectedTrackArt) selectedTrackArt.src = artworkUrl;
    const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(trackName + " " + artistName)}`;
    if (spotifySearchLink) spotifySearchLink.href = spotifyUrl;
    if (selectedSongData)
      selectedSongData.value = JSON.stringify({
        track: trackName,
        artist: artistName,
        spotifyUrl,
      });
    selectedSongCard?.classList.remove("hidden");
    searchResultsDropdown?.classList.add("hidden");
    if (songSearchInput) songSearchInput.value = `${trackName} - ${artistName}`;
  }

  function clearSelectedSong() {
    if (activeAudioPreview) activeAudioPreview.pause();
    document.getElementById("selectedSongCard")?.classList.add("hidden");
    const selectedSongData = document.getElementById(
      "selectedSongData"
    ) as HTMLInputElement | null;
    const songSearchInput = document.getElementById(
      "songSearchInput"
    ) as HTMLInputElement | null;
    if (selectedSongData) selectedSongData.value = "";
    if (songSearchInput) songSearchInput.value = "";
    document.getElementById("searchResultsDropdown")?.classList.add("hidden");
  }

  window.showPage = showPage;
  window.setGuestTier = setGuestTier;
  window.performGuestLookup = performGuestLookup;
  window.quickSearch = quickSearch;
  window.selectSong = selectSong;
  window.playPreview = playPreview;
  window.clearSelectedSong = clearSelectedSong;

  countdownTimer = setInterval(updateCountdown, 1000);
  updateCountdown();
  showPage("landing");

  const faqClicks: Array<[Element, EventListener]> = [];
  document.querySelectorAll(".faq-toggle").forEach((button) => {
    const handler = () => {
      const content = button.nextElementSibling;
      const icon = button.querySelector(".faq-icon");
      const isOpen = content && !content.classList.contains("hidden");
      document
        .querySelectorAll(".faq-content")
        .forEach((c) => c.classList.add("hidden"));
      document
        .querySelectorAll(".faq-icon")
        .forEach((i) => (i.textContent = "+"));
      if (!isOpen && content && icon) {
        content.classList.remove("hidden");
        icon.textContent = "−";
      }
    };
    button.addEventListener("click", handler);
    faqClicks.push([button, handler]);
  });

  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileHandler = () => mobileMenu?.classList.toggle("hidden");
  mobileMenuBtn?.addEventListener("click", mobileHandler);

  const songSearchInput = document.getElementById(
    "songSearchInput"
  ) as HTMLInputElement | null;
  const searchResultsDropdown = document.getElementById(
    "searchResultsDropdown"
  );
  const songInputHandler = (e: Event) => {
    const query = (e.target as HTMLInputElement).value.trim();
    if (searchDebounce) clearTimeout(searchDebounce);
    if (query.length < 2) {
      searchResultsDropdown?.classList.add("hidden");
      return;
    }
    searchDebounce = setTimeout(() => {
      fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=5`
      )
        .then((res) => res.json())
        .then((data: { results: ItunesTrack[] }) =>
          renderSearchResults(data.results)
        )
        .catch(() => searchResultsDropdown?.classList.add("hidden"));
    }, 300);
  };
  songSearchInput?.addEventListener("input", songInputHandler);

  const outsideClick = (e: MouseEvent) => {
    const target = e.target as Node;
    if (
      songSearchInput &&
      !songSearchInput.contains(target) &&
      searchResultsDropdown &&
      !searchResultsDropdown.contains(target)
    ) {
      searchResultsDropdown.classList.add("hidden");
    }
  };
  document.addEventListener("click", outsideClick);

  const rsvpForm = document.getElementById("rsvpForm") as HTMLFormElement | null;
  const submitHandler = (e: Event) => {
    e.preventDefault();
    if (!rsvpForm) return;
    rsvpForm.classList.add("opacity-50", "pointer-events-none");

    const guestNames =
      (document.getElementById("rsvpGuestNamesInput") as HTMLInputElement)
        ?.value || "";
    const guestPhone =
      (document.getElementById("guestSearchInput") as HTMLInputElement)
        ?.value || pendingPhone;
    const brunchAttending =
      (
        document.querySelector(
          'input[name="brunchAttending"]:checked'
        ) as HTMLInputElement | null
      )?.value || "";
    const brunchKidsSelect = document.querySelector(
      "#rsvpBrunchBlock select"
    ) as HTMLSelectElement | null;
    const brunchKids = brunchKidsSelect ? brunchKidsSelect.value : "0";
    const barAttending =
      (
        document.querySelector(
          'input[name="barAttending"]:checked'
        ) as HTMLInputElement | null
      )?.value || "";
    const dietaryChecked = Array.from(
      document.querySelectorAll('#rsvp input[type="checkbox"]:checked')
    ).map((cb) => (cb.parentElement?.innerText || "").trim());
    const dietary = dietaryChecked.length > 0 ? dietaryChecked.join(", ") : "None";

    let jukeboxTrack = "";
    let jukeboxArtist = "";
    let spotifyUrl = "";
    const songDataVal = (
      document.getElementById("selectedSongData") as HTMLInputElement | null
    )?.value;
    if (songDataVal) {
      try {
        const parsed = JSON.parse(songDataVal);
        jukeboxTrack = parsed.track || "";
        jukeboxArtist = parsed.artist || "";
        spotifyUrl = parsed.spotifyUrl || "";
      } catch {
        /* ignore */
      }
    }

    const payload = {
      guestNames,
      guestPhone,
      brunchAttending,
      brunchKids,
      barAttending,
      dietary,
      jukeboxTrack,
      jukeboxArtist,
      spotifyUrl,
    };

    fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          warning?: boolean;
        };
        rsvpForm.classList.remove("opacity-50", "pointer-events-none");
        if (!res.ok) {
          showToast(
            data.warning ? "warning" : "error",
            data.error || "Could not save your RSVP."
          );
          return;
        }
        showToast("success", "RSVP received. We can't wait to celebrate with you.");
      })
      .catch(() => {
        rsvpForm.classList.remove("opacity-50", "pointer-events-none");
        showToast("error", "Could not save your RSVP.");
      });
  };
  rsvpForm?.addEventListener("submit", submitHandler);

  fetch("/api/auth/login")
    .then((res) => res.json())
    .then((data: { guest?: Guest | null }) => {
      if (data.guest) {
        pendingPhone = data.guest.phone;
        const input = document.getElementById(
          "guestSearchInput"
        ) as HTMLInputElement | null;
        if (input && !input.value) input.value = data.guest.phone;
      }
    })
    .catch(() => undefined);

  return () => {
    if (countdownTimer) clearInterval(countdownTimer);
    if (searchDebounce) clearTimeout(searchDebounce);
    faqClicks.forEach(([el, handler]) => el.removeEventListener("click", handler));
    mobileMenuBtn?.removeEventListener("click", mobileHandler);
    songSearchInput?.removeEventListener("input", songInputHandler);
    document.removeEventListener("click", outsideClick);
    rsvpForm?.removeEventListener("submit", submitHandler);
  };
}
