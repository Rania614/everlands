import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addDays, diffDays, weekKeyOf, weekNumber } from "@/lib/dates";
import { computeWeekProgress, unlockExplanation, weekTarget } from "@/lib/progression";
import type { Quest } from "@/types/quest";
import { WEEK, doneOn, plan, task } from "./helpers";

/** A 20-unit week: 4 core tasks (2+2+2+3 = 9) + supporting work (11). */
function buildWeek(): Quest[] {
  return [
    task({ id: "en-class", coreGoalId: "goal-english", kind: "core", effortUnits: 2 }),
    task({ id: "en-hw", coreGoalId: "goal-english", kind: "core", effortUnits: 2 }),
    task({ id: "tech-topic", category: "tech", locationId: "workshop", coreGoalId: "goal-tech", kind: "core", effortUnits: 2 }),
    task({ id: "tech-practice", category: "tech", locationId: "workshop", coreGoalId: "goal-tech", kind: "core", effort: "L", effortUnits: 3 }),
    task({ id: "s1", effort: "L", effortUnits: 3, date: addDays(WEEK, 1) }),
    task({ id: "s2", effort: "L", effortUnits: 3, date: addDays(WEEK, 2) }),
    task({ id: "s3", effortUnits: 2, date: addDays(WEEK, 3) }),
    task({ id: "s4", effort: "L", effortUnits: 3, date: addDays(WEEK, 4) }),
    task({ id: "quran", category: "quran", locationId: "gardens", effortUnits: 2 }),
  ];
}

const complete = (tasks: Quest[], ids: string[], day: string) =>
  tasks.map((t) => (ids.includes(t.id) ? doneOn(t, day) : t));

describe("weekly progression", () => {
  it("excludes Quran tasks from the target", () => {
    assert.equal(weekTarget(buildWeek(), WEEK), 20);
  });

  it("scenarios 1–5: 50% on one day, more on another, >75% with all core goals → unlocked", () => {
    let tasks = buildWeek();
    // Day 1: 10 of 20 units (50%)
    tasks = complete(tasks, ["en-class", "en-hw", "s1", "s2"], WEEK);
    let p = computeWeekProgress(tasks, WEEK, plan);
    assert.equal(p.score, 50);
    assert.equal(p.unlocked, false);
    // Another day: finish the rest of the core goals and more work
    tasks = complete(tasks, ["tech-topic", "tech-practice", "s4"], addDays(WEEK, 3));
    p = computeWeekProgress(tasks, WEEK, plan);
    assert.equal(p.score, 90);
    assert.ok(p.coreGoalsAchieved);
    assert.equal(p.unlocked, true);
    // daily breakdown shows completed effort on two different days
    const busy = p.days.filter((d) => d.completedUnits > 0).map((d) => d.day);
    assert.deepEqual(busy, [WEEK, addDays(WEEK, 3)]);
  });

  it("scenarios 6–7: 90% but one Core Goal incomplete → stays locked with explanation", () => {
    let tasks = buildWeek();
    // Everything except tech-practice (3 units) → 17/20 = 85%; add extra work to reach 90%
    tasks = complete(tasks, ["en-class", "en-hw", "tech-topic", "s1", "s2", "s3", "s4"], WEEK);
    tasks.push(doneOn(task({ id: "x1", planStatus: "extra", kind: "stretch", effortUnits: 1 }), WEEK));
    const p = computeWeekProgress(tasks, WEEK, plan);
    assert.equal(p.score, 90);
    assert.equal(p.coreGoalsAchieved, false);
    assert.equal(p.unlocked, false);
    assert.match(unlockExplanation(p), /still open: Technical/);
  });

  it("scenarios 8–9: all Core Goals done but 70% → stays locked", () => {
    let tasks = buildWeek();
    // core goals 9 units + s3 (2) + s1 (3) = 14/20 = 70%
    tasks = complete(tasks, ["en-class", "en-hw", "tech-topic", "tech-practice", "s3", "s1"], WEEK);
    const p = computeWeekProgress(tasks, WEEK, plan);
    assert.equal(p.score, 70);
    assert.equal(p.coreGoalsAchieved, true);
    assert.equal(p.unlocked, false);
    assert.match(unlockExplanation(p), /more units? to pass 75%/);
  });

  it("requires strictly more than 75%", () => {
    // target 4, counted 3 = exactly 75%
    const tasks = [doneOn(task({ effortUnits: 3 }), WEEK), task({ effortUnits: 1 })];
    const p = computeWeekProgress(tasks, WEEK, { requirements: [], bonusCapPct: 25 });
    assert.equal(p.score, 75);
    assert.equal(p.unlocked, false);
  });

  it("scenarios 10–11: moving a task between days keeps the score without double counting", () => {
    let tasks = complete(buildWeek(), ["s1"], WEEK);
    const before = computeWeekProgress(tasks, WEEK, plan);
    tasks = tasks.map((t) => (t.id === "s1" ? { ...t, date: addDays(WEEK, 5) } : t));
    tasks = tasks.map((t) => (t.id === "s2" ? { ...t, date: null } : t));
    const after = computeWeekProgress(tasks, WEEK, plan);
    assert.equal(after.target, before.target);
    assert.equal(after.countedUnits, before.countedUnits);
    assert.equal(after.score, before.score);
  });

  it("scenarios 12–13: undoing a completed task recalculates", () => {
    let tasks = complete(buildWeek(), ["s1", "s2"], WEEK);
    assert.equal(computeWeekProgress(tasks, WEEK, plan).countedUnits, 6);
    tasks = tasks.map((t) => (t.id === "s2" ? { ...t, status: "todo", completedAt: null } : t));
    const p = computeWeekProgress(tasks, WEEK, plan);
    assert.equal(p.countedUnits, 3);
    assert.equal(p.score, 15);
  });

  it("caps additional work at the bonus limit (no unlimited inflation)", () => {
    const tasks: Quest[] = [task({ effortUnits: 3 }), task({ effortUnits: 3 }), task({ effortUnits: 2 })]; // target 8
    for (let i = 0; i < 20; i++) tasks.push(doneOn(task({ planStatus: "extra", kind: "optional", effortUnits: 1 }), WEEK));
    const p = computeWeekProgress(tasks, WEEK, { requirements: [], bonusCapPct: 25 });
    assert.equal(p.extraDone, 20);
    assert.equal(p.extraCap, 2);
    assert.equal(p.countedUnits, 2);
    assert.equal(p.unlocked, false, "extra work alone cannot replace the plan");
  });

  it("score can exceed 100% within the cap", () => {
    const tasks: Quest[] = [doneOn(task({ effortUnits: 3 }), WEEK), doneOn(task({ effortUnits: 1 }), WEEK)];
    tasks.push(doneOn(task({ planStatus: "extra", kind: "stretch", effortUnits: 3 }), WEEK));
    const p = computeWeekProgress(tasks, WEEK, { requirements: [], bonusCapPct: 25 });
    assert.equal(p.score, 125);
  });

  it("scenario 25: Quran activity never changes the score", () => {
    const tasks = buildWeek();
    const before = computeWeekProgress(tasks, WEEK, plan);
    const after = computeWeekProgress(complete(tasks, ["quran"], WEEK), WEEK, plan);
    assert.deepEqual(after, before);
    // even a Quran task wrongly linked to a core goal does not count
    const linked = complete(tasks.map((t) => (t.id === "quran" ? { ...t, coreGoalId: "goal-english" } : t)), ["quran"], WEEK);
    assert.equal(computeWeekProgress(linked, WEEK, plan).coreGoals[0].completed, 0);
  });

  it("tasks from other weeks never count", () => {
    const other = addDays(WEEK, 7);
    const tasks = [...buildWeek(), doneOn(task({ weekKey: other, date: other, effortUnits: 3 }), other)];
    assert.equal(computeWeekProgress(tasks, WEEK, plan).countedUnits, 0);
  });
});

describe("dates", () => {
  it("computes week keys for each week-start option", () => {
    assert.equal(weekKeyOf("2026-11-12", 6), "2026-11-07"); // Thu → Sat
    assert.equal(weekKeyOf("2026-11-07", 6), "2026-11-07");
    assert.equal(weekKeyOf("2026-11-12", 0), "2026-11-08"); // Sunday start
    assert.equal(weekKeyOf("2026-11-12", 1), "2026-11-09"); // Monday start
  });

  it("is safe across DST boundaries and year ends", () => {
    // Europe/US DST change weekends
    assert.equal(diffDays("2026-03-28", "2026-04-04"), 7);
    assert.equal(diffDays("2026-10-24", "2026-10-31"), 7);
    assert.equal(addDays("2026-12-31", 1), "2027-01-01");
    assert.equal(weekNumber("2027-01-02", "2026-12-26", 6), 2);
  });
});
