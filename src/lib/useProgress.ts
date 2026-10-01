"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createDefaultProgress, importProgressFromJson, PROGRESS_STORAGE_KEY, refreshProgress, saveProgress } from "@/lib/progress";
import type { UserProgress } from "@/lib/types";

type Snapshot = { progress: UserProgress; hydrated: boolean; storageError: string; blocked: boolean; dirty: boolean };
const initial: Snapshot = { progress: createDefaultProgress(), hydrated: false, storageError: "", blocked: false, dirty: false };
let snapshot = initial;
let lastRaw: string | null = null;
const listeners = new Set<() => void>();
function publish(next: Snapshot) { snapshot = next; listeners.forEach((listener) => listener()); }
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
function hydrate() {
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    const progress = raw ? importProgressFromJson(raw) : createDefaultProgress();
    lastRaw = raw;
    publish({ progress, hydrated: true, blocked: false, dirty: false, storageError: "" });
  } catch {
    publish({ ...snapshot, hydrated: true, blocked: true, storageError: "Не удалось прочитать сохраненные данные. Они не перезаписаны. В настройках можно скачать исходный файл, импортировать резервную копию или явно сбросить прогресс." });
  }
}
function persist(progress: UserProgress, replace = false) {
  try {
    saveProgress(progress);
    lastRaw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    publish({ progress, hydrated: true, storageError: "", blocked: false, dirty: false });
  } catch {
    // Keep the unsaved work available for export rather than losing it after a quota error.
    publish({ progress, hydrated: true, blocked: replace ? snapshot.blocked : false, dirty: true, storageError: "Изменения есть только в памяти: браузер не смог их сохранить. Не закрывайте вкладку. Скачайте JSON в настройках или повторите сохранение." });
  }
}
function setProgress(update: UserProgress | ((latest: UserProgress) => UserProgress)) {
  if (!snapshot.hydrated || snapshot.blocked) throw new Error("Сначала восстановите сохраненные данные в настройках.");
  let latest = snapshot.progress;
  if (!snapshot.dirty) {
    try {
      const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (raw !== lastRaw) { latest = raw ? importProgressFromJson(raw) : createDefaultProgress(); lastRaw = raw; }
    } catch { hydrate(); return; }
  }
  persist(typeof update === "function" ? update(latest) : update);
}
function importProgress(json: string) { const next = importProgressFromJson(json); persist(next, true); }
function resetProgress() { persist(createDefaultProgress(), true); }
function retrySave() { if (!snapshot.blocked) persist(snapshot.progress); }

export function useProgress() {
  const state = useSyncExternalStore(subscribe, () => snapshot, () => initial);
  useEffect(() => {
    if (!snapshot.hydrated) hydrate();
    function sync(event: StorageEvent) {
      if (event.key !== PROGRESS_STORAGE_KEY && event.key !== null) return;
      if (snapshot.dirty) { publish({ ...snapshot, storageError: "Другая вкладка изменила прогресс. Здесь есть несохраненная работа. Скачайте ее JSON перед импортом или перезагрузкой." }); return; }
      hydrate();
    }
    function refresh() { if (snapshot.hydrated) publish({ ...snapshot, progress: refreshProgress(snapshot.progress) }); }
    window.addEventListener("storage", sync);
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener("focus", refresh); window.clearInterval(timer); };
  }, []);
  return { ...state, canEdit: state.hydrated && !state.blocked, setProgress, resetProgress, importProgress, retrySave };
}
