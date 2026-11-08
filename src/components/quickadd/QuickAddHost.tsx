"use client";

import { useState } from "react";
import { useTodayKey } from "@/hooks/useWeek";
import { useWorldStore, type QuickAddKind, type QuickAddRequest } from "@/stores/worldStore";
import type { QuestCategory } from "@/types/quest";
import { ChipGroup } from "../ui/ChipGroup";
import { Modal } from "../ui/Modal";
import { newEventDraft, QuickEventForm, type EventDraft } from "./QuickEventForm";
import { newExamDraft, QuickExamForm, type ExamDraft } from "./QuickExamForm";
import { newTaskDraft, QuickTaskForm, type TaskDraft } from "./QuickTaskForm";
import { newQuranDraft, quranExamDraft, QuranExamForm, QuranSessionForm, type QuranDraft, type QuranExamDraft } from "./QuranForms";

const KINDS: { id: Exclude<QuickAddKind, "quran-exam">; label: string }[] = [
  { id: "task", label: "Task" },
  { id: "event", label: "Event" },
  { id: "exam", label: "Exam" },
  { id: "quran", label: "Quran" },
];

type Drafts = Partial<{ task: TaskDraft; event: EventDraft; exam: ExamDraft; quran: QuranDraft; "quran-exam": QuranExamDraft }>;

const keyOf = (r: QuickAddRequest) => `${r.kind}:${JSON.stringify(r.context)}`;

/**
 * The single Quick Add sheet. Opened from the global "+ Add" button, the N key,
 * or contextually (calendar day, lesson, exam, location). Drafts survive an
 * accidental close and are cleared once saved.
 */
export function QuickAddHost() {
  const req = useWorldStore((s) => s.quickAdd);
  const close = useWorldStore((s) => s.closeQuickAdd);
  const open = useWorldStore((s) => s.openQuickAdd);
  const today = useTodayKey();
  const [drafts, setDrafts] = useState<Record<string, Drafts>>({});
  const [lastArea, setLastArea] = useState<QuestCategory>("english");

  if (!req || !today) return <Modal open={false} onClose={close} title="" variant="sheet">{null}</Modal>;

  const key = keyOf(req);
  const ctx = req.context;
  const d = drafts[key] ?? {};
  const put = <K extends keyof Drafts>(kind: K, value: Drafts[K]) => setDrafts((all) => ({ ...all, [key]: { ...all[key], [kind]: value } }));
  const clear = () =>
    setDrafts((all) => {
      const next = { ...all };
      delete next[key];
      return next;
    });
  const saved = () => {
    clear();
    close();
  };

  const title =
    req.kind === "quran-exam" ? "New Quran exam" : req.kind === "quran" ? "Record a Quran session" : req.kind === "exam" ? "New exam" : req.kind === "event" ? "New event" : "New task";

  return (
    <Modal open onClose={close} title={ctx.label ? `${title} · ${ctx.label}` : title} variant="sheet" size="md">
      {!ctx.lockKind && req.kind !== "quran-exam" && (
        <ChipGroup
          label="What do you want to add?"
          className="mb-4"
          value={req.kind}
          onChange={(k) => open(k, ctx)}
          options={KINDS}
        />
      )}
      {req.kind === "task" && (
        <QuickTaskForm
          today={today}
          ctx={ctx}
          draft={d.task ?? newTaskDraft(today, ctx, lastArea)}
          setDraft={(v) => put("task", v)}
          onSaved={() => {
            setLastArea((d.task ?? newTaskDraft(today, ctx, lastArea)).area);
            saved();
          }}
        />
      )}
      {req.kind === "event" && <QuickEventForm draft={d.event ?? newEventDraft(today, ctx)} setDraft={(v) => put("event", v)} onSaved={saved} />}
      {req.kind === "exam" && (
        <QuickExamForm today={today} draft={d.exam ?? newExamDraft(today, ctx)} setDraft={(v) => put("exam", v)} onSaved={clear} onDone={close} />
      )}
      {req.kind === "quran" && (
        <QuranSessionForm today={today} draft={d.quran ?? newQuranDraft(today, ctx.quranExamId, ctx.date ?? today)} setDraft={(v) => put("quran", v)} onSaved={saved} />
      )}
      {req.kind === "quran-exam" && <QuranExamForm draft={d["quran-exam"] ?? quranExamDraft(today)} setDraft={(v) => put("quran-exam", v)} onSaved={saved} />}
    </Modal>
  );
}
