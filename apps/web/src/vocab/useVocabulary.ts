import { useEffect, useState } from 'react';
import { api } from '../api/client';

export interface VocabularyOption {
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}
export interface Vocabulary {
  key: string;
  label: string;
  options: VocabularyOption[];
}

const cache = new Map<string, Vocabulary>();
const inFlight = new Map<string, Promise<Vocabulary>>();

async function loadVocabulary(key: string): Promise<Vocabulary> {
  if (cache.has(key)) return cache.get(key)!;
  if (!inFlight.has(key)) {
    inFlight.set(
      key,
      api.get<Vocabulary>(`/vocabularies/${key}`).then((v) => {
        cache.set(key, v);
        inFlight.delete(key);
        return v;
      }),
    );
  }
  return inFlight.get(key)!;
}

/** Fetches and caches a controlled-terminology list for a <select>. */
export function useVocabulary(key: string): { options: VocabularyOption[]; loading: boolean } {
  const [options, setOptions] = useState<VocabularyOption[]>(cache.get(key)?.options ?? []);
  const [loading, setLoading] = useState(!cache.has(key));

  useEffect(() => {
    let cancelled = false;
    if (cache.has(key)) {
      setOptions(cache.get(key)!.options);
      setLoading(false);
      return;
    }
    setLoading(true);
    loadVocabulary(key)
      .then((v) => {
        if (!cancelled) {
          setOptions(v.options);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return { options, loading };
}
