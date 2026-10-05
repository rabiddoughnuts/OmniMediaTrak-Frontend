"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { browserApiUrl } from "../lib/api-url";
import {
  EMPTY_MEDIA_FILTERS,
  filtersToQuery,
  type MediaColumnKey,
  type MediaFilters,
  type MediaItem,
} from "../lib/media-fields";
import MediaTableControls from "./MediaTableControls";
import VirtualMediaTable from "./VirtualMediaTable";

type MediaResponse = {
  items: MediaItem[];
  page: number;
  pageSize: number;
  total: number | null;
  nextCursor: string | null;
};
type Props = { initial: MediaResponse; initialType?: string; initialQuery?: string };
type Sort = "added" | "release" | "title" | "viewer_rating" | "seasons" | "episodes";

const CATALOG_COLUMNS: MediaColumnKey[] = [
  "cover", "title", "type", "release_date", "country_of_origin", "creators", "genres", "tags",
  "media_status", "content_rating", "viewer_rating", "season_count", "episode_count", "platforms",
  "media_length", "description",
];

const SORT_KEYS: Partial<Record<MediaColumnKey, Sort>> = {
  title: "title", release_date: "release", viewer_rating: "viewer_rating",
  season_count: "seasons", episode_count: "episodes",
};

function appendUnique(current: MediaItem[], incoming: MediaItem[]) {
  const known = new Set(current.map((item) => item.id));
  return [...current, ...incoming.filter((item) => !known.has(item.id))];
}

export default function CatalogTable({ initial, initialType, initialQuery = "" }: Props) {
  const requestVersion = useRef(0);
  const membershipAvailable = useRef(true);
  const [items, setItems] = useState(initial.items);
  const [total, setTotal] = useState(initial.total ?? initial.items.length);
  const [nextCursor, setNextCursor] = useState(initial.nextCursor ?? null);
  const [filters, setFilters] = useState<MediaFilters>({
    ...EMPTY_MEDIA_FILTERS,
    q: initialQuery,
    types: initialType ? [initialType] : [],
  });
  const [searchDraft, setSearchDraft] = useState(initialQuery);
  const [visibleColumns, setVisibleColumns] = useState<MediaColumnKey[]>(["cover", "title", "type", "genres"]);
  const [sort, setSort] = useState<Sort>("title");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [pending, setPending] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set());
  const [authenticated, setAuthenticated] = useState(false);

  const loadMembership = useCallback(async (incoming: MediaItem[]) => {
    if (!membershipAvailable.current) return;
    const mediaIds = incoming.map((item) => item.id).filter((id) => /^[0-9a-f-]{36}$/i.test(id));
    if (!mediaIds.length) return;
    const response = await fetch(browserApiUrl("/list/membership"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaIds }),
    });
    if (!response.ok) {
      if (response.status === 401) membershipAvailable.current = false;
      return;
    }
    const data = (await response.json()) as { ids: string[] };
    setTrackedIds((current) => new Set([...current, ...data.ids]));
    setAuthenticated(true);
  }, []);

  useEffect(() => {
    if (!membershipAvailable.current) return;
    const mediaIds = initial.items.map((item) => item.id).filter((id) => /^[0-9a-f-]{36}$/i.test(id));
    if (!mediaIds.length) return;
    let cancelled = false;
    async function syncInitialMembership() {
      const response = await fetch(browserApiUrl("/list/membership"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaIds }),
      });
      if (!response.ok || cancelled) {
        if (response.status === 401) membershipAvailable.current = false;
        return;
      }
      const data = (await response.json()) as { ids: string[] };
      setTrackedIds(new Set(data.ids));
      setAuthenticated(true);
    }
    void syncInitialMembership();
    return () => { cancelled = true; };
  }, [initial.items]);

  async function load(
    reset: boolean,
    nextFilters = filters,
    nextSort = sort,
    nextDirection = direction,
    cursor = nextCursor
  ) {
    if (!reset && (!cursor || pending)) return;
    const version = reset ? ++requestVersion.current : requestVersion.current;
    setPending(true);
    const query = filtersToQuery(nextFilters);
    query.set("pageSize", "50");
    query.set("includeTotal", reset ? "true" : "false");
    query.set("sort", nextSort);
    query.set("direction", nextDirection);
    if (!reset && cursor) query.set("cursor", cursor);
    const response = await fetch(browserApiUrl(`/media?${query.toString()}`));
    if (response.ok && version === requestVersion.current) {
      const data = (await response.json()) as MediaResponse;
      setItems((current) => reset ? data.items : appendUnique(current, data.items));
      if (reset && data.total !== null) setTotal(data.total);
      setNextCursor(data.nextCursor);
      void loadMembership(data.items);
    }
    if (version === requestVersion.current) setPending(false);
  }

  function applyFilters(next: MediaFilters) {
    setFilters(next);
    void load(true, next);
  }

  function toggleColumn(key: MediaColumnKey) {
    setVisibleColumns((current) => {
      if (current.includes(key)) return current.length === 1 ? current : current.filter((column) => column !== key);
      return current.length >= 6 ? current : [...current, key];
    });
  }

  function changeSort(column: MediaColumnKey) {
    const nextSort = SORT_KEYS[column];
    if (!nextSort) return;
    const nextDirection = sort === nextSort && direction === "asc" ? "desc" : "asc";
    setSort(nextSort);
    setDirection(nextDirection);
    void load(true, filters, nextSort, nextDirection, null);
  }

  async function toggleTracked(mediaId: string) {
    setPendingId(mediaId);
    const tracked = trackedIds.has(mediaId);
    const response = await fetch(browserApiUrl(tracked ? `/list/${mediaId}` : "/list"), {
      method: tracked ? "DELETE" : "POST",
      credentials: "include",
      headers: tracked ? undefined : { "Content-Type": "application/json" },
      body: tracked ? undefined : JSON.stringify({ mediaId, status: "planned" }),
    });
    if (response.ok) {
      setTrackedIds((current) => {
        const next = new Set(current);
        if (tracked) next.delete(mediaId); else next.add(mediaId);
        return next;
      });
      setAuthenticated(true);
    }
    setPendingId(null);
  }

  return (
    <>
      <MediaTableControls
        filters={filters}
        onFiltersChange={applyFilters}
        columns={CATALOG_COLUMNS}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        maxColumns={6}
        searchDraft={searchDraft}
        onSearchDraftChange={setSearchDraft}
        onSearch={() => applyFilters({ ...filters, q: searchDraft })}
        searchPlaceholder="Search titles, genres, tags..."
      />
      <p className="result-count">{total.toLocaleString()} items</p>
      <VirtualMediaTable
        items={items}
        visibleColumns={visibleColumns}
        sort={sort}
        direction={direction}
        sortKeys={SORT_KEYS}
        onSort={changeSort}
        loadMore={() => void load(false)}
        loading={pending}
        hasMore={Boolean(nextCursor)}
        actionHeader="All Media"
        renderAction={(item) => !authenticated && !trackedIds.has(item.id)
          ? <Link className="action-button" href="/auth/login?next=%2Fcatalog">Sign in to add</Link>
          : <button
              className={trackedIds.has(item.id) ? "action-button action-button--danger" : "action-button"}
              type="button"
              disabled={pendingId === item.id}
              onClick={() => void toggleTracked(item.id)}
            >{trackedIds.has(item.id) ? "Remove" : "Add"}</button>}
      />
    </>
  );
}
