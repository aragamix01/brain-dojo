// Puzzle seeds live in the URL (?s=code) so a link reproduces the exact same puzzle.

export const seedToCode = (seed: number) => (seed >>> 0).toString(36);

export function codeToSeed(code: string | null): number | null {
  if (!code || !/^[0-9a-z]{1,7}$/.test(code)) return null;
  const n = parseInt(code, 36);
  return n < 2 ** 32 ? n : null;
}

export function readParams(): URLSearchParams {
  return new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
}

export function writeParams(params: Record<string, string>) {
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  window.history.replaceState(window.history.state, "", url);
}

/** Share the current page link; returns true when it was copied rather than shared. */
export async function shareCurrentUrl(title: string): Promise<boolean> {
  const url = window.location.href;
  try {
    if (navigator.share) {
      await navigator.share({ title, text: `${title} — มาลองแข่งกัน!`, url });
      return false;
    }
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false; // user cancelled the share sheet
  }
}
