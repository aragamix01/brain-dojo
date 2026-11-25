"use client";

import { useEffect } from "react";
import { shiftDay, dayKey } from "@/lib/date";
import { rewardStars } from "@/lib/kidtimer/reward";
import { hashString } from "@/lib/rng";
import { emptyProgress, snapshot, useProgress, type ProgressData } from "@/lib/store";

const KEY = "lq-synced";
const PROGRESS_KEY = "lq-progress-synced";
/** Progress changes with every puzzle; send it at most this often while playing. */
const PROGRESS_EVERY_MS = 20_000;

/** Recent Dailies worth PC time, minus days already paid with an old per-day code. */
function recent(p: Pick<ProgressData, "daily" | "timeCodes">) {
  const from = shiftDay(dayKey(), -13);
  return Object.entries(p.daily)
    .filter(([d]) => d >= from && !p.timeCodes?.[d])
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, r]) => ({ day, stars: rewardStars(r) }));
}

/** Sends recent Dailies unless this exact set already went up; resolves to how many were new. */
export async function syncDailies(force = false): Promise<number> {
  const days = recent(useProgress.getState());
  if (!days.length) return 0;
  const sig = days.map((d) => `${d.day}:${d.stars}`).join(",");
  try {
    if (!force && localStorage.getItem(KEY) === sig) return 0;
  } catch {
    /* storage blocked: just send */
  }
  try {
    const res = await fetch("/api/lq/player", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "syncDaily", days }),
    });
    if (!res.ok) return 0;
    try {
      localStorage.setItem(KEY, sig);
    } catch {
      /* fine: it resends next time */
    }
    return Number((await res.json()).added) || 0;
  } catch {
    return 0;
  }
}

const AT_KEY = "lq-progress-at";

const sigOf = (d: ProgressData) => String(hashString(JSON.stringify(d)));
const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* it resends next time */
  }
};

/** Sends the whole Brain Dojo save to the player's account, unless it hasn't changed since last time. */
export async function syncProgress(force = false): Promise<boolean> {
  const data = snapshot();
  const sig = sigOf(data);
  if (!force && read(PROGRESS_KEY) === sig) return false;
  try {
    const res = await fetch("/api/lq/player", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "syncProgress", data }),
    });
    if (!res.ok) return false;
    const { at } = await res.json();
    write(PROGRESS_KEY, sig);
    if (at) write(AT_KEY, String(at));
    return true;
  } catch {
    return false;
  }
}

/** A phone that has barely been played: nothing on it worth keeping over the account's save. */
const fresh = (p: ProgressData) => !Object.keys(p.daily).length && p.xp === 0;

/**
 * One save per PIN: when the account holds a newer save than this phone last saw (played on
 * another phone), take it, unless this phone has its own unsent progress. Then the bigger save
 * (more XP) wins and goes back up. Resolves true when the phone's save was replaced.
 */
export async function pullProgress(): Promise<boolean> {
  const since = Number(read(AT_KEY)) || 0;
  try {
    const res = await fetch(`/api/lq/player?part=brain&since=${since}`, { cache: "no-store" });
    if (!res.ok) return false;
    const r = (await res.json()) as { at?: number; data?: ProgressData };
    if (!r.data || !r.at) return false;
    const local = snapshot();
    const untouched = read(PROGRESS_KEY) === sigOf(local);
    if (untouched || fresh(local) || (r.data.xp ?? 0) > local.xp) {
      useProgress.getState().importData(r.data);
      write(PROGRESS_KEY, sigOf(snapshot()));
      write(AT_KEY, String(r.at));
      return true;
    }
    await syncProgress(true);
    return false;
  } catch {
    return false;
  }
}

const ACCOUNT_KEY = "lq-account";

/**
 * One Brain Dojo save per account. A phone that hasn't signed in before keeps what's on it (it's
 * this player's); signing in as someone else replaces it with an empty save, which `pullProgress`
 * then fills from that player's account. Returns true when the phone's save was swapped.
 */
export function adoptAccount(id: string, name?: string): boolean {
  const current = read(ACCOUNT_KEY);
  if (current === id) return false;
  write(ACCOUNT_KEY, id);
  if (current === null) return false;
  for (const k of [KEY, PROGRESS_KEY, AT_KEY])
    try {
      localStorage.removeItem(k);
    } catch {
      /* fine */
    }
  useProgress.getState().importData({ ...emptyProgress(), name: name ?? "" });
  return true;
}

/** Brain Dojo shows the account's name (on the wanted poster) when its save has none yet. */
export function nameIfBlank(name?: string) {
  if (name && !useProgress.getState().name) useProgress.getState().setName(name);
}

/** After signing in: this player's save first (maybe from another phone), then anything new here. */
export async function afterSignIn(id: string, name?: string) {
  adoptAccount(id, name);
  await pullProgress();
  nameIfBlank(name);
  // The Dailies decide the PC time shown next, so they go first; the whole save can follow in the background.
  await syncDailies(true);
  void syncProgress();
}

/** Runs `fn` once the saved progress has loaded from storage. */
export function afterHydration(fn: () => void): () => void {
  if (useProgress.persist.hasHydrated()) {
    fn();
    return () => {};
  }
  return useProgress.persist.onFinishHydration(fn);
}

/**
 * Sends finished Dailies to Weekly Life Quest, where the parent turns them into PC time. Only
 * works once the player has signed in to Life Quest on this phone (the cookie says who it is);
 * until then the server says no, and the Life Quest home page sends them after sign-in.
 */
export function LifeSync() {
  const daily = useProgress((s) => s.daily);
  const timeCodes = useProgress((s) => s.timeCodes);
  useEffect(() => {
    if (useProgress.persist.hasHydrated()) void syncDailies();
  }, [daily, timeCodes]);

  // The whole save, for the parent's Brain Dojo tab: soon after any change, and when the app is left.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const flush = () => {
      if (timer) clearTimeout(timer);
      timer = null;
      void syncProgress();
    };
    const offHydrate = afterHydration(() => void pullProgress().then(flush));
    const offChange = useProgress.subscribe(() => {
      if (!timer) timer = setTimeout(flush, PROGRESS_EVERY_MS);
    });
    const onHide = () => document.visibilityState === "hidden" && timer && flush();
    document.addEventListener("visibilitychange", onHide);
    return () => {
      offHydrate();
      offChange();
      document.removeEventListener("visibilitychange", onHide);
      if (timer) clearTimeout(timer);
    };
  }, []);
  return null;
}
