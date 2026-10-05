// Sanity checks for puzzle content and generators: `npm run check`
import assert from "node:assert/strict";
import { rngFrom } from "../src/lib/rng";
import { parseBoard, parseProgram, runToEnd } from "../src/games/robot/engine";
import { ROBOT_LEVELS } from "../src/games/robot/levels";
import { RANDOM_TIERS, generateRobotLevel } from "../src/games/robot/generate";
import { generateLights, press, solve } from "../src/games/lights/logic";
import { generateJugs, shortestPath } from "../src/games/jugs/logic";
import { generateNonogram, isSolved } from "../src/games/nonogram/logic";
import { move, nextMove } from "../src/games/hanoi/logic";
import { makeQuestion } from "../src/games/sprint/logic";
import { THEMES } from "../src/games/situation/data";
import { generateScenario } from "../src/games/situation/generate";
import { bestBudget, bestSchedule } from "../src/games/situation/solver";
import { QUEST_NODES } from "../src/games/quest/data";
import {
  DAILY_LEVELS,
  MAX_LEVEL,
  MIN_LEVEL,
  dailyPlan,
  isBossDay,
  isMapDay,
  nextLevel,
  playLevel,
  sprintDailyStars,
} from "../src/games/daily/plan";
import { HUNT, addHuntStars, huntLabel, huntTotal, isFixedLevel, isHuntDay } from "../src/games/daily/hunt";
import { COINS, applyRewards, spend, winRewards } from "../src/lib/coins";
import { ACHIEVEMENTS, newlyEarned } from "../src/lib/achievements";
import { daysBetween, streakFromDailies, weekOf } from "../src/lib/date";
import { generateNonogram as genNono } from "../src/games/nonogram/logic";
import { claimCode, nodeSeed, verifyClaim } from "../src/games/quest/progress";
import { theme } from "../src/games/situation/data";
import { robotLevel } from "../src/games/robot/levels";
import { GEMS, LOCK_LEVELS, allCodes, generateLock, score, stillPossible } from "../src/games/lock/logic";
import { HARBOR_BANK } from "../src/games/harbor/bank";
import {
  HARBOR_LEVELS,
  SIZE,
  cellsOf,
  decodeHarbor,
  isSolved as harborSolved,
  nextMove as harborNext,
  type HarborLevel,
} from "../src/games/harbor/logic";
import { harborFromSeed } from "../src/games/harbor/puzzles";
import { SUDOKU_LEVELS, clashes, generateSudoku } from "../src/games/sudoku/logic";
import { SERIES_COUNT, generateSeries } from "../src/games/series/logic";
import { bumpLog, weekCompare, weekReport } from "../src/lib/weekly";
import { emptyProgress } from "../src/lib/store";
import { WEB_SERIAL_MAX, bangkokDay, dailySerial, makeCode, manualSerial } from "../src/lib/kidtimer/core";
import { rewardMinutes } from "../src/lib/kidtimer/reward";
import { decodeProgress, encodeProgress } from "../src/lib/share";

let failures = 0;
function check(name: string, fn: () => string | void) {
  try {
    const info = fn();
    console.log(`ok   ${name}${info ? ` — ${info}` : ""}`);
  } catch (e) {
    failures++;
    console.log(`FAIL ${name}: ${(e as Error).message}`);
  }
}

for (const lv of ROBOT_LEVELS) {
  check(`robot ${lv.id} ${lv.titleEn}`, () => {
    const b = parseBoard(lv.board);
    assert.ok(b.tiles[lv.start.y * b.w + lv.start.x], "start tile is void");
    assert.ok(b.stars.length > 0, "no stars");
    const s = runToEnd(lv, parseProgram(lv.solution, lv.funcs));
    assert.equal(s.status, "won", `solution ends with ${s.status} at ${s.x},${s.y}`);
    if (lv.preset) {
      const bug = runToEnd(lv, parseProgram(lv.preset, lv.funcs));
      assert.notEqual(bug.status, "won", "buggy preset already wins");
      return `${s.steps} steps, preset fails with ${bug.status}`;
    }
    return `${s.steps} steps`;
  });
}

for (const tier of RANDOM_TIERS) {
  check(`robot random ${tier.id} (200 seeds)`, () => {
    const t0 = Date.now();
    const sizes = new Set<string>();
    for (let seed = 0; seed < 200; seed++) {
      const lv = generateRobotLevel(tier.id, seed);
      const s = runToEnd(lv, parseProgram(lv.solution, lv.funcs));
      assert.equal(s.status, "won", `seed ${seed}: ${lv.solution} → ${s.status}\n${lv.board.join("\n")}`);
      sizes.add(`${lv.board[0].length}x${lv.board.length}`);
    }
    return `${((Date.now() - t0) / 200).toFixed(1)}ms/level, ${sizes.size} board sizes`;
  });
}

check("lights generator + solver", () => {
  for (let i = 0; i < 30; i++) {
    for (const n of [4, 5, 6]) {
      const p = generateLights(rngFrom(`l${i}${n}`), n);
      let g = p.grid;
      for (const c of solve(g, n)!) g = press(g, n, c);
      assert.ok(g.every((v) => !v));
    }
  }
});

check("jugs generator", () => {
  for (let i = 0; i < 40; i++) {
    for (const v of ["two", "three"] as const) {
      const p = generateJugs(rngFrom(`j${i}${v}`), v);
      const path = shortestPath(p.start, p.caps, p.source, p.target);
      assert.ok(path && path.length === p.par, `par mismatch ${JSON.stringify(p)}`);
    }
  }
});

check("nonogram generator", () => {
  for (let i = 0; i < 20; i++) {
    const p = generateNonogram(rngFrom(`n${i}`), 10);
    assert.ok(isSolved(p.solution.map((v) => (v ? 1 : 0)), p));
  }
});

check("hanoi hint solves optimally", () => {
  for (const n of [3, 5, 7]) {
    let pos = Array(n).fill(0);
    let moves = 0;
    for (let m = nextMove(pos, n, 2); m; m = nextMove(pos, n, 2)) {
      pos = move(pos, m.from, m.to);
      moves++;
    }
    assert.equal(moves, 2 ** n - 1);
  }
});

check("sprint answers are whole non-negative numbers", () => {
  const rng = rngFrom("sprint");
  for (let i = 0; i < 2000; i++) {
    const q = makeQuestion(rng, i % 5);
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0, q.text);
  }
});

for (const th of THEMES) {
  check(`situation ${th.id} (50 seeds)`, () => {
    const t0 = Date.now();
    const bests: number[] = [];
    for (let seed = 0; seed < 50; seed++) {
      const sc = generateScenario(th, seed);
      const best = sc.kind === "budget" ? bestBudget(sc) : bestSchedule(sc);
      assert.ok(Number.isFinite(best) && best > 0, `seed ${seed}`);
      if (sc.kind === "budget") {
        const all = sc.items.reduce((a, i) => a + i.value, 0);
        assert.ok(best < all, `seed ${seed}: taking everything is optimal`);
      }
      bests.push(best);
    }
    return `best ${Math.min(...bests)}–${Math.max(...bests)}, ${((Date.now() - t0) / 50).toFixed(0)}ms/puzzle`;
  });
}

check("quest map", () => {
  const ids = QUEST_NODES.map((n) => n.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate node id");
  const robots = QUEST_NODES.flatMap((n) => (n.kind === "robot" ? [n.level] : []));
  for (const id of robots) assert.ok(robotLevel(id), `unknown robot level ${id}`);
  const missing = ROBOT_LEVELS.filter((l) => !robots.includes(l.id)).map((l) => l.id);
  assert.deepEqual(missing, [], "robot levels missing from the quest");
  for (const n of QUEST_NODES) {
    if (n.kind === "situation") assert.ok(theme(n.theme), `unknown theme ${n.theme}`);
    if (n.kind === "lights") {
      const p = generateLights(rngFrom(nodeSeed(n)), n.size, n.minPar);
      if (n.maxPar) assert.ok(p.par <= n.maxPar, `${n.id} par ${p.par}`);
    }
    if (n.kind === "jugs") {
      const p = generateJugs(rngFrom(nodeSeed(n)), n.variant);
      if (n.maxPar) assert.ok(p.par <= n.maxPar, `${n.id} par ${p.par}`);
    }
  }
  const code = claimCode("Tetus", 2);
  assert.ok(verifyClaim(" tetus ", code).ok, "claim code round trip");
  assert.ok(!verifyClaim("someone", code).ok, "claim code accepts wrong name");
  return `${QUEST_NODES.length} nodes`;
});

for (let level = MIN_LEVEL; level <= MAX_LEVEL; level++) {
  const T = DAILY_LEVELS[level].tuning;
  check(`daily plan Lv${level} (365 days)`, () => {
    const counts: Record<string, number> = {};
    const d = new Date(2026, 0, 1);
    for (let i = 0; i < 365; i++, d.setDate(d.getDate() + 1)) {
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      const plan = dailyPlan(key, level);
      assert.equal(new Set(plan.map((s) => s.kind)).size, 3, `${key} repeats a game`);
      assert.deepEqual(dailyPlan(key, level), plan, "plan is not deterministic");
      for (const st of plan) {
        counts[st.kind] = (counts[st.kind] ?? 0) + 1;
        if (st.kind === "lights") {
          const par = generateLights(rngFrom(st.seed), st.size, st.minPar).par;
          assert.ok(par >= T.lights.par[0] && par <= T.lights.par[1], `${key} lights par ${par}`);
        }
        if (st.kind === "jugs") {
          const par = generateJugs(rngFrom(st.seed), st.variant).par;
          assert.ok(par >= T.jugs.par[0] && par <= T.jugs.par[1], `${key} jugs par ${par}`);
          assert.ok(T.jugs.variants.includes(st.variant), `${key} jugs variant`);
        }
        if (st.kind === "nonogram") genNono(rngFrom(st.seed), st.size);
        if (st.kind === "robot") {
          const lv = generateRobotLevel(st.tier, st.seed, st.opts);
          const max = T.robot.maxSize;
          assert.ok(lv.board.length <= max && lv.board[0].length <= max, `${key} robot board too big`);
          assert.ok(!/d/.test(lv.solution), `${key} robot needs a loop`);
          assert.equal(runToEnd(lv, parseProgram(lv.solution, lv.funcs)).status, "won");
        }
        if (st.kind === "situation") {
          const sc = generateScenario(theme(st.theme)!, st.seed, st.pick);
          assert.ok((sc.kind === "budget" ? bestBudget(sc) : bestSchedule(sc)) > 0, `${key} situation`);
        }
        if (st.kind === "lock") assert.equal(generateLock(rngFrom(st.seed), st.level).code.length, LOCK_LEVELS[st.level].pegs);
        if (st.kind === "harbor") assert.ok(harborFromSeed(st.seed, st.level).par > 0);
        if (st.kind === "sudoku") generateSudoku(rngFrom(st.seed), st.level);
        if (st.kind === "series") assert.equal(generateSeries(rngFrom(st.seed), st.level).items.length, SERIES_COUNT);
      }
    }
    return Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(", ");
  });
}

check("daily level rule", () => {
  const run = (level: number, stars: number, hints = 0) => ({ level, stars, max: 9, hints });
  assert.equal(nextLevel(3, [run(3, 9), run(3, 8), run(3, 9)]), 4, "three strong runs move up");
  assert.equal(nextLevel(3, [run(3, 9), run(3, 9)]), 3, "two strong runs are not enough");
  assert.equal(nextLevel(3, [run(3, 9), run(3, 9), run(3, 9, 1)]), 3, "a hint blocks moving up");
  assert.equal(nextLevel(3, [run(2, 9), run(3, 9), run(3, 9)]), 3, "runs at another level don't count");
  assert.equal(nextLevel(3, [run(3, 5), run(3, 9, 3)]), 2, "two rough runs move down");
  assert.equal(nextLevel(3, [run(3, 5), run(3, 9)]), 3, "one rough run stays");
  assert.equal(nextLevel(5, [run(5, 9), run(5, 9), run(5, 9)]), 5, "capped at the top");
  assert.equal(nextLevel(1, [run(1, 3), run(1, 3)]), 1, "floored at the bottom");
  assert.equal(playLevel(3, "2026-10-03"), 4, "Saturday is one level up");
  assert.equal(playLevel(5, "2026-10-03"), 5);
  assert.equal(playLevel(3, "2026-10-02"), 3);
  assert.ok(isBossDay("2026-10-03") && !isBossDay("2026-10-04"));
  assert.equal(sprintDailyStars(20, DAILY_LEVELS[2].tuning.sprint.stars), 3);
  assert.equal(sprintDailyStars(20, DAILY_LEVELS[4].tuning.sprint.stars), 2);
});

check("kidtimer codes", () => {
  // Test vectors from HANDOFF_WEBSITE.md — the PC rejects anything else.
  const k1 = "11".repeat(32);
  const vectors: [string, number, number, string][] = [
    [k1, 15, 1, "CAAQ-AAAB-GIAPU7I"],
    [k1, 60, 2, "CACA-AAAC-FFHKNQQ"],
    [k1, 120, 1, "CAEA-AAAB-NWVG2HY"],
    [k1, 240, 1000, "CAIA-AA7I-V7ZQBHA"],
    [k1, 60, 8388607, "CACH-7777-SYH7NKI"],
    ["00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff", 90, 42, "CADA-AABK-LNOZCLI"],
  ];
  for (const [key, minutes, serial, code] of vectors) assert.equal(makeCode(key, minutes, serial), code);
  assert.throws(() => makeCode(k1, 10, 1), /multiple of 15/);
  assert.throws(() => makeCode(k1, 15, 0x800000), /serial out of range/);

  // Daily reward: 60 + 10/star, rounded up to 15.
  assert.deepEqual([0, 1, 3, 6, 7, 9, 12].map(rewardMinutes), [60, 75, 90, 120, 135, 150, 150]);

  // Serials: one per Daily day, manual ones above them, all inside the website range.
  assert.equal(dailySerial("2026-01-01"), 1);
  assert.equal(dailySerial("2026-10-05"), 278);
  assert.ok(dailySerial("2099-12-31") < 100_000);
  const t = Date.UTC(2026, 9, 5, 12, 0);
  assert.ok(manualSerial(t) > 100_000 && manualSerial(t + 60_000) === manualSerial(t) + 1);
  assert.ok(manualSerial(Date.UTC(2041, 5, 30)) <= WEB_SERIAL_MAX, "manual serials last into 2041");
  // 23:30 UTC on Oct 4 is already Oct 5 in Bangkok.
  assert.equal(bangkokDay(Date.UTC(2026, 9, 4, 23, 30)), "2026-10-05");
  assert.equal(bangkokDay(Date.UTC(2026, 9, 4, 23, 30), -1), "2026-10-04");
});

check("map days", () => {
  const d = new Date(2026, 0, 4); // a Sunday
  for (let w = 0; w < 52; w++) {
    const week = Array.from({ length: 7 }, (_, i) => {
      const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + w * 7 + i);
      return `${x.getFullYear()}-${x.getMonth() + 1}-${x.getDate()}`;
    });
    const days = week.map(isMapDay);
    const n = days.filter(Boolean).length;
    assert.ok(n === 2 || n === 3, `week ${week[0]} has ${n} map days`);
    assert.ok(!days[0] && !days[3], "a map day landed on a Star Hunt day");
  }
});

check("treasure lock", () => {
  assert.deepEqual(score([0, 1, 2, 3], [0, 2, 1, 5]), { exact: 1, near: 2 });
  assert.deepEqual(score([1, 1, 2, 2], [1, 2, 2, 2]), { exact: 3, near: 0 }, "repeats counted once");
  assert.deepEqual(score([3, 3, 0, 1], [3, 0, 3, 3]), { exact: 1, near: 2 });
  for (const level of Object.keys(LOCK_LEVELS) as (keyof typeof LOCK_LEVELS)[]) {
    const cfg = LOCK_LEVELS[level];
    assert.ok(cfg.colors <= GEMS.length);
    for (let i = 0; i < 100; i++) {
      const p = generateLock(rngFrom(`lock:${level}:${i}`), level);
      assert.equal(p.code.length, cfg.pegs);
      if (!cfg.repeats) assert.equal(new Set(p.code).size, cfg.pegs, "repeat in a no-repeat lock");
      const guess = allCodes(cfg)[0];
      const left = stillPossible(cfg, [{ guess, fb: score(p.code, guess) }]);
      assert.ok(left.some((c) => c.join() === p.code.join()), "the code was ruled out");
    }
  }
  return `${allCodes(LOCK_LEVELS.hard).length} hard codes`;
});

check("harbor bank", () => {
  const sizes: string[] = [];
  for (const level of Object.keys(HARBOR_LEVELS) as HarborLevel[]) {
    const [lo, hi] = HARBOR_LEVELS[level].par;
    const bank = HARBOR_BANK[level];
    assert.ok(bank.length >= 100, `${level} bank too small`);
    assert.equal(new Set(bank).size, bank.length, "duplicate harbor");
    for (const code of bank) {
      const p = decodeHarbor(code);
      assert.ok(p.par >= lo && p.par <= hi, `${level} par ${p.par}`);
      const cells = p.boats.flatMap((b, i) => cellsOf(b, p.start[i]));
      assert.equal(new Set(cells).size, cells.length, "boats overlap");
      assert.ok(cells.every((c) => c >= 0 && c < SIZE * SIZE), "boat off the board");
    }
    // Following the hints from the start reaches the exit in exactly par moves.
    for (const code of bank.slice(0, 15)) {
      const p = decodeHarbor(code);
      let s = p.start;
      let n = 0;
      while (!harborSolved(s)) {
        const m = harborNext(p.boats, s)!;
        s = s.map((x, j) => (j === m.boat ? m.to : x));
        n++;
      }
      assert.equal(n, p.par, "par is not the shortest way out");
    }
    sizes.push(`${level} ${bank.length}`);
  }
  assert.deepEqual(harborFromSeed(42, "hard"), harborFromSeed(42, "hard"), "same seed, same harbor");
  return sizes.join(", ");
});

check("map sudoku", () => {
  for (const level of Object.keys(SUDOKU_LEVELS) as (keyof typeof SUDOKU_LEVELS)[]) {
    for (let i = 0; i < 60; i++) {
      const p = generateSudoku(rngFrom(`sudoku:${level}:${i}`), level);
      assert.equal(clashes(p.solution, p.n).size, 0, "solution breaks the rules");
      assert.ok(p.solution.every((v) => v >= 1 && v <= p.n));
      assert.ok(p.givens.every((v, k) => !v || v === p.solution[k]), "clue disagrees with the solution");
      assert.ok(p.givens.filter(Boolean).length <= SUDOKU_LEVELS[level].givens + 3, "too many clues left");
    }
  }
});

check("number series", () => {
  for (const level of ["easy", "normal", "hard"] as const) {
    for (let i = 0; i < 200; i++) {
      const p = generateSeries(rngFrom(`series:${level}:${i}`), level);
      assert.equal(p.items.length, SERIES_COUNT);
      for (const s of p.items) {
        assert.ok(Number.isInteger(s.answer) && Math.abs(s.answer) <= 999, `answer ${s.answer}`);
        assert.ok(s.terms.length >= 5 && s.terms.every(Number.isInteger));
      }
    }
  }
});

check("hint coins", () => {
  const w0 = { coins: COINS.start, coinLog: [], rewarded: {} };
  const r = { amount: 3, reason: "x", once: "a" };
  const w1 = applyRewards(w0, [r, r]).wallet;
  assert.equal(w1.coins, COINS.start + 3, "a once-key paid twice");
  const nearFull = applyRewards({ ...w0, coins: COINS.cap - 1 }, [{ ...r, once: "b" }]);
  assert.equal(nearFull.wallet.coins, COINS.cap, "wallet passed the cap");
  assert.equal(nearFull.overflow, 2, "overflow not reported (it becomes XP)");
  assert.equal(spend({ ...w0, coins: 2 }, "shop", 3), null, "bought something unaffordable");
  assert.equal(spend({ ...w0, coins: 0 }, "hint"), null, "spent from an empty wallet");
  let rewarded: Record<string, number> = {};
  let paid = 0;
  for (let i = 0; i < 10; i++) {
    const rs = winRewards({ key: "logic:lights", stars: 3, firstWin: false, isBoss: false, today: "d", rewarded });
    const res = applyRewards({ ...w0, coins: 0, rewarded }, rs);
    paid += res.gained.reduce((a, g) => a + g.amount, 0);
    rewarded = res.wallet.rewarded;
  }
  assert.equal(paid, COINS.freePlayPerDay, "free play daily cap");
  const boss = winRewards({ key: "quest:b10", stars: 3, firstWin: true, isBoss: true, today: "d", rewarded: {} });
  assert.equal(boss.reduce((a, g) => a + g.amount, 0), 3, "boss 3★ first win");
});

check("streak days + badges", () => {
  assert.equal(daysBetween("2026-09-28", "2026-09-29"), 1);
  assert.equal(daysBetween("2026-02-27", "2026-03-02"), 3);
  const week = weekOf("2026-10-01"); // a Thursday
  assert.equal(week[0], "2026-09-27", "week should start on Sunday");
  assert.equal(week[6], "2026-10-03");
  const none = () => false;
  assert.deepEqual(
    streakFromDailies(["2026-09-20", "2026-09-21", "2026-09-23", "2026-09-24", "2026-09-25"], none),
    { streak: 3, bestStreak: 3, lastActive: "2026-09-25" },
    "a skipped day breaks the streak",
  );
  assert.equal(
    streakFromDailies(["2026-09-21", "2026-09-23"], (d) => d === "2026-09-22").streak,
    2,
    "a frozen day bridges the gap",
  );
  assert.deepEqual(streakFromDailies([], none), { streak: 0, bestStreak: 0, lastActive: null });
  const blank = {
    name: "", xp: 0, streak: 0, bestStreak: 0, lastActive: null, hintsUsed: 0, games: {}, daily: {},
    chests: {}, delivered: {}, seen: {}, coins: 5, coinLog: [], rewarded: {}, badges: {}, owned: {},
    equipped: {}, freezes: 0, activeDays: {},
  };
  assert.deepEqual(newlyEarned(blank), [], "badges earned with no progress");
  const played = { ...blank, games: { "quest:b1": { wins: 1, bestStars: 3, bestTimeMs: 1, bestScore: null } }, bestStreak: 7 };
  const ids = newlyEarned(played).map((a) => a.id);
  assert.ok(ids.includes("first-sail") && ids.includes("streak-7"), `got ${ids}`);
  assert.equal(newlyEarned({ ...played, badges: { "first-sail": 1, "streak-7": 1 } }).length, 0, "badge awarded twice");
  return `${ACHIEVEMENTS.length} badges`;
});

check("star hunt days", () => {
  // 2026-10-04 is a Sunday, 2026-10-07 a Wednesday
  assert.deepEqual(
    ["2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10"].map(isHuntDay),
    [true, false, false, true, false, false, false],
  );
  const day = "2026-10-04";
  let log = addHuntStars(undefined, day, "quest:b1", 2, 100, 4);
  log = addHuntStars(log, day, "quest:b1", 3, 200, 5);
  log = addHuntStars(log, day, "quest:b1", 1, 300, 5);
  assert.equal(huntTotal(log, day), 3, "same level counts its best once");
  assert.equal(log.startedAt, 100, "timer starts at the first star");
  log = addHuntStars(log, day, "logic:lights", 3, 400, 5);
  assert.equal(huntTotal(log, day), 6);
  assert.equal(huntTotal(log, "2026-10-05"), 0, "yesterday's stars don't carry over");
  assert.equal(huntTotal(addHuntStars(log, "2026-10-07", "sprint", 2, 500, 9), "2026-10-07"), 2, "new hunt day starts fresh");
  for (const k of [...QUEST_NODES.map((n) => `quest:${n.id}`), "logic:lights", "robot:rand-seq", "situation:camp", "sprint"])
    assert.ok(!huntLabel(k).includes(":"), `no label for ${k}`);
  assert.deepEqual(
    ["quest:b1", "robot:r03", "robot:rand-seq", "logic:lights", "situation:camp", "sprint"].map(isFixedLevel),
    [true, true, false, false, false, false],
    "only hand-made levels are fixed",
  );
  return `target ${HUNT.target}`;
});

check("weekly report", () => {
  const st = (kind: string, stars: number, ms?: number) => ({ kind, label: kind, stars, detail: "", ms });
  const p = {
    ...emptyProgress(),
    name: "Yok",
    daily: {
      // last week (Sun 2026-09-20 .. Sat 09-26)
      "2026-09-22": { timeMs: 400_000, hints: 3, stages: [st("lights", 2), st("jugs", 1), st("hanoi", 3)] },
      // this week (Sun 09-27 .. Sat 10-03)
      "2026-09-28": { timeMs: 300_000, hints: 1, stages: [st("lights", 3, 60_000), st("jugs", 1, 200_000), st("robot", 3, 40_000)] },
      "2026-09-30": { timeMs: 900_000, hints: 0, stages: [{ kind: "hunt", label: "", stars: 3, detail: "" }] },
      "2026-10-01": { timeMs: 100_000, hints: 0, stages: [st("lights", 3, 30_000), st("sprint", 2, 45_000), st("situation", 2)] },
    },
    activeDays: { "2026-09-29": "freeze" as const },
    dayLog: bumpLog(bumpLog(undefined, { wins: 1, stars: 3, quest: 1, coins: 2 }, "2026-09-28"), { wins: 2, stars: 4 }, "2026-10-01"),
  };
  const w = weekReport(p, "2026-10-01");
  assert.deepEqual(w.marks, ["miss", "play", "freeze", "play", "play", "future", "future"]);
  assert.equal(w.played, 3);
  assert.equal(w.runs, 2, "hunt day is not a timed run");
  assert.equal(w.totalMs, 400_000);
  assert.deepEqual(w.fastest, { day: "2026-10-01", ms: 100_000 });
  assert.equal(w.stars, 14);
  assert.equal(w.maxStars, 18);
  assert.equal(w.three, 3);
  assert.equal(w.hints, 1);
  assert.equal(w.noHintDays, 2);
  assert.equal(w.huntDays, 2, "Sunday and Wednesday so far");
  assert.equal(w.huntDone, 1);
  assert.equal(w.best?.kind, "lights", "ties go to the game played more");
  assert.equal(w.practice?.kind, "jugs");
  assert.deepEqual(w.outside, { wins: 3, stars: 7, quest: 1, coins: 2 });
  assert.deepEqual(w.prev, { runs: 1, avgMs: 400_000, hints: 3 });
  assert.equal(weekCompare(w, w.prev!), "เร็วขึ้น 50% · คำใบ้ลดลง 2");
  const old = bumpLog({ "2026-08-01": { wins: 1, stars: 1, quest: 0, coins: 0 } }, { wins: 1 }, "2026-10-01");
  assert.deepEqual(Object.keys(old), ["2026-10-01"], "old log days are pruned");
});

async function asyncChecks() {
  try {
    const p = { ...emptyProgress(), name: "Yok", xp: 1234, daily: { "2026-10-01": { timeMs: 1, hints: 0 } } };
    const code = await encodeProgress(p);
    assert.ok(code.startsWith("BD2."), "compressed code");
    const back = await decodeProgress(`สรุปสัปดาห์…

📥 โค้ด:
${code}
`);
    assert.equal(back.name, "Yok");
    assert.equal(back.xp, 1234);
    await assert.rejects(decodeProgress(code.slice(0, -2) + "zz"), /แก้ไข/);
    await assert.rejects(decodeProgress("ไม่มีโค้ด"), /ไม่เจอ/);
    console.log(`ok   share code — ${code.length} chars`);
  } catch (e) {
    failures++;
    console.log(`FAIL share code: ${(e as Error).message}`);
  }
}

void asyncChecks().then(() => {
  if (failures) {
    console.log(`\n${failures} check(s) failed`);
    process.exit(1);
  }
});
