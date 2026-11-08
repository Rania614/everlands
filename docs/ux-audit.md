# Everlands — UX Audit (before the simplification milestone)

Audited on the Phase 02 build by walking through each workflow in the browser (desktop 1440×900 and mobile 390×844) and counting the controls on screen and the interactions needed with sensible defaults. "Interactions" = clicks/taps/Enter presses plus fields that must be typed or changed. Screenshots: `docs/screenshots/before-*.jpg` and `after-*.jpg`.

## The five most complicated workflows

| # | Workflow | Before: interactions | Before: visible controls | Main problems |
|---|----------|---------------------|--------------------------|---------------|
| 1 | Add an exam with 3 preparation tasks | ~20–23 | event form 12 + 9 colour swatches; task form 9 per prep task | Exam must be created in the generic event form (type picked from a 10-item select, "All-day" must be toggled manually), then **re-opened** from the calendar; each prep task opens the full task form **on top of** the event dialog (modal-on-modal); in a confirmed week a third dialog ("add to plan or extra?") can appear |
| 2 | Schedule a lesson, mark attendance, add homework (from World) | ~11 + 4 navigation clicks | lesson detail shows 9 sections at once (title, description, schedule, status, homework, content, resources, notes, rating) | Course is 4 screens deep (select castle → enter → course card → lesson); homework opens the full task form; scheduling needs a separate "Schedule" button |
| 3 | Record a Quran session | 7 + 3 navigation clicks | 13 fields (date, time, surah, 2 ayah, 2 page, activity, status, result, next revision, exam, notes) | Reachable only via Sacred Gardens → Enter → card; recording a session already done needs changing *Status* from "Planned"; assessment/notes/revision fields shown up-front |
| 4 | Add a simple task | 3 (+1 dialog in a confirmed week) | 9 controls + 2 explanatory lines | Effort (4 options), role in the plan (4 options, with jargon), time of day, duration and notes are all visible; in a confirmed week a second dialog interrupts every add |
| 5 | Create a simple calendar event | 5 | 12 + 9 colour swatches | Default is a timed 09:00–10:00 event, so a date-only event needs the All-day toggle; location, reminder, recurrence, colours, description, exam fieldset all visible |

Runners-up: **Weekly planner** (5 stat tiles + bar + 2 explanation paragraphs before the board; adding a task opens the full form) and **Core Goals** in Settings (every goal fully expanded: name, toggle, condition, each requirement with an effort select, minimum).

## Forms with too many visible fields
- `TaskFormModal` — 9 controls; role/effort/time-of-day/duration rarely change.
- `EventEditor` — 12 controls + 9 swatches + course/lesson + exam fieldset.
- Quran `SessionModal` — 13 fields.
- Quran `ExamModal` — 8 fields.
- `LessonDetail` — 9 sections, all expanded.
- `CoreGoalsEditor` — ~10 inputs per goal.

## Repeated information
- The weekly score/units/Core Goals block is rendered in 5 places (HUD, quest panel, planner header, Tasks sidebar, Central Haven) — acceptable as a glanceable summary, but the planner header repeats it in its longest form (5 tiles + 2 paragraphs).
- Explanatory sentences repeated in every form ("Counts as 2 work units…", "Part of the weekly target.", "Events are real commitments…").

## Unnecessary navigation steps
- Course and Quran spaces need 3–4 clicks from World; neither is reachable from the location preview.
- Exams: create → close → find in calendar → reopen to add preparation.
- Every "add" opens a full-screen-ish dialog; adding several homework/prep tasks repeats the whole form each time.

## Actions that should be inline edits or quick actions
- Task date, size and status (currently only via the edit dialog; status "Start" is a separate button).
- Planner "Add" per day column (opens the full form).
- Lesson schedule, attendance and homework (quick actions on the lesson row).
- Exam preparation and lesson homework: one-line inline add.
- "Add to plan vs additional work": an inline choice inside the form instead of a second dialog.
- Moving tasks in the planner: a select per row only (no drag & drop).

## Plan
1. One **Quick Add** sheet (Task · Event · Exam · Quran) opened from a global "+ Add" button, the `N` key, and contextually (calendar day, lesson, exam, location) with known context pre-filled and never asked again.
2. **Progressive disclosure** everywhere: Level 1 essentials, Level 2 "More details" collapsed, Level 3 stays in Settings.
3. **Edit in a side drawer** (bottom sheet on mobile) instead of stacked dialogs; inline confirmations replace nested confirmation dialogs.
4. **Inline editing** of task date, size and status; inline one-line adds for homework, exam prep and planner days; planner drag & drop.
5. Course/Quran shortcuts from the location preview; lesson rows with quick actions; lesson detail in tabs.

## Results (after this milestone)

Measured the same way, on the same data, in the browser (acceptance script results below).

| # | Workflow | Interactions before → after | Visible controls before → after | What changed |
|---|----------|-----------------------------|---------------------------------|--------------|
| 1 | Exam + 3 preparation tasks | ~20–23 → **9** | 12 + 9 swatches, then 9 per task → **3 fields**, then 3 one-tap suggestions | Quick Add **Exam** (title, subject, date) saves immediately; the same sheet then offers preparation tasks as one-tap suggestions or a one-line add. No reopening, no stacked dialogs (verified: 0 dialogs left open) |
| 2 | Schedule lesson + attendance + homework (from World) | ~15 → **8** | 9 sections → **3 controls rows** (schedule · attendance · homework) | "Open English course" directly from the castle preview; lessons are an accordion with quick actions; homework is a one-line add with suggestions; content/resources/notes/rating moved to a second tab |
| 3 | Record a Quran session | ~10 → **4** | 13 fields → **3 + "Done"** | Available from Quick Add anywhere; one "Surah or range" field understands `Al-Mulk 1-15` and `p562-564`; today/past sessions default to *Done*; assessment, next revision and notes under More details |
| 4 | Add a simple task | 3–4 → **3** (N · title · Enter) | 9 + 2 lines → **4** | Area, When (Today / Tomorrow / This week / Pick), Effort; the "plan or additional work?" question became an inline choice shown only in confirmed weeks (no second dialog) |
| 5 | Simple calendar event | 5 → **3** | 12 + 9 swatches → **4 + type chips** | No time = all-day automatically (no toggle); date defaults to the selected day; location, reminder, repeat, colour, notes, lesson link under More details |

Also simplified: **Weekly planner** (one summary line, Core Goals chips and the bar first; numbers and change log folded; per-day "Add" opens Quick Add pre-dated; drag & drop between days), **Core Goals** (one row each: on/off and a −/+ minimum; requirements folded; one-tap presets), **task cards** (checkbox + title + inline status/day/effort chips instead of four buttons), **editing** (side drawer on desktop / bottom sheet on phones; inline confirmations replace confirmation dialogs).

Nothing was removed: every field from the old forms is still available under "More details" or in the editor drawer.
