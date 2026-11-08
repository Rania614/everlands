"use client";

import { useEffect, useState } from "react";
import { selectReducedMotion, useWorldStore } from "@/stores/worldStore";

/** Mirrors the OS `prefers-reduced-motion` setting into the world store. */
export function useSystemReducedMotionSync() {
  const setSystemReducedMotion = useWorldStore((s) => s.setSystemReducedMotion);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [setSystemReducedMotion]);
}

export function useReducedMotion() {
  return useWorldStore(selectReducedMotion);
}

export type WebGLStatus = "checking" | "supported" | "unsupported";

export function useWebGLSupport(): WebGLStatus {
  const [status, setStatus] = useState<WebGLStatus>("checking");
  useEffect(() => {
    let ok = false;
    try {
      const canvas = document.createElement("canvas");
      ok = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    } catch {
      ok = false;
    }
    // Deferred so the state update happens outside the effect body.
    const id = requestAnimationFrame(() => setStatus(ok ? "supported" : "unsupported"));
    return () => cancelAnimationFrame(id);
  }, []);
  return status;
}

export function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);
  return mobile;
}

/** Client-only formatted date (avoids server/client hydration mismatch). */
export function useToday() {
  const [label, setLabel] = useState<string>("");
  useEffect(() => {
    const format = () =>
      setLabel(
        new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }),
      );
    format();
    const t = setInterval(format, 60_000);
    return () => clearInterval(t);
  }, []);
  return label;
}
