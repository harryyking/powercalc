/**
 * historyStore.ts
 *
 * Persists credit top-up history using react-native-mmkv.
 * ~30x faster than AsyncStorage, fully synchronous — no async/await needed.
 *
 * ⚠️  MMKV requires a dev build — does NOT work in Expo Go.
 *
 * Setup:
 *   npx expo install react-native-mmkv react-native-nitro-modules
 *   npx expo prebuild          # generates native iOS/Android projects
 *   npx expo run:ios           # or: eas build --profile development
 *
 * All functions are synchronous. Call them like regular functions — no await.
 *   const history = getHistory();       ✅
 *   const history = await getHistory(); ✅ (also works — Promise resolves instantly)
 */
import { useEffect, useState } from 'react';
import { createMMKV } from 'react-native-mmkv';
import type { CreditHistoryEntry } from '../types';

// ─── Storage instance ─────────────────────────────────────────────────────────
// One shared instance for the whole app. createMMKV() is cheap — reuse it.
// Give it a scoped ID so it won't collide with other MMKV stores (e.g. settings).

export const storage = createMMKV({ id: 'powercalc_gh.history' });

const HISTORY_KEY = 'history_v1';
const MAX_HISTORY_ENTRIES = 50;

// ─── Internal helpers ─────────────────────────────────────────────────────────

function readRaw(): CreditHistoryEntry[] {
  try {
    const raw = storage.getString(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(entries: CreditHistoryEntry[]): void {
  storage.set(HISTORY_KEY, JSON.stringify(entries));
}

function sortNewestFirst(entries: CreditHistoryEntry[]): CreditHistoryEntry[] {
  return entries.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

// ─── Read ──────────────────────────────────────────────────────────────────────

/** Returns all history entries, newest first. Synchronous. */
export function getHistory(): CreditHistoryEntry[] {
  return sortNewestFirst(readRaw());
}

/** Returns a single entry by id, or undefined if not found. */
export function getHistoryEntry(id: string): CreditHistoryEntry | undefined {
  return readRaw().find((e) => e.id === id);
}

// ─── Write ────────────────────────────────────────────────────────────────────

/** Prepend a new top-up entry. Trims to MAX_HISTORY_ENTRIES. Synchronous. */
export function addHistoryEntry(entry: CreditHistoryEntry): void {
  const existing = readRaw();
  const updated = [entry, ...existing].slice(0, MAX_HISTORY_ENTRIES);
  writeRaw(updated);
}

/**
 * Mark a history entry as finished.
 * Call when the user taps "My units finished today" — records actual duration.
 * Synchronous.
 */
export function markUnitsFinished(entryId: string): void {
  const existing = readRaw();
  const updated = existing.map((e) =>
    e.id === entryId
      ? { ...e, actualDays: daysBetween(e.date, new Date().toISOString()) }
      : e,
  );
  writeRaw(updated);
}

/**
 * Update any fields on an existing entry (e.g. user notes, actualDays).
 * Synchronous.
 */
export function updateHistoryEntry(
  entryId: string,
  changes: Partial<CreditHistoryEntry>,
): void {
  const existing = readRaw();
  const updated = existing.map((e) =>
    e.id === entryId ? { ...e, ...changes } : e,
  );
  writeRaw(updated);
}

/** Remove a single entry by id. Synchronous. */
export function deleteHistoryEntry(entryId: string): void {
  const existing = readRaw();
  writeRaw(existing.filter((e) => e.id !== entryId));
}

/** Wipe all history. Synchronous. */
export function clearHistory(): void {
  storage.remove(HISTORY_KEY);
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface HistoryStats {
  totalSpent: number;
  averageDailySpend: number;
  totalEntries: number;
  averageDaysPerTopUp: number;
  mostExpensiveAppliance: string | null;
  /** Estimate accuracy vs actual (0–100). null if user never marked units finished. */
  accuracy: number | null;
}

/** Compute stats across all history entries. Synchronous. */
export function getHistoryStats(): HistoryStats {
  const history = getHistory();

  if (history.length === 0) {
    return {
      totalSpent: 0,
      averageDailySpend: 0,
      totalEntries: 0,
      averageDaysPerTopUp: 0,
      mostExpensiveAppliance: null,
      accuracy: null,
    };
  }

  const totalSpent = history.reduce((s, e) => s + e.creditGhs, 0);
  const averageDailySpend =
    history.reduce((s, e) => s + e.dailyCostGhs, 0) / history.length;
  const averageDaysPerTopUp =
    history.reduce((s, e) => s + e.estimatedDays, 0) / history.length;

  // Accuracy — only entries where user confirmed actual finish date
  const withActual = history.filter((e) => e.actualDays !== undefined);
  const accuracy =
    withActual.length > 0
      ? withActual.reduce((s, e) => {
          const diff = Math.abs((e.actualDays ?? 0) - e.estimatedDays);
          const pct = Math.max(0, 100 - (diff / e.estimatedDays) * 100);
          return s + pct;
        }, 0) / withActual.length
      : null;

  // Most energy-hungry appliance across all saved sessions
  const applianceCost: Record<string, number> = {};
  for (const entry of history) {
    for (const a of entry.appliances) {
      const dailyKwh = (a.watts * a.quantity * a.hoursPerDay) / 1000;
      applianceCost[a.name] = (applianceCost[a.name] ?? 0) + dailyKwh;
    }
  }
  const mostExpensiveAppliance =
    Object.keys(applianceCost).length > 0
      ? Object.entries(applianceCost).sort(([, a], [, b]) => b - a)[0][0]
      : null;

  return {
    totalSpent,
    averageDailySpend,
    totalEntries: history.length,
    averageDaysPerTopUp,
    mostExpensiveAppliance,
    accuracy,
  };
}

// ─── MMKV React hook ─────────────────────────────────────────────────────────
/**
 * useHistory — reactive hook.
 * Re-renders the component whenever history changes.
 *
 * Usage:
 *   const history = useHistory();
 *
 * Under the hood it uses MMKV's built-in listener — no polling, no Context.
 */


export function useHistory(): CreditHistoryEntry[] {
  const [history, setHistory] = useState<CreditHistoryEntry[]>(() =>
    getHistory(),
  );

  useEffect(() => {
    // MMKV fires this listener synchronously whenever the key changes
    const listener = storage.addOnValueChangedListener((changedKey) => {
      if (changedKey === HISTORY_KEY) {
        setHistory(getHistory());
      }
    });
    return () => listener.remove();
  }, []);

  return history;
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function daysBetween(isoA: string, isoB: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round(
    (new Date(isoB).getTime() - new Date(isoA).getTime()) / msPerDay,
  );
}

/** Unique ID for new history entries */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}