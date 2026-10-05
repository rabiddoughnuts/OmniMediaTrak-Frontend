"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import MediaFilterPanel from "../../components/MediaFilterPanel";
import MediaTableControls from "../../components/MediaTableControls";
import VirtualMediaTable from "../../components/VirtualMediaTable";
import { browserApiUrl } from "../../lib/api-url";
import {
  EMPTY_MEDIA_FILTERS,
  definitionToFilters,
  filtersToDefinition,
  filtersToQuery,
  type MediaColumnKey,
  type MediaFilters,
  type MediaItem,
} from "../../lib/media-fields";

type Operation = "intersection" | "left_difference" | "union" | "symmetric_difference";
type DynamicDefinition =
  | { mode: "filters"; filters: ReturnType<typeof filtersToDefinition> }
  | { mode: "lists"; leftListId: string; rightListId: string; operation: Operation };

type ListSummary = {
  id: string;
  name: string;
  description: string | null;
  kind: "tracking" | "static" | "dynamic";
  definition: DynamicDefinition | null;
  is_owner: boolean;
  owner_username: string;
  owner_display_name: string;
  item_count: number | null;
  share_count: number | null;
};

type ListResponse = {
  list: {
    id: string;
    name: string;
    list_kind: ListSummary["kind"];
    is_owner: boolean;
  };
  items: MediaItem[];
  page: number;
  pageSize: number;
  total: number;
  nextCursor: string | null;
};

type Person = {
  user_id: string;
  username: string;
  display_name: string;
  created_at?: string;
};

type Connections = {
  friends: Person[];
  incomingRequests: Person[];
  outgoingRequests: Person[];
  search: Person[];
};

type ListShare = Person & { permission: "viewer" };
type Panel = "new" | "edit" | "share" | null;
type Sort = "added" | "release" | "title" | "viewer_rating" | "seasons" | "episodes";

const LIST_COLUMNS: MediaColumnKey[] = [
  "cover", "title", "type", "release_date", "country_of_origin", "creators", "genres",
  "tags", "media_status", "content_rating", "viewer_rating", "season_count",
  "episode_count", "platforms", "media_length", "status", "progress", "rating",
  "notes", "started_at", "completed_at", "description",
];

const SORT_KEYS: Partial<Record<MediaColumnKey, Sort>> = {
  title: "title", release_date: "release", viewer_rating: "viewer_rating",
  season_count: "seasons", episode_count: "episodes",
};

const OPERATION_LABELS: Record<Operation, string> = {
  intersection: "Items in both lists",
  left_difference: "Items in the first list but not the second",
  union: "Items in either list",
  symmetric_difference: "Items found in only one list",
};

function mediaId(item: MediaItem) {
  return item.media_id ?? item.id;
}

function appendUnique(current: MediaItem[], incoming: MediaItem[]) {
  const known = new Set(current.map(mediaId));
  return [...current, ...incoming.filter((item) => !known.has(mediaId(item)))];
}

function errorMessage(value: unknown, fallback: string) {
  if (typeof value === "object" && value !== null && "error" in value) {
    return String((value as { error: unknown }).error);
  }
  return fallback;
}

function ListPageContent() {
  const searchParams = useSearchParams();
  const initialized = useRef(false);
  const listRequestVersion = useRef(0);
  const listCursorPending = useRef(false);
  const initialType = searchParams.get("type") ?? "";
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [listPending, setListPending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [panel, setPanel] = useState<Panel>(null);
  const [filters, setFilters] = useState<MediaFilters>({
    ...EMPTY_MEDIA_FILTERS,
    types: initialType ? [initialType] : [],
  });
  const [searchDraft, setSearchDraft] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<MediaColumnKey[]>([
    "cover", "title", "type", "genres", "status",
  ]);
  const [sort, setSort] = useState<Sort>("title");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");

  const [editorKind, setEditorKind] = useState<"static" | "dynamic">("static");
  const [editorName, setEditorName] = useState("");
  const [editorDescription, setEditorDescription] = useState("");
  const [dynamicMode, setDynamicMode] = useState<"filters" | "lists">("filters");
  const [dynamicFilters, setDynamicFilters] = useState<MediaFilters>({ ...EMPTY_MEDIA_FILTERS });
  const [leftListId, setLeftListId] = useState("");
  const [rightListId, setRightListId] = useState("");
  const [operation, setOperation] = useState<Operation>("intersection");
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [originalMediaIds, setOriginalMediaIds] = useState<Set<string>>(new Set());
  const [pickerItems, setPickerItems] = useState<MediaItem[]>([]);
  const [pickerNextCursor, setPickerNextCursor] = useState<string | null>(null);
  const [pickerPending, setPickerPending] = useState(false);
  const [pickerFilters, setPickerFilters] = useState<MediaFilters>({ ...EMPTY_MEDIA_FILTERS });
  const [pickerSearch, setPickerSearch] = useState("");
  const [showPickerFilters, setShowPickerFilters] = useState(false);
  const [saving, setSaving] = useState(false);

  const [shares, setShares] = useState<ListShare[]>([]);
  const [connections, setConnections] = useState<Connections>({
    friends: [], incomingRequests: [], outgoingRequests: [], search: [],
  });
  const [userSearch, setUserSearch] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [linkDays, setLinkDays] = useState("7");

  const selectedList = useMemo(
    () => lists.find((list) => list.id === selectedListId) ?? null,
    [lists, selectedListId]
  );
  const trackingList = useMemo(
    () => lists.find((list) => list.kind === "tracking" && list.is_owner) ?? null,
    [lists]
  );

  const loadList = useCallback(async (
    listId: string,
    _nextPage = 1,
    nextFilters: MediaFilters = filters,
    nextSort: Sort = sort,
    nextDirection: "asc" | "desc" = direction,
    cursor: string | null = null
  ) => {
    if (!listId) return;
    if (cursor && listCursorPending.current) return;
    const version = cursor ? listRequestVersion.current : ++listRequestVersion.current;
    if (cursor) listCursorPending.current = true;
    setListPending(true);
    if (!cursor) setStatus("loading");
    const query = filtersToQuery(nextFilters);
    query.set("pageSize", "50");
    query.set("sort", nextSort);
    query.set("direction", nextDirection);
    if (cursor) query.set("cursor", cursor);
    const response = await fetch(browserApiUrl(`/lists/${listId}/items?${query.toString()}`), {
      credentials: "include",
    });
    if (!response.ok) {
      if (version === listRequestVersion.current) {
        setStatus("error");
        setListPending(false);
      }
      listCursorPending.current = false;
      return;
    }
    const data = (await response.json()) as ListResponse;
    if (version !== listRequestVersion.current) return;
    setItems((current) => cursor ? appendUnique(current, data.items ?? []) : data.items ?? []);
    if (!cursor) setTotal(data.total ?? 0);
    setNextCursor(data.nextCursor ?? null);
    setStatus("ready");
    setListPending(false);
    listCursorPending.current = false;
  }, [direction, filters, sort]);

  const refreshLists = useCallback(async (preferredId?: string) => {
    const response = await fetch(browserApiUrl("/lists"), { credentials: "include" });
    if (!response.ok) {
      setStatus("error");
      return;
    }
    const data = (await response.json()) as { lists: ListSummary[] };
    const available = data.lists ?? [];
    setLists(available);
    const nextId = preferredId && available.some((list) => list.id === preferredId)
      ? preferredId
      : selectedListId && available.some((list) => list.id === selectedListId)
        ? selectedListId
        : available.find((list) => list.kind === "tracking" && list.is_owner)?.id ?? available[0]?.id ?? "";
    setSelectedListId(nextId);
    if (nextId) await loadList(nextId, 1);
    else setStatus("ready");
  }, [loadList, selectedListId]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    async function initialize() {
      await refreshLists();
    }
    void initialize();
  }, [refreshLists]);

  async function fetchEveryMediaId(listId: string) {
    const ids = new Set<string>();
    let cursor: string | null = null;
    do {
      const query = new URLSearchParams({ pageSize: "50", sort: "title", direction: "asc" });
      if (cursor) query.set("cursor", cursor);
      const response = await fetch(browserApiUrl(`/lists/${listId}/items?${query.toString()}`), { credentials: "include" });
      if (!response.ok) throw new Error("Unable to load collection membership");
      const data = (await response.json()) as ListResponse;
      data.items.forEach((item) => ids.add(mediaId(item)));
      cursor = data.nextCursor;
    } while (cursor);
    return ids;
  }

  async function loadPicker(_nextPage = 1, nextFilters = pickerFilters, kind = editorKind, cursor: string | null = null) {
    const source = kind === "static"
      ? trackingList && `/lists/${trackingList.id}/items`
      : "/media";
    if (!source) return;
    if (cursor && pickerPending) return;
    setPickerPending(true);
    const query = filtersToQuery(nextFilters);
    query.set("pageSize", "50");
    query.set("sort", "title");
    query.set("direction", "asc");
    query.set("includeTotal", "true");
    if (cursor) query.set("cursor", cursor);
    const response = await fetch(browserApiUrl(`${source}?${query.toString()}`), {
      credentials: "include",
    });
    if (!response.ok) {
      setPickerPending(false);
      return;
    }
    const data = (await response.json()) as ListResponse;
    setPickerItems((current) => cursor ? appendUnique(current, data.items ?? []) : data.items ?? []);
    setPickerNextCursor(data.nextCursor ?? null);
    setPickerPending(false);
  }

  function initializeDynamicDefinition(definition: DynamicDefinition | null) {
    if (definition?.mode === "lists") {
      setDynamicMode("lists");
      setLeftListId(definition.leftListId);
      setRightListId(definition.rightListId);
      setOperation(definition.operation);
      return;
    }
    setDynamicMode("filters");
    setDynamicFilters(definitionToFilters(definition?.mode === "filters" ? definition.filters : null));
  }

  async function openNew() {
    setPanel("new");
    setFeedback("");
    setEditorKind("static");
    setEditorName("");
    setEditorDescription("");
    setDynamicMode("filters");
    setDynamicFilters({ ...EMPTY_MEDIA_FILTERS });
    setSelectedMediaIds(new Set());
    setOriginalMediaIds(new Set());
    setPickerFilters({ ...EMPTY_MEDIA_FILTERS });
    setPickerSearch("");
    const first = selectedListId || lists[0]?.id || "";
    const second = lists.find((list) => list.id !== first)?.id ?? first;
    setLeftListId(first);
    setRightListId(second);
    await loadPicker(1, EMPTY_MEDIA_FILTERS, "static");
  }

  async function openEdit() {
    if (!selectedList?.is_owner) return;
    setPanel("edit");
    setFeedback("");
    setEditorName(selectedList.name);
    setEditorDescription(selectedList.description ?? "");
    setEditorKind(selectedList.kind === "dynamic" ? "dynamic" : "static");
    if (selectedList.kind === "dynamic") {
      initializeDynamicDefinition(selectedList.definition);
      return;
    }
    try {
      const ids = await fetchEveryMediaId(selectedList.id);
      setSelectedMediaIds(ids);
      setOriginalMediaIds(new Set(ids));
      setPickerFilters({ ...EMPTY_MEDIA_FILTERS });
      setPickerSearch("");
      await loadPicker(1, EMPTY_MEDIA_FILTERS, selectedList.kind === "tracking" ? "dynamic" : "static");
    } catch (error) {
      setFeedback(errorMessage(error, "Unable to open the collection editor"));
    }
  }

  function buildDefinition(): DynamicDefinition {
    if (dynamicMode === "lists") {
      return { mode: "lists", leftListId, rightListId, operation };
    }
    return { mode: "filters", filters: filtersToDefinition(dynamicFilters) };
  }

  async function saveEditor(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFeedback("");
    try {
      if (panel === "new") {
        const body = editorKind === "dynamic"
          ? { name: editorName, description: editorDescription || null, kind: "dynamic", definition: buildDefinition() }
          : { name: editorName, description: editorDescription || null, kind: "static" };
        const response = await fetch(browserApiUrl("/lists"), {
          method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await response.json() as { list?: { id: string }; error?: string };
        if (!response.ok || !data.list) throw new Error(data.error ?? "Unable to create collection");
        if (editorKind === "static" && selectedMediaIds.size) {
          const membershipResponse = await fetch(browserApiUrl(`/lists/${data.list.id}/items`), {
            method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mediaIds: [...selectedMediaIds] }),
          });
          if (!membershipResponse.ok) throw new Error("Collection created, but its media could not be saved");
        }
        setPanel(null);
        setFeedback("Collection created");
        await refreshLists(data.list.id);
        return;
      }

      if (!selectedList) return;
      if (selectedList.kind === "tracking") {
        const additions = [...selectedMediaIds].filter((id) => !originalMediaIds.has(id));
        const removals = [...originalMediaIds].filter((id) => !selectedMediaIds.has(id));
        for (const id of additions) {
          const response = await fetch(browserApiUrl("/list"), {
            method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mediaId: id, status: "planned" }),
          });
          if (!response.ok) throw new Error("Unable to add every selected item");
        }
        for (const id of removals) {
          const response = await fetch(browserApiUrl(`/list/${id}`), {
            method: "DELETE", credentials: "include",
          });
          if (!response.ok) throw new Error("Unable to remove every deselected item");
        }
      } else {
        const updateResponse = await fetch(browserApiUrl(`/lists/${selectedList.id}`), {
          method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editorName,
            description: editorDescription || null,
            ...(selectedList.kind === "dynamic" ? { definition: buildDefinition() } : {}),
          }),
        });
        const updateData = await updateResponse.json() as { error?: string };
        if (!updateResponse.ok) throw new Error(updateData.error ?? "Unable to update collection");
        if (selectedList.kind === "static") {
          const membershipResponse = await fetch(browserApiUrl(`/lists/${selectedList.id}/items`), {
            method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mediaIds: [...selectedMediaIds] }),
          });
          if (!membershipResponse.ok) throw new Error("Collection details saved, but membership was not");
        }
      }
      setPanel(null);
      setFeedback("Collection updated");
      await refreshLists(selectedList.id);
    } catch (error) {
      setFeedback(errorMessage(error, "Unable to save collection"));
    } finally {
      setSaving(false);
    }
  }

  async function deleteSelectedList() {
    if (!selectedList || selectedList.kind === "tracking") return;
    const response = await fetch(browserApiUrl(`/lists/${selectedList.id}`), {
      method: "DELETE", credentials: "include",
    });
    if (!response.ok) {
      setFeedback("Unable to delete collection");
      return;
    }
    setPanel(null);
    setFeedback("Collection deleted");
    setSelectedListId("");
    await refreshLists();
  }

  async function openShare() {
    if (!selectedList?.is_owner) return;
    setPanel("share");
    setFeedback("");
    setShareLink("");
    const [shareResponse, connectionResponse] = await Promise.all([
      fetch(browserApiUrl(`/lists/${selectedList.id}/shares`), { credentials: "include" }),
      fetch(browserApiUrl("/connections"), { credentials: "include" }),
    ]);
    if (shareResponse.ok) {
      const data = await shareResponse.json() as { shares: ListShare[] };
      setShares(data.shares ?? []);
    }
    if (connectionResponse.ok) setConnections(await connectionResponse.json() as Connections);
  }

  async function grantAccess(username: string) {
    if (!selectedList) return;
    const response = await fetch(browserApiUrl(`/lists/${selectedList.id}/shares`), {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await response.json() as { error?: string };
    setFeedback(response.ok ? `Shared with @${username}` : data.error ?? "Unable to share collection");
    if (response.ok) await openShare();
  }

  async function revokeAccess(userId: string) {
    if (!selectedList) return;
    const response = await fetch(browserApiUrl(`/lists/${selectedList.id}/shares/${userId}`), {
      method: "DELETE", credentials: "include",
    });
    if (response.ok) await openShare();
  }

  async function searchUsers(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch(browserApiUrl(`/connections?q=${encodeURIComponent(userSearch)}`), {
      credentials: "include",
    });
    if (response.ok) setConnections(await response.json() as Connections);
  }

  async function requestFriend(username: string) {
    const response = await fetch(browserApiUrl("/connections/requests"), {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    setFeedback(response.ok ? `Friend request sent to @${username}` : "Unable to send friend request");
    if (response.ok) await openShare();
  }

  async function acceptFriend(userId: string) {
    const response = await fetch(browserApiUrl(`/connections/requests/${userId}/accept`), {
      method: "POST", credentials: "include",
    });
    if (response.ok) await openShare();
  }

  async function createLink() {
    if (!selectedList) return;
    const response = await fetch(browserApiUrl(`/lists/${selectedList.id}/share-links`), {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiresInDays: Number(linkDays) }),
    });
    const data = await response.json() as { link?: { token: string }; error?: string };
    if (!response.ok || !data.link) {
      setFeedback(data.error ?? "Unable to create share link");
      return;
    }
    setShareLink(`${window.location.origin}/list/invite/${data.link.token}`);
  }

  function applyFilters(next: MediaFilters) {
    setFilters(next);
    void loadList(selectedListId, 1, next);
  }

  function changeSort(column: MediaColumnKey) {
    const nextSort = SORT_KEYS[column];
    if (!nextSort) return;
    const nextDirection = sort === nextSort && direction === "asc" ? "desc" : "asc";
    setSort(nextSort);
    setDirection(nextDirection);
    void loadList(selectedListId, 1, filters, nextSort, nextDirection);
  }

  function toggleColumn(column: MediaColumnKey) {
    setVisibleColumns((current) => {
      if (current.includes(column)) return current.length === 1 ? current : current.filter((value) => value !== column);
      return current.length >= 7 ? current : [...current, column];
    });
  }

  function selectMedia(id: string) {
    setSelectedMediaIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const canEdit = selectedList?.is_owner ?? false;

  return (
    <section className="page list-page">
      <header className="page__header">
        <div>
          <h1 className="page__title">Your collections</h1>
          {selectedList && !selectedList.is_owner && (
            <p className="page__subtitle">Shared by @{selectedList.owner_username}</p>
          )}
        </div>
      </header>

      <div className="list-toolbar">
        <label className="list-picker">
          <span>Collection</span>
          <select className="input" value={selectedListId} onChange={(event) => {
            const id = event.target.value;
            setSelectedListId(id);
            setPanel(null);
            void loadList(id, 1);
          }}>
            {lists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name}{list.is_owner ? "" : ` - @${list.owner_username}`}
              </option>
            ))}
          </select>
        </label>
        {selectedList && (
          <div className="list-toolbar__meta">
            <strong>{selectedList.kind === "tracking" ? "All tracked media" : selectedList.kind === "dynamic" ? "Dynamic collection" : "Static collection"}</strong>
            <span>{total.toLocaleString()} items</span>
          </div>
        )}
        <div className="list-toolbar__actions">
          <button className="list-toolbar__button" type="button" onClick={() => void openNew()}>New</button>
          <button className="list-toolbar__button" type="button" disabled={!canEdit} onClick={() => void openEdit()}>Edit</button>
          <button className="list-toolbar__button" type="button" disabled={!canEdit} onClick={() => void openShare()}>Share</button>
        </div>
      </div>

      {feedback && <p className="feedback-banner" role="status">{feedback}</p>}

      {(panel === "new" || panel === "edit") && (
        <form className="collection-editor" onSubmit={saveEditor}>
          <div className="panel-heading">
            <div>
              <h2>{panel === "new" ? "New collection" : `Edit ${selectedList?.name ?? "collection"}`}</h2>
              <p>{editorKind === "dynamic" ? "Membership updates automatically from its saved rules." : "Choose exact media for this collection."}</p>
            </div>
            <button className="link-button" type="button" onClick={() => setPanel(null)}>Close</button>
          </div>

          {panel === "new" && (
            <div className="segmented-control" aria-label="Collection type">
              <button type="button" className={editorKind === "static" ? "active" : ""} onClick={() => {
                setEditorKind("static");
                void loadPicker(1, pickerFilters, "static");
              }}>Static</button>
              <button type="button" className={editorKind === "dynamic" ? "active" : ""} onClick={() => setEditorKind("dynamic")}>Dynamic</button>
            </div>
          )}

          {selectedList?.kind !== "tracking" && (
            <div className="editor-fields">
              <label className="form-field"><span>Name</span><input className="input" required maxLength={80} value={editorName} onChange={(event) => setEditorName(event.target.value)} /></label>
              <label className="form-field"><span>Description</span><input className="input" maxLength={500} value={editorDescription} onChange={(event) => setEditorDescription(event.target.value)} /></label>
            </div>
          )}

          {editorKind === "dynamic" ? (
            <>
              <div className="segmented-control" aria-label="Dynamic collection rule">
                <button type="button" className={dynamicMode === "filters" ? "active" : ""} onClick={() => setDynamicMode("filters")}>Media filters</button>
                <button type="button" className={dynamicMode === "lists" ? "active" : ""} onClick={() => setDynamicMode("lists")}>Other collections</button>
              </div>
              {dynamicMode === "filters" ? (
                <div className="dynamic-filter-editor">
                  <label className="form-field">
                    <span>Search rule</span>
                    <input className="input" type="search" placeholder="Title, genre, tag, platform, or creator" value={dynamicFilters.q} onChange={(event) => setDynamicFilters({ ...dynamicFilters, q: event.target.value })} />
                  </label>
                  <MediaFilterPanel filters={dynamicFilters} onChange={setDynamicFilters} onClear={() => setDynamicFilters({ ...EMPTY_MEDIA_FILTERS })} />
                </div>
              ) : (
                <div className="set-rule-grid">
                  <label className="form-field"><span>First collection</span><select className="input" required value={leftListId} onChange={(event) => setLeftListId(event.target.value)}>{lists.filter((list) => list.id !== selectedList?.id).map((list) => <option key={list.id} value={list.id}>{list.name} - @{list.owner_username}</option>)}</select></label>
                  <label className="form-field"><span>Rule</span><select className="input" value={operation} onChange={(event) => setOperation(event.target.value as Operation)}>{Object.entries(OPERATION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                  <label className="form-field"><span>Second collection</span><select className="input" required value={rightListId} onChange={(event) => setRightListId(event.target.value)}>{lists.filter((list) => list.id !== selectedList?.id).map((list) => <option key={list.id} value={list.id}>{list.name} - @{list.owner_username}</option>)}</select></label>
                </div>
              )}
            </>
          ) : (
            <div className="membership-picker">
              <div className="picker-controls">
                <div className="picker-search">
                  <input type="search" placeholder="Search available media..." value={pickerSearch} onChange={(event) => setPickerSearch(event.target.value)} />
                  <button type="button" onClick={() => {
                  const next = { ...pickerFilters, q: pickerSearch };
                  setPickerFilters(next);
                  void loadPicker(1, next, selectedList?.kind === "tracking" ? "dynamic" : "static");
                  }}>Search</button>
                </div>
                <button type="button" onClick={() => setShowPickerFilters((value) => !value)}>Filters</button>
                <strong>{selectedMediaIds.size.toLocaleString()} selected</strong>
              </div>
              {showPickerFilters && (
                <MediaFilterPanel
                  filters={pickerFilters}
                  onChange={(next) => {
                    setPickerFilters(next);
                    void loadPicker(1, next, selectedList?.kind === "tracking" ? "dynamic" : "static");
                  }}
                  onClear={() => {
                    setPickerFilters({ ...EMPTY_MEDIA_FILTERS });
                    setPickerSearch("");
                    void loadPicker(1, EMPTY_MEDIA_FILTERS, selectedList?.kind === "tracking" ? "dynamic" : "static");
                  }}
                />
              )}
              <VirtualMediaTable
                className="membership-table"
                items={pickerItems}
                visibleColumns={["title", "type", "genres", "release_date"]}
                sort="title"
                direction="asc"
                sortKeys={{}}
                onSort={() => undefined}
                getId={mediaId}
                actionHeader="Select"
                renderAction={(item) => {
                  const id = mediaId(item);
                  return <input type="checkbox" aria-label={`Select ${item.title}`} checked={selectedMediaIds.has(id)} onChange={() => selectMedia(id)} />;
                }}
                loadMore={() => void loadPicker(1, pickerFilters, selectedList?.kind === "tracking" ? "dynamic" : "static", pickerNextCursor)}
                loading={pickerPending}
                hasMore={Boolean(pickerNextCursor)}
              />
            </div>
          )}

          <div className="form-actions">
            <button className="button button--primary" type="submit" disabled={saving}>{saving ? "Saving..." : panel === "new" ? "Create collection" : "Save changes"}</button>
            <button className="button button--ghost" type="button" onClick={() => setPanel(null)}>Cancel</button>
            {panel === "edit" && selectedList?.kind !== "tracking" && <button className="button button--danger" type="button" onClick={() => void deleteSelectedList()}>Delete collection</button>}
          </div>
        </form>
      )}

      {panel === "share" && selectedList && (
        <section className="share-panel">
          <div className="panel-heading">
            <div><h2>Share {selectedList.name}</h2><p>Grant view access directly or send a one-time acceptance link.</p></div>
            <button className="link-button" type="button" onClick={() => setPanel(null)}>Close</button>
          </div>
          <div className="share-grid">
            <section>
              <h3>Friends</h3>
              <ul className="people-list">
                {connections.friends.map((person) => <li key={person.user_id}><span><strong>{person.display_name}</strong><small>@{person.username}</small></span><button type="button" onClick={() => void grantAccess(person.username)}>Share</button></li>)}
                {connections.friends.length === 0 && <li className="muted">No friends added yet.</li>}
              </ul>
              {connections.incomingRequests.length > 0 && <><h3>Friend requests</h3><ul className="people-list">{connections.incomingRequests.map((person) => <li key={person.user_id}><span><strong>{person.display_name}</strong><small>@{person.username}</small></span><button type="button" onClick={() => void acceptFriend(person.user_id)}>Accept</button></li>)}</ul></>}
            </section>
            <section>
              <h3>Find a user</h3>
              <form className="inline-form" onSubmit={searchUsers}><input className="input" required placeholder="Username or display name" value={userSearch} onChange={(event) => setUserSearch(event.target.value)} /><button type="submit">Search</button></form>
              <ul className="people-list">
                {connections.search.map((person) => <li key={person.user_id}><span><strong>{person.display_name}</strong><small>@{person.username}</small></span><span className="row-actions"><button type="button" onClick={() => void grantAccess(person.username)}>Share</button><button type="button" onClick={() => void requestFriend(person.username)}>Add friend</button></span></li>)}
              </ul>
            </section>
            <section>
              <h3>Acceptance link</h3>
              <div className="inline-form"><label><span>Expires</span><select className="input" value={linkDays} onChange={(event) => setLinkDays(event.target.value)}><option value="1">1 day</option><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></select></label><button type="button" onClick={() => void createLink()}>Generate link</button></div>
              {shareLink && <div className="share-link-output"><input className="input" readOnly value={shareLink} /><button type="button" onClick={() => void navigator.clipboard.writeText(shareLink)}>Copy</button></div>}
            </section>
            <section>
              <h3>People with access</h3>
              <ul className="people-list">
                {shares.map((share) => <li key={share.user_id}><span><strong>{share.display_name}</strong><small>@{share.username}</small></span><button type="button" onClick={() => void revokeAccess(share.user_id)}>Remove</button></li>)}
                {shares.length === 0 && <li className="muted">Only you can view this collection.</li>}
              </ul>
            </section>
          </div>
        </section>
      )}

      <MediaTableControls
        filters={filters}
        onFiltersChange={applyFilters}
        columns={LIST_COLUMNS}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        maxColumns={7}
        searchDraft={searchDraft}
        onSearchDraftChange={setSearchDraft}
        onSearch={() => applyFilters({ ...filters, q: searchDraft })}
        searchPlaceholder="Search this collection..."
      />

      {status === "error" ? (
        <div className="empty-state"><h2>Sign in to use collections</h2><p>Your All Media list, static collections, dynamic collections, and shared lists appear here.</p><Link className="button button--primary" href="/auth/login?next=%2Flist">Sign in</Link></div>
      ) : (
        <>
          <VirtualMediaTable
            items={items}
            visibleColumns={visibleColumns}
            sort={sort}
            direction={direction}
            sortKeys={SORT_KEYS}
            onSort={changeSort}
            getId={mediaId}
            loadMore={() => void loadList(selectedListId, 1, filters, sort, direction, nextCursor)}
            loading={listPending}
            hasMore={Boolean(nextCursor)}
          />
        </>
      )}
    </section>
  );
}

function KeyedListPage() {
  const type = useSearchParams().get("type") ?? "";
  return <ListPageContent key={type} />;
}

export default function ListPage() {
  return <Suspense fallback={<section className="page"><p>Loading collections...</p></section>}><KeyedListPage /></Suspense>;
}
