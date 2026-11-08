"use client";

import { BookOpen, CalendarDays, Check, Trash2, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { GROWTH_AREAS } from "@/data/growthAreas";
import { DAY_SLOTS, DURATION_OPTIONS } from "@/data/quests";
import { useTodayKey } from "@/hooks/useWeek";
import { formatDay, weekKeyOf } from "@/lib/dates";
import { weekStartSetting } from "@/lib/lifecycle";
import { KIND_LABELS, MAX_CUSTOM_UNITS, unitsFor } from "@/lib/progression";
import { completeTask, previewRemove, previewUpdate, removeTask, reopenTask, updateTask } from "@/lib/taskActions";
import { cn, uid } from "@/lib/utils";
import { useCalendarStore } from "@/stores/calendarStore";
import { useCourseStore } from "@/stores/courseStore";
import { usePlanStore } from "@/stores/planStore";
import { useQuestStore } from "@/stores/questStore";
import { useQuranStore } from "@/stores/quranStore";
import { useWorldStore } from "@/stores/worldStore";
import type { CalendarEvent } from "@/types/calendar";
import type { DaySlot, EffortSize, Quest, QuestCategory, QuestStatus, TaskKind } from "@/types/quest";
import { ExamPrep } from "../calendar/ExamPrep";
import { AreaChips, ErrorText, FieldLabel, SizeChips, WhenPicker } from "../quickadd/fields";
import { EventDetails, EventEssentials, eventDraftFrom, eventFromDraft, validateEvent, type EventDraft } from "../quickadd/QuickEventForm";
import { quranDraftFrom, quranExamDraft, QuranExamForm, QuranSessionForm } from "../quickadd/QuranForms";
import { InlineTaskAdd } from "../quests/InlineTaskAdd";
import { TaskRow } from "../quests/TaskRow";
import { Button } from "../ui/Button";
import { ChipGroup } from "../ui/ChipGroup";
import { Disclosure } from "../ui/Disclosure";
import { inputClass } from "../ui/Field";
import { Modal } from "../ui/Modal";

/**
 * One editing drawer at a time (side panel on desktop, bottom sheet on
 * phones). The page stays visible behind it and nothing opens on top of it:
 * related tasks are added inline, confirmations are inline.
 */
export function EditorHost() {
  const editor = useWorldStore((s) => s.editor);
  const close = useWorldStore((s) => s.closeEditor);
  const today = useTodayKey();
  const quests = useQuestStore((s) => s.quests);
  const events = useCalendarStore((s) => s.events);
  const sessions = useQuranStore((s) => s.sessions);
  const exams = useQuranStore((s) => s.exams);

  const task = editor?.kind === "task" ? quests.find((q) => q.id === editor.id) : undefined;
  const event = editor?.kind === "event" ? events.find((e) => e.id === editor.id) : undefined;
  const session = editor?.kind === "quran-session" ? sessions.find((s) => s.id === editor.id) : undefined;
  const qexam = editor?.kind === "quran-exam" ? exams.find((x) => x.id === editor.id) : undefined;
  const open = !!today && !!(task || event || session || qexam);

  const title = task ? "Task" : event ? (event.type === "exam" ? "Exam" : "Event") : session ? "Quran session" : "Quran exam";

  return (
    <Modal open={open} onClose={close} title={title} variant="drawer">
      {today && task && <TaskEditor key={task.id} task={task} today={today} onDone={close} />}
      {today && event && <EventEditor key={event.id} event={event} today={today} initialTab={editor?.tab} onDone={close} />}
      {today && session && <SessionEditor key={session.id} id={session.id} today={today} onDone={close} />}
      {today && qexam && <QuranExamEditor key={qexam.id} id={qexam.id} today={today} onDone={close} />}
    </Modal>
  );
}

/* --------------------------------- Task --------------------------------- */

function TaskEditor({ task, today, onDone }: { task: Quest; today: string; onDone: () => void }) {
  const updateQuest = useQuestStore((s) => s.updateQuest);
  const goals = usePlanStore((s) => s.coreGoals);
  const plan = usePlanStore((s) => s.plans[task.weekKey]);
  const lesson = useCourseStore((s) => s.lessons.find((l) => l.id === task.lessonId));
  const linkedEvent = useCalendarStore((s) => s.events.find((e) => e.id === task.eventId));
  const openView = useWorldStore((s) => s.openView);
  const openEditor = useWorldStore((s) => s.openEditor);
  const [f, setF] = useState({
    title: task.title,
    area: task.category as QuestCategory,
    date: task.date,
    effort: task.effort as EffortSize,
    customUnits: task.effort === "custom" ? task.effortUnits : 4,
    kind: task.kind as TaskKind,
    coreGoalId: task.coreGoalId ?? "",
    slot: task.slot as DaySlot,
    durationMin: task.durationMin,
    description: task.description ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newSub, setNewSub] = useState("");
  const set = (p: Partial<typeof f>) => {
    setF({ ...f, ...p });
    if (error) setError(null);
  };

  const isQuran = f.area === "quran";
  const weekKey = f.date ? weekKeyOf(f.date, weekStartSetting()) : task.weekKey;
  const kind: TaskKind = isQuran ? "supporting" : f.kind;
  const patch: Partial<Quest> = {
    title: f.title.trim(),
    category: f.area,
    locationId: GROWTH_AREAS[f.area].locationId,
    date: f.date,
    weekKey,
    effort: f.effort,
    effortUnits: unitsFor(f.effort, f.customUnits),
    kind,
    coreGoalId: kind === "core" ? f.coreGoalId || null : task.kind === "core" ? null : (task.coreGoalId ?? null),
    slot: f.slot,
    durationMin: f.durationMin,
    description: f.description.trim() || undefined,
  };
  if (weekKey !== task.weekKey) {
    const destActive = usePlanStore.getState().plans[weekKey]?.status === "active";
    patch.planStatus = (kind === "core" || kind === "supporting") && !destActive ? "planned" : "extra";
  }
  const impact = previewUpdate(task.id, patch)[0];
  const removal = previewRemove(task.id)[0];
  const goalOptions = (plan?.requirements ?? goals.filter((g) => g.active).map((g) => ({ goalId: g.id, title: g.title, areaId: g.areaId }))).filter((g) => g.areaId === f.area);
  const subtasks = task.subtasks ?? [];

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!patch.title) {
      setError("A task needs a title.");
      return;
    }
    if (kind === "core" && !patch.coreGoalId) {
      setError("Pick the Core Goal this task fulfils.");
      return;
    }
    if (await updateTask(task.id, patch, { preconfirmed: true })) onDone();
  };

  const setStatus = (s: QuestStatus) => {
    if (s === "done") completeTask(task.id);
    else if (task.status === "done") {
      reopenTask(task.id);
      if (s === "in_progress") useQuestStore.getState().setStatus(task.id, "in_progress");
    } else useQuestStore.getState().setStatus(task.id, s);
  };

  return (
    <form onSubmit={save} className="space-y-3.5" noValidate>
      <div>
        <FieldLabel htmlFor="ed-task-title">Title</FieldLabel>
        <input id="ed-task-title" value={f.title} onChange={(e) => set({ title: e.target.value })} className={`${inputClass} h-11 text-base`} aria-invalid={!!error} aria-describedby={error ? "ed-task-error" : undefined} />
        {error && <ErrorText id="ed-task-error">{error}</ErrorText>}
      </div>
      <div>
        <FieldLabel>Status</FieldLabel>
        <ChipGroup
          label="Status"
          size="sm"
          value={task.status}
          onChange={setStatus}
          options={[
            { id: "todo", label: "Ready" },
            { id: "in_progress", label: "In progress" },
            { id: "done", label: "Done" },
          ]}
        />
      </div>
      <WhenPicker today={today} date={f.date} onChange={(date) => set({ date })} label={f.date ? "When" : `When · any day, week of ${formatDay(task.weekKey, { month: "short", day: "numeric" })}`} />
      {!isQuran && <SizeChips value={f.effort} onChange={(effort) => set({ effort })} />}

      <section aria-label="Checklist">
        <FieldLabel>Checklist (optional)</FieldLabel>
        <ul className="space-y-1">
          {subtasks.map((s) => (
            <li key={s.id} className="flex items-center gap-2 rounded-xl bg-white/80 px-2.5 py-1.5 text-sm">
              <input
                type="checkbox"
                checked={s.done}
                aria-label={s.title}
                onChange={() => updateQuest(task.id, { subtasks: subtasks.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)) })}
              />
              <span className={cn("flex-1", s.done && "text-ink-soft line-through")}>{s.title}</span>
              <button type="button" aria-label={`Remove ${s.title}`} onClick={() => updateQuest(task.id, { subtasks: subtasks.filter((x) => x.id !== s.id) })} className="text-ink-soft hover:text-ink">
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-1.5 flex gap-1.5">
          <input
            value={newSub}
            onChange={(e) => setNewSub(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (newSub.trim()) {
                  updateQuest(task.id, { subtasks: [...subtasks, { id: uid("sub"), title: newSub.trim(), done: false }] });
                  setNewSub("");
                }
              }
            }}
            placeholder="Add a step and press Enter"
            aria-label="Add a checklist step"
            className={`${inputClass} h-9 font-normal`}
          />
        </div>
      </section>

      {(lesson || linkedEvent) && (
        <div className="flex flex-wrap gap-1.5 text-xs font-bold">
          {lesson && (
            <button type="button" onClick={() => { onDone(); openView("course", { lessonId: lesson.id }); }} className="inline-flex items-center gap-1 rounded-full bg-sky/30 px-2.5 py-1 text-ink hover:bg-sky/50">
              <BookOpen className="h-3.5 w-3.5" /> {lesson.title}
            </button>
          )}
          {linkedEvent && (
            <button type="button" onClick={() => openEditor("event", linkedEvent.id, "prep")} className="inline-flex items-center gap-1 rounded-full bg-coral/30 px-2.5 py-1 text-ink hover:bg-coral/50">
              <CalendarDays className="h-3.5 w-3.5" /> {linkedEvent.title}
            </button>
          )}
        </div>
      )}

      <Disclosure summary="Area, role, time, notes" defaultOpen={!!f.description}>
        <div className="space-y-3">
          <AreaChips value={f.area} onChange={(area) => set({ area })} />
          {!isQuran && (
            <div>
              <FieldLabel>Role in the weekly plan</FieldLabel>
              <ChipGroup
                label="Role in the weekly plan"
                size="sm"
                value={f.kind}
                onChange={(k) => set({ kind: k, coreGoalId: k === "core" ? f.coreGoalId || goalOptions[0]?.goalId || "" : f.coreGoalId })}
                options={(Object.keys(KIND_LABELS) as TaskKind[]).map((id) => ({ id, label: KIND_LABELS[id], disabled: id === "core" && goalOptions.length === 0 }))}
              />
            </div>
          )}
          {kind === "core" && (
            <select aria-label="Core Goal" value={f.coreGoalId} onChange={(e) => set({ coreGoalId: e.target.value })} className={inputClass}>
              <option value="">Choose a Core Goal…</option>
              {goalOptions.map((g) => (
                <option key={g.goalId} value={g.goalId}>
                  {g.title}
                </option>
              ))}
            </select>
          )}
          {!isQuran && (
            <label className="flex items-center gap-2 text-xs font-bold text-ink-soft">
              <input type="checkbox" checked={f.effort === "custom"} onChange={(e) => set({ effort: e.target.checked ? "custom" : "M" })} />
              Custom effort
              {f.effort === "custom" && (
                <input type="number" min={1} max={MAX_CUSTOM_UNITS} aria-label="Custom work units" value={f.customUnits} onChange={(e) => set({ customUnits: Number(e.target.value) })} className="h-8 w-16 rounded-lg border border-twilight/30 bg-white px-2 text-sm text-ink" />
              )}
            </label>
          )}
          <div className="grid grid-cols-2 gap-2">
            <select aria-label="Time of day" value={f.slot} onChange={(e) => set({ slot: e.target.value as DaySlot })} className={inputClass}>
              {DAY_SLOTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <select aria-label="Duration" value={f.durationMin} onChange={(e) => set({ durationMin: Number(e.target.value) })} className={inputClass}>
              {DURATION_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </div>
          <textarea aria-label="Notes" rows={3} placeholder="Notes" value={f.description} onChange={(e) => set({ description: e.target.value })} className={`${inputClass} h-auto py-2 font-normal`} />
        </div>
      </Disclosure>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-ink/5 pt-3">
        {confirmDelete ? (
          <span className="mr-auto flex flex-wrap items-center gap-2 text-xs font-bold text-ink" role="alert">
            {removal ? `Delete? Weekly target ${removal.before} → ${removal.after}.` : "Delete this task?"}
            <Button size="sm" variant="primary" onClick={async () => (await removeTask(task.id, { preconfirmed: true })) && onDone()}>
              Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
              Keep
            </Button>
          </span>
        ) : (
          task.custom && (
            <Button size="sm" variant="ghost" className="mr-auto" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )
        )}
        <Button type="submit" variant="primary">
          <Check className="h-4 w-4" /> {impact ? `Save · target ${impact.before} → ${impact.after}` : "Save"}
        </Button>
      </div>
    </form>
  );
}

/* --------------------------------- Event --------------------------------- */

function EventEditor({ event, today, initialTab, onDone }: { event: CalendarEvent; today: string; initialTab?: string; onDone: () => void }) {
  const update = useCalendarStore((s) => s.updateEvent);
  const remove = useCalendarStore((s) => s.removeEvent);
  const quests = useQuestStore((s) => s.quests);
  const isExam = event.type === "exam";
  const linked = quests.filter((q) => q.eventId === event.id);
  const [tab, setTab] = useState(initialTab === "prep" ? "tasks" : "details");
  const [draft, setDraft] = useState<EventDraft>(eventDraftFrom(event));
  const [exam, setExam] = useState(event.exam ?? { subject: "", notes: "", status: "upcoming" as const, result: "" });
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (p: Partial<EventDraft>) => {
    setDraft({ ...draft, ...p });
    if (error) setError(null);
  };

  const save = (e: FormEvent) => {
    e.preventDefault();
    const err = validateEvent(draft);
    if (err) {
      setError(err);
      setTab("details");
      return;
    }
    update(event.id, { ...eventFromDraft(draft, event), exam: draft.type === "exam" ? exam : null });
    onDone();
  };

  const del = () => {
    linked.forEach((q) => useQuestStore.getState().updateQuest(q.id, { eventId: null }));
    remove(event.id);
    onDone();
  };

  return (
    <div className="space-y-3">
      <div className="flex rounded-2xl bg-white/60 p-1" role="tablist" aria-label="Event sections">
        {[
          { id: "details", label: "Details" },
          { id: "tasks", label: isExam ? `Preparation (${linked.length})` : `Tasks (${linked.length})` },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn("flex-1 rounded-xl px-3 py-1.5 text-sm font-bold", tab === t.id ? "bg-ink text-cream" : "text-ink-soft hover:text-ink")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "tasks" &&
        (isExam ? (
          <ExamPrep event={event} today={today} />
        ) : (
          <div className="space-y-2">
            <ul className="space-y-1.5">
              {linked.map((q) => (
                <TaskRow key={q.id} quest={q} />
              ))}
            </ul>
            {linked.length === 0 && <p className="text-sm text-ink-soft">Tasks linked to this event appear here.</p>}
            <InlineTaskAdd context={{ today, area: "personal", date: event.date >= today ? event.date : today, eventId: event.id }} placeholder="Add a task for this event…" />
          </div>
        ))}

      {tab === "details" && (
        <form onSubmit={save} className="space-y-3.5" noValidate>
          <EventEssentials draft={draft} set={set} error={error} idPrefix="ed-ev" showAllTypes />
          {draft.type === "exam" && (
            <div className="grid grid-cols-2 gap-2">
              <input aria-label="Subject" placeholder="Subject" value={exam.subject} onChange={(e) => setExam({ ...exam, subject: e.target.value })} className={inputClass} />
              <select aria-label="Exam status" value={exam.status} onChange={(e) => setExam({ ...exam, status: e.target.value as "upcoming" | "completed" })} className={inputClass}>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Taken</option>
              </select>
            </div>
          )}
          <Disclosure summary="Location, reminder, repeat, notes" defaultOpen={!!(draft.location || draft.freq || draft.description)}>
            <div className="space-y-2">
              <EventDetails draft={draft} set={set} />
              {draft.type === "exam" && (
                <>
                  <input aria-label="Result" placeholder="Result" value={exam.result} onChange={(e) => setExam({ ...exam, result: e.target.value })} className={inputClass} />
                  <textarea aria-label="Exam notes" rows={2} placeholder="Exam notes" value={exam.notes} onChange={(e) => setExam({ ...exam, notes: e.target.value })} className={`${inputClass} h-auto py-2 font-normal`} />
                </>
              )}
            </div>
          </Disclosure>
          {event.recurrence && <p className="text-xs text-ink-soft">Changes apply to every occurrence of this series.</p>}
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-ink/5 pt-3">
            {confirmDelete ? (
              <span className="mr-auto flex flex-wrap items-center gap-2 text-xs font-bold text-ink" role="alert">
                {event.recurrence ? "Delete the whole series?" : "Delete this event?"}
                {linked.length > 0 && ` ${linked.length} task(s) stay, unlinked.`}
                <Button size="sm" variant="primary" onClick={del}>
                  Delete
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Keep
                </Button>
              </span>
            ) : (
              <Button size="sm" variant="ghost" className="mr-auto" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
            <Button type="submit" variant="primary">
              <Check className="h-4 w-4" /> Save
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ---------------------------------- Quran --------------------------------- */

function SessionEditor({ id, today, onDone }: { id: string; today: string; onDone: () => void }) {
  const session = useQuranStore((s) => s.sessions.find((x) => x.id === id))!;
  const [draft, setDraft] = useState(quranDraftFrom(session));
  return <QuranSessionForm today={today} draft={draft} setDraft={setDraft} session={session} onSaved={onDone} />;
}

function QuranExamEditor({ id, today, onDone }: { id: string; today: string; onDone: () => void }) {
  const exam = useQuranStore((s) => s.exams.find((x) => x.id === id))!;
  const [draft, setDraft] = useState(quranExamDraft(today, exam));
  return <QuranExamForm draft={draft} setDraft={setDraft} exam={exam} onSaved={onDone} />;
}
