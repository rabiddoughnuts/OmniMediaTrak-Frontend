"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { browserApiUrl } from "../lib/api-url";

type ListSummary = {
  id: string;
  name: string;
  kind: "tracking" | "custom";
  is_owner: boolean;
};

type Entry = {
  status: "planned" | "in-progress" | "completed" | "dropped";
  progress: number | null;
  rating: number | null;
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
};

type RelatedItem = {
  media_id: string;
  title: string;
  matching_users: number;
  cohort_share: string;
};

type TrendResponse = {
  suppressed: boolean;
  participants?: number;
  alsoLiked: RelatedItem[];
  alsoDisliked: RelatedItem[];
};

const EMPTY_ENTRY: Entry = {
  status: "planned",
  progress: null,
  rating: null,
  notes: "",
  started_at: null,
  completed_at: null,
};

function dateInput(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function toTimestamp(value: string) {
  return value ? new Date(`${value}T00:00:00`).toISOString() : null;
}

export default function MediaTrackingPanel({ mediaId }: { mediaId: string }) {
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [entry, setEntry] = useState<Entry>(EMPTY_ENTRY);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [trends, setTrends] = useState<TrendResponse | null>(null);

  useEffect(() => {
    async function load() {
      const [listsResponse, entryResponse, trendResponse] = await Promise.all([
        fetch(browserApiUrl("/lists"), { credentials: "include" }),
        fetch(browserApiUrl(`/list/${mediaId}`), { credentials: "include" }),
        fetch(browserApiUrl(`/trends/related/${mediaId}?limit=5`), { credentials: "include" }),
      ]);
      if (listsResponse.status === 401) {
        setAuthenticated(false);
        return;
      }
      if (listsResponse.ok) {
        const data = (await listsResponse.json()) as { lists: ListSummary[] };
        const owned = data.lists.filter((list) => list.is_owner);
        setLists(owned);
        setSelectedListId(owned.find((list) => list.kind === "tracking")?.id ?? owned[0]?.id ?? "");
        setAuthenticated(true);
      }
      if (entryResponse.ok) {
        const data = (await entryResponse.json()) as { entry: Entry };
        setEntry(data.entry);
      }
      if (trendResponse.ok) setTrends((await trendResponse.json()) as TrendResponse);
    }
    void load();
  }, [mediaId]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedListId) return;
    setPending(true);
    setFeedback(null);
    const response = await fetch(browserApiUrl(`/lists/${selectedListId}/items`), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mediaId,
        status: entry.status,
        progress: entry.progress,
        rating: entry.rating,
        notes: entry.notes || null,
        startedAt: toTimestamp(dateInput(entry.started_at)),
        completedAt: toTimestamp(dateInput(entry.completed_at)),
      }),
    });
    setFeedback(response.ok ? "Saved" : "Unable to save");
    setPending(false);
  }

  async function remove() {
    if (!selectedListId) return;
    setPending(true);
    const response = await fetch(browserApiUrl(`/lists/${selectedListId}/items/${mediaId}`), {
      method: "DELETE",
      credentials: "include",
    });
    setFeedback(response.ok ? "Removed from selected list" : "Unable to remove");
    if (response.ok && lists.find((list) => list.id === selectedListId)?.kind === "tracking") {
      setEntry(EMPTY_ENTRY);
    }
    setPending(false);
  }

  return (
    <aside className="media-actions-panel">
      <h2>Track</h2>
      {authenticated === false ? (
        <p className="helper"><Link href={`/auth/login?next=/media/${mediaId}`}>Sign in</Link> to add this title.</p>
      ) : authenticated === null ? (
        <p className="helper">Loading...</p>
      ) : (
        <form className="form" onSubmit={save}>
          <label className="form-field"><span>List</span><select className="input" value={selectedListId} onChange={(event) => setSelectedListId(event.target.value)}>{lists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}</select></label>
          <label className="form-field"><span>Status</span><select className="input" value={entry.status} onChange={(event) => setEntry((prev) => ({ ...prev, status: event.target.value as Entry["status"] }))}><option value="planned">Planned</option><option value="in-progress">In progress</option><option value="completed">Completed</option><option value="dropped">Dropped</option></select></label>
          <div className="form-grid">
            <label className="form-field"><span>Progress</span><input className="input" type="number" min={0} value={entry.progress ?? ""} onChange={(event) => setEntry((prev) => ({ ...prev, progress: event.target.value ? Number(event.target.value) : null }))} /></label>
            <label className="form-field"><span>Rating</span><input className="input" type="number" min={1} max={10} value={entry.rating ?? ""} onChange={(event) => setEntry((prev) => ({ ...prev, rating: event.target.value ? Number(event.target.value) : null }))} /></label>
            <label className="form-field"><span>Started</span><input className="input" type="date" value={dateInput(entry.started_at)} onChange={(event) => setEntry((prev) => ({ ...prev, started_at: event.target.value || null }))} /></label>
            <label className="form-field"><span>Completed</span><input className="input" type="date" value={dateInput(entry.completed_at)} onChange={(event) => setEntry((prev) => ({ ...prev, completed_at: event.target.value || null }))} /></label>
          </div>
          <label className="form-field"><span>Private notes</span><textarea className="input" rows={4} value={entry.notes ?? ""} onChange={(event) => setEntry((prev) => ({ ...prev, notes: event.target.value }))} /></label>
          <div className="form-actions"><button className="button button--primary" type="submit" disabled={pending}>Save</button><button className="button button--ghost" type="button" disabled={pending} onClick={remove}>Remove</button></div>
          {feedback && <p className="helper">{feedback}</p>}
        </form>
      )}

      {trends && !trends.suppressed && (trends.alsoLiked.length > 0 || trends.alsoDisliked.length > 0) && (
        <section className="trend-summary">
          <h2>Audience patterns</h2>
          {trends.alsoLiked.length > 0 && <><h3>Also liked</h3><ul>{trends.alsoLiked.map((item) => <li key={item.media_id}><Link href={`/media/${item.media_id}`}>{item.title}</Link></li>)}</ul></>}
          {trends.alsoDisliked.length > 0 && <><h3>Often rated low</h3><ul>{trends.alsoDisliked.map((item) => <li key={item.media_id}><Link href={`/media/${item.media_id}`}>{item.title}</Link></li>)}</ul></>}
        </section>
      )}
    </aside>
  );
}
