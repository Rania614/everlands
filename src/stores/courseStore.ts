"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/constants";
import { safeStorage, uid } from "@/lib/utils";
import type { Course, CourseLevel, Lesson, LessonStatus } from "@/types/learning";
import { usePlanStore } from "./planStore";

interface CourseState {
  courses: Course[];
  levels: CourseLevel[];
  lessons: Lesson[];

  addCourse: (course: Omit<Course, "id">) => Course;
  /** Creates a course level with `lessonCount` numbered lessons. */
  startLevel: (courseId: string, name: string, lessonCount?: number) => CourseLevel;
  updateLevel: (id: string, patch: Partial<CourseLevel>) => void;
  updateLesson: (id: string, patch: Partial<Lesson>) => void;
  scheduleLesson: (id: string, date: string | null, time: string | null) => void;
  setLessonStatus: (id: string, status: LessonStatus) => void;
  setAttendance: (id: string, attended: boolean) => void;
}

function makeLessons(levelId: string, count: number): Lesson[] {
  return Array.from({ length: count }, (_, i) => ({
    id: uid("lesson"),
    levelId,
    number: i + 1,
    title: `Lesson ${i + 1}`,
    description: "",
    date: null,
    time: null,
    status: "upcoming",
    attended: false,
    content: "",
    resources: [],
    notes: "",
    understanding: null,
    rescheduledFrom: [],
  }));
}

const ENGLISH_COURSE: Course = {
  id: "course-english",
  title: "English Course",
  areaId: "english",
  locationId: "castle",
  defaultLessonCount: 8,
};

const SEED_LEVEL: CourseLevel = {
  id: "level-english-a2",
  courseId: ENGLISH_COURSE.id,
  name: "A2",
  lessonCount: 8,
  status: "active",
  startedAt: "",
  completedAt: null,
};

export const useCourseStore = create<CourseState>()(
  persist(
    (set, get) => {
      /** Completes the level once every lesson is completed; history is kept. */
      const checkLevelCompletion = (levelId: string) => {
        const level = get().levels.find((l) => l.id === levelId);
        if (!level || level.status === "completed") return;
        const lessons = get().lessons.filter((l) => l.levelId === levelId);
        if (lessons.length < level.lessonCount || !lessons.every((l) => l.status === "completed")) return;
        const attended = lessons.filter((l) => l.attended).length;
        const rated = lessons.filter((l) => l.understanding != null);
        const avg = rated.length ? rated.reduce((a, l) => a + (l.understanding ?? 0), 0) / rated.length : null;
        set((s) => ({
          levels: s.levels.map((l) =>
            l.id === levelId
              ? {
                  ...l,
                  status: "completed",
                  completedAt: new Date().toISOString(),
                  summary: `${lessons.length} lessons completed, ${attended} attended${avg ? `, average understanding ${avg.toFixed(1)}/5` : ""}.`,
                }
              : l,
          ),
        }));
        const course = get().courses.find((c) => c.id === level.courseId);
        // A permanent world-evolution milestone. It does not unlock an Everlands Level.
        usePlanStore.getState().addMilestone({
          type: "course-level-completed",
          locationId: course?.locationId ?? "castle",
          title: `${course?.title ?? "Course"} · ${level.name} completed`,
          refId: level.id,
        });
      };

      return {
        courses: [ENGLISH_COURSE],
        levels: [SEED_LEVEL],
        lessons: makeLessons(SEED_LEVEL.id, 8),

        addCourse: (course) => {
          const c = { ...course, id: uid("course") };
          set((s) => ({ courses: [...s.courses, c] }));
          return c;
        },
        startLevel: (courseId, name, lessonCount) => {
          const course = get().courses.find((c) => c.id === courseId);
          const count = Math.max(1, Math.min(40, lessonCount ?? course?.defaultLessonCount ?? 8));
          const level: CourseLevel = {
            id: uid("level"),
            courseId,
            name: name.trim() || "Next level",
            lessonCount: count,
            status: "active",
            startedAt: new Date().toISOString(),
            completedAt: null,
          };
          set((s) => ({ levels: [...s.levels, level], lessons: [...s.lessons, ...makeLessons(level.id, count)] }));
          return level;
        },
        updateLevel: (id, patch) => set((s) => ({ levels: s.levels.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
        updateLesson: (id, patch) => set((s) => ({ lessons: s.lessons.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
        scheduleLesson: (id, date, time) =>
          set((s) => ({
            lessons: s.lessons.map((l) => {
              if (l.id !== id) return l;
              const moved = l.date && date && l.date !== date;
              const keepStatus = l.status === "attended" || l.status === "completed";
              return {
                ...l,
                date,
                time,
                rescheduledFrom: moved ? [...l.rescheduledFrom, l.date!] : l.rescheduledFrom,
                status: keepStatus ? l.status : !date ? "upcoming" : moved || l.status === "missed" ? "rescheduled" : "scheduled",
              };
            }),
          })),
        setLessonStatus: (id, status) => {
          const lesson = get().lessons.find((l) => l.id === id);
          // Marking "attended" records attendance; nothing else is implied (homework stays separate).
          set((s) => ({
            lessons: s.lessons.map((l) =>
              l.id === id ? { ...l, status, attended: status === "attended" ? true : status === "missed" ? false : l.attended } : l,
            ),
          }));
          if (lesson) checkLevelCompletion(lesson.levelId);
        },
        setAttendance: (id, attended) =>
          set((s) => ({ lessons: s.lessons.map((l) => (l.id === id ? { ...l, attended } : l)) })),
      };
    },
    {
      name: STORAGE_KEYS.courses,
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
      partialize: (s) => ({ courses: s.courses, levels: s.levels, lessons: s.lessons }),
    },
  ),
);
