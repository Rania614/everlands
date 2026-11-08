import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dayChoices, defaultQuranDone, formatQuranInput, isAllDay, parseQuranInput, weekForDate } from "@/lib/quickAdd";

describe("quick add defaults", () => {
  it("offers today / tomorrow / this week", () => {
    const c = dayChoices("2026-11-08");
    assert.deepEqual(c.map((x) => [x.id, x.date]), [["today", "2026-11-08"], ["tomorrow", "2026-11-09"], ["week", null], ["pick", null]]);
  });
  it("puts dated tasks in their own week and undated ones in the current week", () => {
    assert.equal(weekForDate("2026-11-15", "2026-11-08", 6), "2026-11-14");
    assert.equal(weekForDate(null, "2026-11-08", 6), "2026-11-07");
    assert.equal(weekForDate(null, "2026-11-08", 6, "2026-11-14"), "2026-11-14");
  });
  it("treats events without a time as all-day", () => {
    assert.equal(isAllDay(""), true);
    assert.equal(isAllDay(null), true);
    assert.equal(isAllDay("18:00"), false);
  });
  it("assumes past/today Quran sessions are done, future ones planned", () => {
    assert.equal(defaultQuranDone("2026-11-08", "2026-11-08"), true);
    assert.equal(defaultQuranDone("2026-11-07", "2026-11-08"), true);
    assert.equal(defaultQuranDone("2026-11-09", "2026-11-08"), false);
  });
});

describe("Quran quick range field (scenario 5: minimal input, full data kept)", () => {
  it("parses surah, ayah and page ranges from one field", () => {
    assert.deepEqual(parseQuranInput("Al-Mulk"), { surah: "Al-Mulk", fromAyah: null, toAyah: null, fromPage: null, toPage: null });
    assert.deepEqual(parseQuranInput("Al-Mulk 1-15"), { surah: "Al-Mulk", fromAyah: 1, toAyah: 15, fromPage: null, toPage: null });
    assert.deepEqual(parseQuranInput("Al-Mulk 1–15"), { surah: "Al-Mulk", fromAyah: 1, toAyah: 15, fromPage: null, toPage: null });
    assert.deepEqual(parseQuranInput("Al-Baqarah 255"), { surah: "Al-Baqarah", fromAyah: 255, toAyah: null, fromPage: null, toPage: null });
    assert.deepEqual(parseQuranInput("Al-Mulk p562-564"), { surah: "Al-Mulk", fromAyah: null, toAyah: null, fromPage: 562, toPage: 564 });
    assert.deepEqual(parseQuranInput("pages 562 - 564"), { surah: "", fromAyah: null, toAyah: null, fromPage: 562, toPage: 564 });
    assert.deepEqual(parseQuranInput("ص 10"), { surah: "", fromAyah: null, toAyah: null, fromPage: 10, toPage: null });
  });
  it("round-trips for editing", () => {
    for (const s of ["Al-Mulk 1-15", "Al-Mulk p562-564", "Yasin"]) assert.equal(formatQuranInput(parseQuranInput(s)), s);
  });
});
