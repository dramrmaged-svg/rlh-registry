import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { TimelineEvent } from '../types';

export function TimelinePanel({ episodeId }: { episodeId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<TimelineEvent[]>(`/episodes/${episodeId}/timeline`)
      .then(setEvents)
      .finally(() => setLoading(false));
  }, [episodeId]);

  return (
    <div className="card">
      <h3>Timeline</h3>
      {loading ? (
        <p className="muted">Loading…</p>
      ) : events.length === 0 ? (
        <p className="muted">No dated events yet.</p>
      ) : (
        <ul className="timeline">
          {events.map((e, i) => (
            <li key={i}>
              <strong>{e.date ? e.date.slice(0, 10) : '—'}</strong> · {e.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
