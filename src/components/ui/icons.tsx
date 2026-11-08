import {
  BookOpen,
  Code,
  Cpu,
  Headphones,
  Map,
  Mic,
  Moon,
  PenLine,
  Repeat,
  Sprout,
  Sun,
  Target,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { ActivityIcon } from "@/types/world";

export const ACTIVITY_ICONS: Record<ActivityIcon, LucideIcon> = {
  book: BookOpen,
  headphones: Headphones,
  mic: Mic,
  pen: PenLine,
  sprout: Sprout,
  moon: Moon,
  repeat: Repeat,
  code: Code,
  cpu: Cpu,
  wrench: Wrench,
  map: Map,
  sun: Sun,
  target: Target,
};
