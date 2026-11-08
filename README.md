# Everlands: Phase 01 prototype

*Your World of Growth & Discovery.* This prototype is a cozy isometric 3D island. You move between locations with a baby dragon companion and manage daily quests from the same screen.

## Run locally

Requires **Node.js 20.9+** (Next.js 16).

```bash
npm install
npm run dev          # http://localhost:3000
```

Checks:

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run build        # production build
npm test             # progression, course, Quran, calendar and Quick Add tests (node:test via tsx)
npm run check        # all four
```

## Controls

- **Drag**: pan. **Scroll or pinch**: zoom. Rotation is locked so the isometric view stays put.
- **Click a building, its marker or its name tag** to select it. The camera moves in, a preview opens and the dragon heads there.
- **Enter Location** opens that location's productivity view. **Esc** or **World** brings you back.
- **N** (or the **+ Add** button) opens Quick Add: a task, an event, an exam or a Quran session.
- **1–6** switch views (World, Planner, Calendar, Tasks, Progress, Settings).
- **Click the dragon** to make it hop, or to wake it after it falls asleep.

## Implemented features

- **3D world (React Three Fiber, procedural geometry only).** There is one main floating island with organic edges and a rocky underside. It holds:
  - the **Central Haven**: a plaza, the Everspring fountain and a floating crystal landmark
  - the **Knowledge Castle** on a raised terrace reached by a stone staircase: blue roofs, books and a floating open book
  - the **Inventor's Workshop**: a timber cabin, turning gears, a roof propeller and a smoking chimney
  - the **Sacred Gardens** on its own islet across an arched wooden bridge: a pavilion with arches, a dome, a reflecting pool and lanterns

  Around them are a stream with a waterfall off the island edge, instanced trees, flowers, bushes, rocks and stone paths, plus drifting clouds and light motes. **Skyreach Isle** is a second island linked by floating stepping stones; it is visible but marked "coming soon".
- **Camera**: orthographic and isometric. It pans and zooms within clamped bounds and eases smoothly to a selected location. Any user drag cancels the move. Recenter is in the location bar and in Settings. Framing accounts for the side panels on desktop and the preview card on mobile.
- **Dragon companion**: an original procedural model with a sage body, cream belly, oversized head, big eyes, tiny horns, small wings and a short tail. It has six states:
  - **idle**: breathing, blinking and tail sway
  - **walk**: a leg cycle
  - **fly**: flapping wings along an arc
  - **celebrate**: a hop and spin with sparkles
  - **sleep**: after about 28 s of idle
  - **explore**: looking around a location and occasionally wandering

  It walks predefined paths to nearby places, up to and including the bridge to the gardens. It flies to elevated or far places.
- **Location interaction**: a hover or selection highlight ring, floating markers, and name tags that are keyboard-focusable buttons. The preview card shows a thumbnail, description, activities, an activity count, progress and an Enter button.
- **Productivity UI**:
  - **Top bar**: logo, date, week and level, Weekly Score, Core Goals summary, unlock status and settings.
  - **Today's Quests panel**: collapsible. Shows the weekly summary, today's tasks and open "any day this week" tasks.
  - **Completing a quest** updates its status, the daily progress and the overall ring. It also triggers the dragon's celebration and a toast you can dismiss. Undo is always available.
  - **Location view**: that location's activities, a focus timer and its quests, plus an add-quest form.
  - **Planner**: morning, afternoon and evening, with quests that can be moved between them.
  - **Tasks**: status and location filters, add and delete.
  - **Progress**: see Phase 02.
  - **Settings**: motion, graphics quality, first day of the week, additional-work limit, Core Goals editor, labels, dragon name and recenter.
- **Progression, learning and calendar**: see "Phase 02" below.
- **State**: Zustand stores (world, quests, plan, courses, Quran, calendar), each saved to `localStorage` and migrated automatically from older saves.
- **Accessibility, performance and resilience**:
  - The 3D chunk is lazy-loaded on the client and shows a loader.
  - Rendering pauses (`frameloop="never"`) while a productivity view is open.
  - Per-frame animation runs on refs and store subscriptions, never React re-renders.
  - Repeated decorations are instanced and materials are shared.
  - There is one shadow-casting light.
  - "Auto" quality turns off shadows and some decorations on phones and low-core devices.
  - Reduced motion is respected, from the OS setting or the in-app override.
  - An error boundary and a static SVG map fallback cover devices without WebGL.
  - Fonts are self-hosted (`@fontsource`), with no Google Fonts request at build time.
- **Responsive**: on desktop, a left rail, a right quest panel and a bottom location bar. On mobile, a bottom navigation bar, a collapsible quest sheet and a bottom preview card.


## Phase 02: Progression, learning management and calendar

### 1. Progression logic

There are three separate systems, which are never mixed into one score, plus a fourth for world growth:

| System | What it measures | Where it lives |
| --- | --- | --- |
| Weekly Levels | Planned weekly workload and Core Goals | `lib/progression.ts`, `lib/lifecycle.ts`, `stores/planStore.ts` |
| Core Goals | Minimum weekly commitments per growth area | `planStore.coreGoals`, snapshotted into each week's plan |
| Quran Journey | Monthly sessions, revisions, exams | `stores/quranStore.ts` (nothing here feeds the other systems) |
| World milestones | Permanent, append-only progress events for future world growth | `planStore.milestones` |

One week is one Everlands Level. The week count always advances. The level number only advances after a week that unlocked: **Level = 1 + number of earlier weeks that unlocked.** There are no daily pass/fail rules, no XP, no streaks and no day points.

### 2. Weekly Score formula

```
Weekly Target  = Σ effortUnits of the week's eligible PLANNED tasks (core + supporting)
Planned Done   = Σ effortUnits of those planned tasks that are completed
Extra Counted  = min( Σ effortUnits of completed eligible additional tasks , ⌊Target × limit%⌋ )
Weekly Score   = (Planned Done + Extra Counted) / Weekly Target × 100
```

- **Effort**: Small = 1, Medium = 2, Large = 3, Custom = 1–8 units.
- **Eligible** means not a Quran task.
- **Additional work** is optional and stretch tasks, plus tasks added to an already-confirmed week as "additional". It counts only up to the limit, 25% of the target by default (adjustable from 0 to 50% in Settings). This is what can take the score above 100%, and it stops trivial tasks from inflating it.
- **Moving a task:** a task belongs to a week (`weekKey`); its day (`date`) is optional. Moving it between days never changes its contribution. Moving it to another week is a plan change and is confirmed first.
- **Plan lifecycle**: planning → active → closed.
  - **Planning:** the target follows your plan. This lasts until you confirm it, or automatically at the end of the first day (the week's first day, or the day the plan was created if that's later).
  - **Active:** the target is frozen. Any change that would alter it (deleting, re-sizing, re-typing or moving a planned task to another week) first shows "target A → B". It only applies after you confirm, and goes into the plan's change log. New tasks in an active week ask: "add to plan" or "count as additional work".
  - **Closed:** a finished week is frozen into a `WeeklyProgressRecord`.

### 3. Core Goals and unlocking

**The next level unlocks only when Weekly Score > 75% (strictly) AND every Core Goal of the week is achieved.**

- A Core Goal has:
  - a growth area
  - a written completion condition
  - requirement templates, each of which becomes a task every week
  - a minimum number of linked tasks to complete
  - an active/off switch
- English and Technical are active by default. Personal Growth is available but off. All of them are editable in Settings, and new ones can be added. Quran can never be a Core Goal.
- **Snapshots:** when a week's plan is created, the active goals are copied into it (`WeeklyGoalRequirement`), so edits only affect later weeks. Next week's requirements are visible in the Planner before that week begins.
- **Explanations:** the unlock state is explained in neutral words. For example: "Not unlocked yet: 3 more units to pass 75%; still open: Technical."

### 4. Courses and lessons

- **Course levels:** a Course (e.g. "English Course") has Course Levels (e.g. "A2"), each with 8 lessons by default (any count is supported). This is a separate concept from the Everlands Level.
- **Lesson fields:** number, title, description, date, time and status (Upcoming, Scheduled, Attended, Missed, Completed, Rescheduled). Each lesson also has a separate attendance flag, content, resources, notes, an optional 1–5 understanding rating, and its reschedule history.
- **Homework:** tasks keep a `lessonId`. Completing homework never marks attendance, and marking attendance never completes homework.
- **Weekly Score:** homework counts toward the Weekly Score like any other planned task.
- **Finishing a level:** when every lesson is Completed, the course level is marked completed with a summary. You can then start the next level; previous levels stay in the history tabs. This records a permanent `course-level-completed` milestone, but it never unlocks an Everlands Level by itself.
- **Calendar:** scheduled lessons appear in the Calendar automatically. They are derived entries, not copies.

### 5. Independent Quran tracking

- **Monthly plan:** an editable target of 4 sessions per month by default.
- **Sessions:** date, optional time, Surah, ayah range and/or page range, and activity (memorization, revision, tathbit (تثبيت), exam preparation, assessment). Each also has a status, notes, a revision result, a next revision date and an optional exam link.
- **Quran exams:** date, optional time, ranges, required revision rounds with a round counter, preparation tasks (tasks with `quranExamId`, shown in the Planner and Calendar), notes and result.
- **Kept separate from everything else**, and verified by tests:
  - Quran tasks never enter any score sum.
  - They never ask about the weekly target.
  - They never create milestones.
  - Completing one shows a quiet note: no celebration and no dragon cheer.
  - Nothing is ever marked as missed.

### 6. Calendar

- **Navigation:** the Calendar is back as a main navigation item (shortcut 3).
- **Views:** Month, Week, Day and Upcoming (next 60 days).
- **Events and tasks are separate entities.**
  - Events have:
    - type, date and all-day flag (or start/end time)
    - location and description
    - reminder, color and recurrence (daily, weekly or monthly, with an interval and an optional end date)
    - a related course level or lesson
  - Tasks can point to an event (`eventId`).
- **Exams** are events of type *exam* with a dedicated section: subject, status, notes, result, a countdown, and preparation tasks with a progress bar. Completing preparation never marks the exam as taken.
- **One record per item:** the calendar view is built from events, lessons, Quran sessions, Quran exams and dated tasks, without duplicating any record. Recurring events are expanded on the fly.
- **Upcoming card on World Home:** next English lesson or class, next Quran session, nearest exam, next deadline, days remaining, and a shortcut to the Calendar.
- **Reminders** appear inside Everlands while it is open.

### 7. Data model (all serialisable, ready for Supabase/PostgreSQL)

| Entity | Type location |
| --- | --- |
| GrowthArea, CoreGoal, WeeklyGoalRequirement, WeeklyPlan, PlanChange, WeeklyProgressRecord, WorldMilestone | `types/plan.ts` |
| Task (`Quest`) with effort, kind, planStatus, weekKey, date, coreGoalId, lessonId, eventId, quranExamId | `types/quest.ts` |
| Course, CourseLevel, Lesson, QuranSession, QuranExam | `types/learning.ts` |
| CalendarEvent (including exam details), CalendarEntry (derived) | `types/calendar.ts` |

- **Dates:** stored as local day keys (`YYYY-MM-DD`) with optional `HH:mm` times. Day maths uses calendar days, so it is DST-safe, and week boundaries follow the configured first day of the week.
- **Changing the first day of the week:** open weeks are regrouped and closed weeks are untouched.

### 8. Tests (`npm test`)

`tests/progression.test.ts` and `tests/stores.test.ts` cover the acceptance scenarios:

| Scenarios | Covered |
| --- | --- |
| 1–5 | 50% on one day, more on another, unlocked |
| 6–7 | 90% with a Core Goal open: stays locked, with explanation |
| 8–9 | All goals met at 70%: stays locked |
| Strict threshold | Exactly 75% stays locked |
| 10–11 | Moving tasks between days, including on a confirmed plan |
| 12–13 | Undo recalculates |
| Additional work | The limit is enforced |
| Confirmed plan | Changes are confirmed, logged and can be cancelled |
| Week close and history | Weeks close into records; the level advances only on unlock |
| Absences | Absent weeks close neutrally |
| 14–20 | Course scenarios, including keeping history |
| 21–25 | Quran scenarios, including no effect on the score |
| 26–30 | Calendar scenarios: all-day exam, timed appointment, weekly recurrence, prep tasks, no duplicate rows |
| Dates | DST and year-end handling |

Scenarios 31–32 (persistence after refresh; desktop and mobile layouts) were checked in a browser.

### 9. Remaining limitations

- **Reminders** only show while the app is open. There are no OS or push notifications yet.
- **Recurring events** are edited as a whole series; single-occurrence exceptions aren't supported yet.
- **Week view** lists items per day rather than drawing an hourly grid.
- **One course:** only the English course is created by default. The model supports more, but there's no "add course" screen yet.
- **Changing the week start** puts the current week back into planning, so its target needs confirming again.
- **World milestones** are recorded but not yet shown as 3D changes. That's the next milestone.
- **Storage:** all data is stored in the browser's `localStorage`, so clearing site data or switching browsers loses it until Supabase is added.

## UX simplification milestone

See `docs/ux-audit.md` for the audit, the measured before/after numbers and screenshots in `docs/screenshots/`.

- **Quick Add** (`components/quickadd/`): one sheet for Task · Event · Exam · Quran, opened from **+ Add**, the **N** key, or in context (calendar day, planner day, lesson, exam, location). Known context is applied and never asked again. Drafts survive an accidental close.
- **Progressive disclosure**: Level 1 essentials, Level 2 under **More details**, Level 3 in Settings.
- **Editing in a drawer** (`components/editors/EditorHost.tsx`): side panel on desktop, bottom sheet on phones. One sheet at a time; related tasks are added inline; confirmations are inline (e.g. "Save · target 14 → 16"), so dialogs never stack.
- **Inline editing**: task status, day and effort chips; checklist (subtasks) on any task; planner drag & drop.
- **Exams**: save with title, subject and date, then add preparation tasks with one tap.
- **Lessons**: accordion with schedule, attendance and homework quick actions; notes and resources in a second tab.
- **Quran**: one "Surah or range" field (`Al-Mulk 1-15`, `p562-564`), "Done" by default for today.
- **Core Goals**: compact rows with presets; requirements folded.

## Project structure

```
src/
  app/            layout.tsx, page.tsx, globals.css (palette tokens), icon.svg
  components/
    layout/       AppShell, TopHUD, QuickNavigation, Toast
    world/        WorldCanvas, WorldScene, WorldCamera, LocationHotspot, LocationPreview,
                  LocationDock, FloatingIsland, Decorations, Water, Connections, Atmosphere,
                  WorldFallback, WorldLoaderStatic, geometry.ts, materials.ts
    dragon/       DragonCompanion (R3F glue), DragonModel (rig), DragonAnimations (poses),
                  DragonController (state machine + navigation, plain TS)
    locations/    CentralHaven, KnowledgeCastle, SacredGardens, InventorWorkshop
    quickadd/     QuickAddHost, QuickTaskForm, QuickEventForm, QuickExamForm, QuranForms, fields
    editors/      EditorHost (task, event/exam, Quran session, Quran exam drawers)
    quests/       QuestPanel, QuestCard, TaskRow (inline meta), InlineTaskAdd, WeeklySummary, FocusTimer
    planner/      WeeklyPlanner, TaskList
    calendar/     CalendarView, ExamPrep
    views/        ViewFrame, LocationView, ProgressView, SettingsView, CoreGoalsEditor, CourseView, QuranView
    ui/           Button, Panel, ProgressBar(+Ring), Modal (dialog/sheet/drawer + DialogHost), ChipGroup, Disclosure, Field, LocationThumbnail, icons
  data/           locations.ts, quests.ts, growthAreas.ts (areas + default Core Goals)
  stores/         worldStore, questStore, planStore, courseStore, quranStore, calendarStore
  hooks/          useWorldNavigation, useEnvironment, useWeek, useCalendarFeed
  types/          world.ts, quest.ts, plan.ts, learning.ts, calendar.ts
  lib/            constants, utils, dates, progression, lifecycle, taskActions, calendarFeed, recurrence, quickAdd
tests/            progression.test.ts, stores.test.ts, quickAdd.test.ts
```

**Replacing the dragon with a GLB model.** `DragonAnimations` and `DragonController` only talk to the `DragonRig` interface (bob, body, head, eyes, wings, tail, legs). To use a professionally modelled GLB, load it in a new model component and map its bones to that interface. The behaviour code stays as it is.

**Supabase readiness.** `Quest` is a flat record that can be serialised directly. All mutations go through store actions, which are the place to add API calls.

## Dependencies added

| Package | Purpose |
| --- | --- |
| three, @react-three/fiber, @react-three/drei | 3D rendering, camera controls, instancing, HTML labels |
| zustand | App and world state with persistence |
| framer-motion | Short UI transitions (reduced-motion aware) |
| lucide-react | Icons |
| @fontsource-variable/fredoka, @fontsource-variable/nunito | Self-hosted display and body fonts |
| @types/three (dev) | Types |
| tsx (dev) | Runs the TypeScript tests with Node's built-in test runner |

## Known limitations

- All art is procedural primitives. It reads well, but a modelled asset pass would lift quality, especially for the dragon.
- Navigation uses hand-placed waypoints, not a navmesh. The dragon routes through the Central Haven, and it flies whenever it is redirected mid-route.
- The waterfall uses a scrolling canvas texture, not a water shader. Clouds are sphere clusters.
- The focus timer pauses if the tab is closed.
- There is no audio.
- In-world name tags are DOM overlays. They can overlap at some zoom levels, and you can turn them off in Settings.
- Visual checks used headless Chrome with software WebGL. Check frame rate on real low-end phones.

## Recommended next milestone (after Phase 02)

**World Evolution:** turn `planStore.milestones` into permanent 3D growth. For example, a new castle wing per completed course level, workshop upgrades for finished projects, and Haven gardens for unlocked weeks. Quran stays excluded. After that, move to Supabase persistence and add OS notifications for reminders.

## Original Phase 01 recommendation

**Phase 02: the Knowledge Castle module, wired to a real backend.**

1. Add Supabase auth plus `quests`, `sessions` and `activities` tables, keeping Zustand as a cache.
2. Build the English module inside the castle: a listening-session log, a vocabulary list with spaced review and a speaking recorder.
3. Add history and gentle streaks to Progress.
4. Replace the procedural dragon with a rigged GLB through the `DragonRig` contract, and add a short interior scene for one location.
"# everlands" 
