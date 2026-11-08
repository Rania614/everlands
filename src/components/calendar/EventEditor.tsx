"use client";

import { Check, GraduationCap, ListPlus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { EVENT_COLORS, EVENT_TYPES, EVENT_TYPE_MAP } from "@/lib/calendarFeed";
import { diffDays, formatDay, todayKey, weekKeyOf } from "@/lib/dates";
import { weekStartSetting } from "@/lib/lifecycle";
import { cn } from "@/lib/utils";
import { useCalendarStore } from "@/stores/calendarStore";
import { useCourseStore } from "@/stores/courseStore";
import { useQuestStore } from "@/stores/questStore";
import { useWorldStore } from "@/stores/worldStore";
import type { CalendarEvent, EventType, RecurrenceFreq } from "@/types/calendar";
import { QuestCard } from "../quests/QuestCard";
import { TaskFormModal, type TaskDefaults } from "../quests/TaskFormModal";
import { Button } from "../ui/Button";
import { SelectInput, TextArea, TextInput, Toggle } from "../ui/Field";
import { Modal } from "../ui/Modal";
import { ProgressBar } from "../ui/ProgressBar";

interface Props {
  open: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  defaultDate?: string;
  defaultType?: EventType;
}

const REMINDERS: { value: string; label: string }[] = [
  { value: "", label: "No reminder" },
  { value: "0", label: "At start" },
  { value: "10", label: "10 minutes before" },
  { value: "30", label: "30 minutes before" },
  { value: "60", label: "1 hour before" },
  { value: "1440", label: "1 day before" },
];

export function EventEditor(props: Props) {
  if (!props.open) return null;
  return <EventForm key={props.event?.id ?? `new-${props.defaultDate}`} {...props} />;
}

function EventForm({ open, onClose, event, defaultDate, defaultType }: Props) {
  const add = useCalendarStore((s) => s.addEvent);
  const update = useCalendarStore((s) => s.updateEvent);
  const remove = useCalendarStore((s) => s.removeEvent);
  const ask = useWorldStore((s) => s.ask);
  const levels = useCourseStore((s) => s.levels);
  const lessons = useCourseStore((s) => s.lessons);

  const [title, setTitle] = useState(event?.title ?? "");
  const [type, setType] = useState<EventType>(event?.type ?? defaultType ?? "appointment");
  const [date, setDate] = useState(event?.date ?? defaultDate ?? todayKey());
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [startTime, setStart] = useState(event?.startTime ?? "09:00");
  const [endTime, setEnd] = useState(event?.endTime ?? "10:00");
  const [location, setLocation] = useState(event?.location ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [reminder, setReminder] = useState(event?.reminderMinutes == null ? "" : String(event.reminderMinutes));
  const [color, setColor] = useState(event?.color ?? "");
  const [freq, setFreq] = useState<RecurrenceFreq | "">(event?.recurrence?.freq ?? "");
  const [interval, setRepeatInterval] = useState(event?.recurrence?.interval ?? 1);
  const [until, setUntil] = useState(event?.recurrence?.until ?? "");
  const [levelId, setLevelId] = useState(event?.courseLevelId ?? "");
  const [lessonId, setLessonId] = useState(event?.lessonId ?? "");
  const [subject, setSubject] = useState(event?.exam?.subject ?? "");
  const [examNotes, setExamNotes] = useState(event?.exam?.notes ?? "");
  const [examStatus, setExamStatus] = useState(event?.exam?.status ?? "upcoming");
  const [result, setResult] = useState(event?.exam?.result ?? "");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError("Give the event a title.");
    if (!allDay && endTime && startTime && endTime < startTime) return setError("The end time is before the start time.");
    const data = {
      title: title.trim(),
      type,
      date,
      allDay,
      startTime: allDay ? null : startTime || null,
      endTime: allDay ? null : endTime || null,
      location: location.trim(),
      description: description.trim(),
      reminderMinutes: reminder === "" ? null : Number(reminder),
      color: color || EVENT_TYPE_MAP[type].color,
      recurrence: freq ? { freq, interval: Math.max(1, interval), until: until || null } : null,
      courseLevelId: levelId || null,
      lessonId: lessonId || null,
      exam: type === "exam" ? { subject: subject.trim(), notes: examNotes, status: examStatus, result } : null,
    };
    if (event) update(event.id, data);
    else add(data);
    onClose();
  };

  const onDelete = async () => {
    if (!event) return;
    const linked = useQuestStore.getState().quests.filter((q) => q.eventId === event.id);
    const ok = await ask({
      title: `Delete “${event.title}”?`,
      message: event.recurrence ? "This removes every occurrence of the series." : "This removes the event from your calendar.",
      lines: linked.length ? [`${linked.length} related task(s) stay in your plan, unlinked.`] : undefined,
      actions: [{ id: "delete", label: "Delete event", variant: "primary" }],
    });
    if (ok !== "delete") return;
    linked.forEach((q) => useQuestStore.getState().updateQuest(q.id, { eventId: null }));
    remove(event.id);
    onClose();
  };

  const levelLessons = lessons.filter((l) => l.levelId === levelId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={event ? `Edit ${EVENT_TYPE_MAP[event.type].label.toLowerCase()}` : "New event"}
      description="Events are real commitments. They never count as tasks; you can link tasks to them."
      footer={
        <>
          {event && (
            <Button variant="ghost" className="mr-auto" onClick={onDelete}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="event-form">
            <Check className="h-4 w-4" /> {event ? "Save event" : "Create event"}
          </Button>
        </>
      }
    >
      <form id="event-form" onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <TextInput label="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="sm:col-span-2" placeholder="e.g. Database Final Exam" maxLength={100} />
        <SelectInput label="Type" value={type} onChange={(e) => setType(e.target.value as EventType)}>
          {EVENT_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </SelectInput>
        <TextInput label="Date" type="date" value={date} required onChange={(e) => setDate(e.target.value)} />
        <div className="flex items-end sm:col-span-2">
          <Toggle checked={allDay} onChange={setAllDay} label="All-day (no specific time)" />
        </div>
        {!allDay && (
          <>
            <TextInput label="Start time" type="time" value={startTime} onChange={(e) => setStart(e.target.value)} />
            <TextInput label="End time" type="time" value={endTime} onChange={(e) => setEnd(e.target.value)} hint="Optional" />
          </>
        )}
        <TextInput label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional" />
        <SelectInput label="Reminder" value={reminder} onChange={(e) => setReminder(e.target.value)} hint="Shown inside Everlands while it's open.">
          {REMINDERS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </SelectInput>
        <SelectInput label="Repeats" value={freq} onChange={(e) => setFreq(e.target.value as RecurrenceFreq | "")}>
          <option value="">Does not repeat</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </SelectInput>
        {freq && (
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="Every" type="number" min={1} max={12} value={interval} onChange={(e) => setRepeatInterval(Number(e.target.value))} hint={freq === "daily" ? "days" : freq === "weekly" ? "weeks" : "months"} />
            <TextInput label="Until" type="date" value={until} onChange={(e) => setUntil(e.target.value)} hint="Optional" />
          </div>
        )}
        <div className="sm:col-span-2">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-ink-soft">Color</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Event color">
            {["", ...EVENT_COLORS].map((c) => (
              <button
                key={c || "auto"}
                type="button"
                role="radio"
                aria-checked={color === c}
                aria-label={c ? `Color ${c}` : "Color by type"}
                onClick={() => setColor(c)}
                className={cn("h-8 w-8 rounded-full border-2", color === c ? "border-ink" : "border-white")}
                style={{ background: c || EVENT_TYPE_MAP[type].color, backgroundImage: c ? undefined : "linear-gradient(135deg, transparent 45%, white 45%, white 55%, transparent 55%)" }}
              />
            ))}
          </div>
        </div>
        <TextArea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="sm:col-span-2" rows={2} />

        <details className="rounded-2xl bg-white/60 p-3 sm:col-span-2" open={!!levelId}>
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-bold text-ink">
            <GraduationCap className="h-4 w-4" /> Related course or lesson
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <SelectInput label="Course level" value={levelId} onChange={(e) => { setLevelId(e.target.value); setLessonId(""); }}>
              <option value="">None</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  English {l.name} {l.status === "completed" ? "(completed)" : ""}
                </option>
              ))}
            </SelectInput>
            <SelectInput label="Lesson" value={lessonId} onChange={(e) => setLessonId(e.target.value)} disabled={!levelId}>
              <option value="">None</option>
              {levelLessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </SelectInput>
          </div>
        </details>

        {type === "exam" && (
          <fieldset className="grid gap-3 rounded-2xl border border-coral/50 bg-coral/10 p-3 sm:col-span-2 sm:grid-cols-2">
            <legend className="px-1 text-xs font-bold uppercase tracking-wider text-ink">Exam details</legend>
            <TextInput label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Databases" />
            <SelectInput label="Exam status" value={examStatus} onChange={(e) => setExamStatus(e.target.value as "upcoming" | "completed")} hint="Preparation tasks never complete the exam.">
              <option value="upcoming">Upcoming</option>
              <option value="completed">Taken</option>
            </SelectInput>
            <TextArea label="Notes" value={examNotes} onChange={(e) => setExamNotes(e.target.value)} rows={2} />
            <TextInput label="Result" value={result} onChange={(e) => setResult(e.target.value)} placeholder="Optional" />
          </fieldset>
        )}
        {error && <p className="text-sm font-semibold text-[#a4594b] sm:col-span-2">{error}</p>}
      </form>

      {event && <LinkedTasks event={event} />}
    </Modal>
  );
}

/** Related tasks; for exams this is the preparation tracker with countdown. */
export function LinkedTasks({ event }: { event: CalendarEvent }) {
  const quests = useQuestStore((s) => s.quests);
  const [adding, setAdding] = useState<TaskDefaults | null>(null);
  const linked = quests.filter((q) => q.eventId === event.id);
  const done = linked.filter((q) => q.status === "done").length;
  const today = todayKey();
  const days = diffDays(today, event.date);
  const isExam = event.type === "exam";
  const prepDate = event.date >= today ? today : event.date;

  return (
    <section className="mt-5 rounded-2xl bg-white/60 p-3" aria-label={isExam ? "Exam preparation" : "Related tasks"}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="font-display text-base font-semibold text-ink">{isExam ? "Preparation" : "Related tasks"}</h3>
        {isExam && (
          <span className="rounded-full bg-coral/30 px-2.5 py-0.5 text-xs font-bold text-ink">
            {event.exam?.status === "completed" ? "Exam taken" : days > 0 ? `${days} day${days === 1 ? "" : "s"} to go` : days === 0 ? "Today" : "Date passed"}
          </span>
        )}
        <Button
          size="sm"
          variant="soft"
          className="ml-auto"
          onClick={() =>
            setAdding({
              title: isExam ? "" : `Prepare: ${event.title}`,
              weekKey: weekKeyOf(prepDate, weekStartSetting()),
              date: prepDate,
              eventId: event.id,
              locationId: isExam ? "workshop" : "haven",
            })
          }
        >
          <ListPlus className="h-4 w-4" /> {isExam ? "Add preparation task" : "Create task from event"}
        </Button>
      </div>
      {linked.length > 0 && (
        <>
          <ProgressBar value={done / linked.length} label="Preparation progress" color="#E7A99C" size="sm" />
          <p className="mb-2 mt-1 text-xs font-semibold text-ink-soft">
            {done} of {linked.length} done · {formatDay(event.date, { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </>
      )}
      <div className="space-y-2">
        {linked.map((q) => (
          <QuestCard key={q.id} quest={q} compact showDate showLocation={false} />
        ))}
        {linked.length === 0 && <p className="text-sm text-ink-soft">No tasks linked yet.</p>}
      </div>
      {adding && <TaskFormModal open onClose={() => setAdding(null)} defaults={adding} heading={isExam ? "New preparation task" : "New task from event"} />}
    </section>
  );
}
