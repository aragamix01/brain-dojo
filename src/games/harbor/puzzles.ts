import { rngFrom } from "@/lib/rng";
import { HARBOR_BANK } from "./bank";
import { decodeHarbor, type HarborLevel, type HarborPuzzle } from "./logic";

/** A harbor from the pre-built bank, picked by seed so a shared seed gives the same layout. */
export function harborFromSeed(seed: number, level: HarborLevel): HarborPuzzle {
  const bank = HARBOR_BANK[level];
  return decodeHarbor(bank[Math.floor(rngFrom(`harbor:${seed}`)() * bank.length)]);
}
