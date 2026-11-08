"use client";

import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useWorldStore } from "@/stores/worldStore";
import type { AppView, LocationId } from "@/types/world";

/**
 * Single entry point for moving around the app. UI components never set
 * view/selection state directly, so navigation rules stay in one place.
 */
export function useWorldNavigation() {
  const { view, selectedLocationId, enteredLocationId } = useWorldStore(
    useShallow((s) => ({
      view: s.view,
      selectedLocationId: s.selectedLocationId,
      enteredLocationId: s.enteredLocationId,
    })),
  );

  const selectLocation = useCallback((id: LocationId) => {
    const s = useWorldStore.getState();
    if (s.view !== "world") s.setView("world");
    s.selectLocation(id);
  }, []);

  const enterLocation = useCallback((id: LocationId) => {
    useWorldStore.getState().enterLocation(id);
  }, []);

  const goTo = useCallback((next: AppView) => {
    const s = useWorldStore.getState();
    if (next === "location" && !s.enteredLocationId) return s.setView("world");
    s.setView(next);
  }, []);

  const backToWorld = useCallback(() => useWorldStore.getState().goToWorld(), []);
  const closePreview = useCallback(() => useWorldStore.getState().clearSelection(), []);

  return { view, selectedLocationId, enteredLocationId, selectLocation, enterLocation, goTo, backToWorld, closePreview };
}
