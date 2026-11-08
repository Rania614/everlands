"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/Button";
import { ProgressRing } from "../ui/ProgressBar";

interface FocusTimerProps {
  minutes: number;
  label: string;
  color?: string;
  onFinish?: () => void;
}

/** Lightweight focus session timer (counts down, pausable, resettable). */
export function FocusTimer({ minutes, label, color, onFinish }: FocusTimerProps) {
  const total = minutes * 60;
  const [left, setLeft] = useState(total);
  const [running, setRunning] = useState(false);
  const finished = useRef(false);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (left > 0 || finished.current) return;
    finished.current = true;
    const id = setTimeout(() => {
      setRunning(false);
      onFinishRef.current?.();
    }, 0);
    return () => clearTimeout(id);
  }, [left]);

  const reset = () => {
    setRunning(false);
    finished.current = false;
    setLeft(total);
  };

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white/70 p-3">
      <ProgressRing value={1 - left / total} size={76} stroke={7} label={`${label} focus timer`} color={color}>
        <span className="font-display text-base font-semibold tabular-nums text-ink" aria-live="off">
          {mm}:{ss}
        </span>
      </ProgressRing>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">Focus session</p>
        <p className="truncate font-display text-base font-semibold text-ink">{label}</p>
        <div className="mt-2 flex gap-1.5">
          <Button size="sm" variant={running ? "secondary" : "primary"} onClick={() => setRunning((r) => !r)} disabled={left === 0}>
            {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {running ? "Pause" : left < total ? "Resume" : "Start"}
          </Button>
          <Button size="sm" variant="ghost" onClick={reset} aria-label="Reset timer">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
