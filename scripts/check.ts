// Sanity checks for puzzle content and generators: `npm run check`
import assert from "node:assert/strict";
import { rngFrom } from "../src/lib/rng";
import { parseBoard, parseProgram, runToEnd } from "../src/games/robot/engine";
import { ROBOT_LEVELS } from "../src/games/robot/levels";
import { generateLights, press, solve } from "../src/games/lights/logic";
import { generateJugs, shortestPath } from "../src/games/jugs/logic";
import { generateNonogram, isSolved } from "../src/games/nonogram/logic";
import { move, nextMove } from "../src/games/hanoi/logic";
import { makeQuestion } from "../src/games/sprint/logic";
import { SCENARIOS } from "../src/games/situation/data";
import { bestBudget, bestSchedule } from "../src/games/situation/solver";

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
    return `${s.steps} steps`;
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

for (const sc of SCENARIOS) {
  check(`situation ${sc.id}`, () => {
    const best = sc.kind === "budget" ? bestBudget(sc) : bestSchedule(sc);
    assert.ok(Number.isFinite(best) && best > 0);
    return `best ${best}`;
  });
}

if (failures) {
  console.log(`\n${failures} check(s) failed`);
  process.exit(1);
}
