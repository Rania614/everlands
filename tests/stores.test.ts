import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { buildFeed } from "@/lib/calendarFeed";
import { addDays, weekKeyOf } from "@/lib/dates";
import { confirmPlan, levelAt, syncWeeks } from "@/lib/lifecycle";
import { computeWeekProgress, weekTarget } from "@/lib/progression";
import { occurrencesInRange } from "@/lib/recurrence";
import { addTask, completeTask, moveTask, removeTask, reopenTask } from "@/lib/taskActions";
import { useCalendarStore } from "@/stores/calendarStore";
import { useCourseStore } from "@/stores/courseStore";
import { usePlanStore } from "@/stores/planStore";
import { useQuestStore } from "@/stores/questStore";
import { useQuranStore } from "@/stores/quranStore";
import { useWorldStore } from "@/stores/worldStore";

const SAT = "2026-11-07";
const at = (day: string, h = 10) => new Date(`${day}T${String(h).padStart(2, "0")}:00:00`);

/** Auto-answers confirmation dialogs; records what was asked. */
const asked: string[] = [];
let answer: string | null = "ok";
useWorldStore.subscribe((s) => {
  if (s.dialog) {
    asked.push(s.dialog.title);
    queueMicrotask(() => useWorldStore.getState().closeDialog(answer));
  }
});

function reset() {
  asked.length = 0;
  answer = "ok";
  useQuestStore.setState({ quests: [], seeded: false });
  usePlanStore.setState({ journeyStart: "", plans: {}, changes: [], records: {}, milestones: [] });
  useQuranStore.setState({ monthlyTarget: 4, sessions: [], exams: [] });
  useCalendarStore.setState({ events: [] });
}

describe("week lifecycle", () => {
  beforeEach(reset);

  it("seeds the first week with sample tasks and Core Goal tasks", () => {
    syncWeeks(at(SAT));
    const plan = usePlanStore.getState().plans[SAT];
    assert.equal(plan.status, "planning");
    assert.deepEqual(plan.requirements.map((r) => r.title), ["English", "Technical"]);
    const quests = useQuestStore.getState().quests;
    assert.equal(quests.filter((q) => q.kind === "core").length, 4);
    // 2+2 (english core) + 2+3 (tech core) + 2 (listening) + 3 (react); Quran excluded
    assert.equal(weekTarget(quests, SAT), 14);
  });

  it("auto-confirms after the week's first day and keeps the target stable", () => {
    syncWeeks(at(SAT));
    syncWeeks(at(addDays(SAT, 1)));
    const plan = usePlanStore.getState().plans[SAT];
    assert.equal(plan.status, "active");
    assert.equal(plan.confirmedTarget, 14);
    assert.equal(usePlanStore.getState().changes.at(-1)?.kind, "auto-confirm");
  });

  it("scenarios 10–11: moving a task between days of a confirmed week needs no confirmation and keeps the score", async () => {
    syncWeeks(at(SAT));
    confirmPlan(SAT);
    const t = useQuestStore.getState().quests.find((q) => q.id === "q-react-architecture")!;
    completeTask(t.id);
    const before = computeWeekProgress(useQuestStore.getState().quests, SAT, usePlanStore.getState().plans[SAT]);
    await moveTask(t.id, addDays(SAT, 4));
    await moveTask(t.id, null);
    const after = computeWeekProgress(useQuestStore.getState().quests, SAT, usePlanStore.getState().plans[SAT]);
    assert.equal(asked.length, 0);
    assert.equal(after.target, before.target);
    assert.equal(after.countedUnits, before.countedUnits);
  });

  it("asks before a confirmed target changes, logs it, and respects cancel", async () => {
    syncWeeks(at(SAT));
    confirmPlan(SAT);
    answer = null; // cancel
    assert.equal(await removeTask("q-react-architecture"), false);
    assert.equal(weekTarget(useQuestStore.getState().quests, SAT), 14);
    answer = "ok";
    assert.equal(await removeTask("q-react-architecture"), true);
    assert.equal(weekTarget(useQuestStore.getState().quests, SAT), 11);
    const log = usePlanStore.getState().changes.at(-1)!;
    assert.deepEqual([log.kind, log.targetBefore, log.targetAfter], ["remove", 14, 11]);
  });

  it("new tasks in a confirmed week can be additional work without moving the denominator", async () => {
    syncWeeks(at(SAT));
    confirmPlan(SAT);
    answer = "extra";
    const extra = await addTask({ title: "Bonus reading", locationId: "castle", durationMin: 20, slot: "evening", weekKey: SAT, date: SAT, effort: "M", kind: "supporting" });
    assert.equal(extra?.planStatus, "extra");
    assert.equal(weekTarget(useQuestStore.getState().quests, SAT), 14);
    answer = "plan";
    await addTask({ title: "Planned extra", locationId: "workshop", durationMin: 20, slot: "evening", weekKey: SAT, date: SAT, effort: "S", kind: "supporting" });
    assert.equal(weekTarget(useQuestStore.getState().quests, SAT), 15);
  });

  it("scenarios 1–9 end to end: closes the week, records the result and advances the level only when unlocked", () => {
    syncWeeks(at(SAT));
    const ids = useQuestStore.getState().quests.filter((q) => q.category !== "quran").map((q) => q.id);
    ids.forEach((id) => completeTask(id)); // 14/14, all core goals
    reopenTask("q-react-architecture"); // 11/14 = 78.6%
    syncWeeks(at(addDays(SAT, 7)));
    const rec = usePlanStore.getState().records[SAT];
    assert.equal(rec.score, 78.6);
    assert.equal(rec.unlocked, true);
    assert.equal(levelAt(addDays(SAT, 7)), 2);
    assert.equal(usePlanStore.getState().milestones.filter((m) => m.type === "level-unlocked").length, 1);

    // Week 2: score fine but Technical core goal left open → stays on Level 2
    const w2 = addDays(SAT, 7);
    useQuestStore.getState().quests.filter((q) => q.weekKey === w2 && q.coreGoalId !== "goal-tech").forEach((q) => completeTask(q.id));
    syncWeeks(at(addDays(SAT, 14)));
    assert.equal(usePlanStore.getState().records[w2].unlocked, false);
    assert.equal(levelAt(addDays(SAT, 14)), 2);
  });

  it("weeks the user was away are closed neutrally", () => {
    syncWeeks(at(SAT));
    syncWeeks(at(addDays(SAT, 21)));
    const records = usePlanStore.getState().records;
    assert.equal(Object.keys(records).length, 3);
    assert.ok(Object.values(records).every((r) => r.unlocked === false));
  });
});

describe("courses (scenarios 14–20)", () => {
  beforeEach(reset);

  it("manages an 8-lesson level, keeps homework separate from attendance and preserves history", async () => {
    syncWeeks(at(SAT));
    const cs = useCourseStore.getState();
    const level = cs.startLevel("course-english", "B1");
    let lessons = useCourseStore.getState().lessons.filter((l) => l.levelId === level.id);
    assert.equal(lessons.length, 8);

    cs.scheduleLesson(lessons[0].id, addDays(SAT, 2), "18:00");
    const hw = await addTask({ title: "Vocabulary homework", locationId: "castle", durationMin: 30, slot: "evening", weekKey: SAT, date: addDays(SAT, 3), effort: "S", kind: "supporting", lessonId: lessons[0].id });
    completeTask(hw!.id);
    const l1 = useCourseStore.getState().lessons.find((l) => l.id === lessons[0].id)!;
    assert.equal(l1.attended, false, "homework does not mark attendance");
    assert.equal(l1.status, "scheduled");

    cs.setLessonStatus(l1.id, "attended");
    assert.equal(useQuestStore.getState().quests.find((q) => q.lessonId === l1.id)!.status, "done");
    const hw2 = await addTask({ title: "Speaking practice", locationId: "castle", durationMin: 15, slot: "evening", weekKey: SAT, date: null, effort: "S", kind: "supporting", lessonId: l1.id });
    assert.equal(useQuestStore.getState().quests.find((q) => q.id === hw2!.id)!.status, "todo", "attendance does not complete homework");

    cs.scheduleLesson(lessons[1].id, addDays(SAT, 4), "18:00");
    cs.scheduleLesson(lessons[1].id, addDays(SAT, 6), "19:00");
    const l2 = useCourseStore.getState().lessons.find((l) => l.id === lessons[1].id)!;
    assert.equal(l2.status, "rescheduled");
    assert.deepEqual(l2.rescheduledFrom, [addDays(SAT, 4)]);

    lessons = useCourseStore.getState().lessons.filter((l) => l.levelId === level.id);
    lessons.forEach((l) => cs.setLessonStatus(l.id, "completed"));
    const done = useCourseStore.getState().levels.find((l) => l.id === level.id)!;
    assert.equal(done.status, "completed");
    assert.ok(done.summary?.includes("8 lessons"));
    assert.ok(usePlanStore.getState().milestones.some((m) => m.type === "course-level-completed" && m.refId === level.id));
    assert.equal(levelAt(addDays(SAT, 7)), 1, "a course level never unlocks an Everlands level by itself");

    const next = cs.startLevel("course-english", "B2");
    const levels = useCourseStore.getState().levels;
    assert.ok(levels.some((l) => l.id === level.id && l.status === "completed"));
    assert.ok(levels.some((l) => l.id === next.id && l.status === "active"));
  });
});

describe("quran (scenarios 21–25)", () => {
  beforeEach(reset);

  it("tracks sessions and exams independently of the Weekly Score", async () => {
    syncWeeks(at(SAT));
    const qs = useQuranStore.getState();
    assert.equal(qs.monthlyTarget, 4);
    const before = computeWeekProgress(useQuestStore.getState().quests, SAT, usePlanStore.getState().plans[SAT]);

    const s = qs.addSession({ date: SAT, time: null, surah: "Al-Mulk", fromAyah: 1, toAyah: 15, fromPage: null, toPage: null, activity: "revision", status: "planned", notes: "", result: null, nextRevisionDate: null, examId: null });
    useQuranStore.getState().updateSession(s.id, { status: "completed", result: "good", nextRevisionDate: addDays(SAT, 7) });
    const exam = qs.addExam({ title: "Juz 29 exam", date: addDays(SAT, 12), time: null, ranges: "Al-Mulk – Al-Mursalat", requiredRounds: 3, roundsCompleted: 0, notes: "", result: "", status: "upcoming" });
    const prep = await addTask({ title: "Revise Al-Mulk", locationId: "gardens", category: "quran", durationMin: 30, slot: "morning", weekKey: SAT, date: SAT, effort: "M", kind: "supporting", quranExamId: exam.id });
    completeTask(prep!.id);
    useQuranStore.getState().updateExam(exam.id, { roundsCompleted: 1 });

    const after = computeWeekProgress(useQuestStore.getState().quests, SAT, usePlanStore.getState().plans[SAT]);
    assert.equal(after.target, before.target);
    assert.equal(after.countedUnits, before.countedUnits);
    assert.equal(asked.length, 0, "Quran tasks never ask about the weekly target");
    assert.equal(usePlanStore.getState().milestones.length, 0, "Quran progress never creates rewards");
  });
});

describe("calendar (scenarios 26–30)", () => {
  beforeEach(reset);

  it("handles all-day exams, timed appointments, recurrence and exam preparation tasks", async () => {
    syncWeeks(at(SAT));
    const cal = useCalendarStore.getState();
    const base = { location: "", description: "", reminderMinutes: null, color: "", courseLevelId: null, lessonId: null, recurrence: null, exam: null };
    const exam = cal.addEvent({ ...base, title: "Database Final Exam", type: "exam", date: "2026-11-20", allDay: true, startTime: null, endTime: null, exam: { subject: "Databases", notes: "", status: "upcoming", result: "" } });
    cal.addEvent({ ...base, title: "Dentist", type: "appointment", date: "2026-11-10", allDay: false, startTime: "16:30", endTime: "17:00" });
    const weekly = cal.addEvent({ ...base, title: "English class", type: "class", date: "2026-11-09", allDay: false, startTime: "18:00", endTime: "19:30", recurrence: { freq: "weekly", interval: 1, until: "2026-12-31" } });

    assert.deepEqual(occurrencesInRange(weekly, "2026-11-01", "2026-11-30"), ["2026-11-09", "2026-11-16", "2026-11-23", "2026-11-30"]);

    const wk = weekKeyOf("2026-11-15", 6);
    for (const title of ["Revise Chapter 1", "Revise Chapter 2", "Solve practice questions"]) {
      await addTask({ title, locationId: "workshop", durationMin: 60, slot: "evening", weekKey: wk, date: "2026-11-15", effort: "M", kind: "supporting", eventId: exam.id });
    }
    const prep = useQuestStore.getState().quests.filter((q) => q.eventId === exam.id);
    assert.equal(prep.length, 3);
    completeTask(prep[0].id);
    assert.equal(useCalendarStore.getState().events.find((e) => e.id === exam.id)!.exam!.status, "upcoming", "prep never completes the exam");

    const s = { events: useCalendarStore.getState().events, lessons: [], levels: [], sessions: [], quranExams: [], tasks: useQuestStore.getState().quests };
    const feed = buildFeed(s, "2026-11-01", "2026-11-30");
    assert.equal(feed.filter((e) => e.refId === exam.id).length, 1, "no duplicate event rows");
    assert.equal(feed.filter((e) => e.kind === "task" && e.date === "2026-11-15").length, 3);
    const day = feed.filter((e) => e.date === "2026-11-10");
    assert.equal(day[0].startTime, "16:30");
    const nov20 = feed.filter((e) => e.date === "2026-11-20");
    assert.equal(nov20[0].allDay, true);
  });
});

describe("planning grace period", () => {
  beforeEach(reset);
  it("a plan first created mid-week stays open for planning that whole day", () => {
    const tue = addDays(SAT, 3);
    syncWeeks(at(tue, 9));
    syncWeeks(at(tue, 22));
    assert.equal(usePlanStore.getState().plans[SAT].status, "planning");
    syncWeeks(at(addDays(tue, 1), 8));
    assert.equal(usePlanStore.getState().plans[SAT].status, "active");
  });
});
