import { useState, useEffect, useCallback } from 'react';
import type { Product } from '@/types/product';

export interface HistoryItem {
  id: string;
  timestamp: string;
  producto: Product;
  action: string;
  changes: { field: string; before: string; after: string }[];
  fullBefore?: Product | null;
}

const STORAGE_KEY = 'cadfz_history_v1';
const MAX_ITEMS = 200;

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

export function usePersistentHistory() {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as HistoryItem[];
        // Keep only last 5 days to avoid bloat (optional)
        const today = getTodayKey();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 5);
        const cutoffStr = cutoff.toISOString().split('T')[0];
        return parsed.filter(h => h.timestamp >= cutoffStr).slice(-MAX_ITEMS);
      }
    } catch {}
    return [];
  });

  // Save to localStorage on changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // ignore storage errors
    }
  }, [history]);

  const addToHistory = useCallback((action: string, before: Product | null, after: Product) => {
    const changes: { field: string; before: string; after: string }[] = [];
    if (before) {
      if (before.uds !== after.uds) changes.push({ field: 'Unidades', before: String(before.uds), after: String(after.uds) });
      if (before.estado !== after.estado) changes.push({ field: 'Estado', before: before.estado, after: after.estado });
      if (before.observaciones !== after.observaciones) changes.push({ field: 'Observaciones', before: before.observaciones, after: after.observaciones });
      if (before.ubi !== after.ubi) changes.push({ field: 'Ubicación', before: before.ubi, after: after.ubi });
      if (before.marca !== after.marca) changes.push({ field: 'Marca', before: before.marca, after: after.marca });
      if (before.tipo !== after.tipo) changes.push({ field: 'Tipo', before: before.tipo, after: after.tipo });
      if (before.coste !== after.coste) changes.push({ field: 'Coste', before: String(before.coste), after: String(after.coste) });
      if (before.fecha !== after.fecha) changes.push({ field: 'Fecha', before: before.fecha, after: after.fecha });
    }

    setHistory(prev => {
      const next = [
        {
          id: crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
          timestamp: new Date().toISOString(),
          producto: after,
          action,
          changes,
          fullBefore: before,
        },
        ...prev,
      ];
      return next.slice(0, MAX_ITEMS);
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
    }
  }, []);

  return { history, addToHistory, clearHistory };
}
