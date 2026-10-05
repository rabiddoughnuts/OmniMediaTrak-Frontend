"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { browserApiUrl } from "../lib/api-url";
import type { FacetOption, MediaFacets, MediaFilters } from "../lib/media-fields";

type ArrayKey = "types" | "genres" | "tags" | "platforms" | "statuses" | "contentRatings" | "countries" | "lengths";
type FilterLayout = "overview" | "categories";
type CategoryKey = ArrayKey | "lengthRange" | "viewerRating" | "seasons" | "entries" | "release";

const LAYOUT_STORAGE_KEY = "omnimediatrak-filter-layout";
const FACET_CATEGORIES: Array<{ key: ArrayKey; label: string }> = [
  { key: "types", label: "Media type" },
  { key: "genres", label: "Genre" },
  { key: "tags", label: "Tag" },
  { key: "platforms", label: "Platform" },
  { key: "statuses", label: "Media status" },
  { key: "contentRatings", label: "Content rating" },
  { key: "countries", label: "Country" },
  { key: "lengths", label: "Length" },
];
const RANGE_CATEGORIES: Array<{ key: CategoryKey; label: string }> = [
  { key: "lengthRange", label: "Length range" },
  { key: "viewerRating", label: "Viewer rating" },
  { key: "seasons", label: "Seasons" },
  { key: "entries", label: "Entries" },
  { key: "release", label: "Release date" },
];
const ALL_CATEGORIES = [...FACET_CATEGORIES, ...RANGE_CATEGORIES];
const EMPTY_FACETS: MediaFacets = {
  types: [], genres: [], tags: [], platforms: [], statuses: [],
  contentRatings: [], countries: [], lengths: [], ranges: {},
};

function recordLayoutPreference(variant: FilterLayout) {
  void fetch(browserApiUrl("/support/filter-layout-preference"), {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ variant }),
  }).catch(() => undefined);
}

function toggleFacet(filters: MediaFilters, field: ArrayKey, value: string): MediaFilters {
  const selected = filters[field];
  return {
    ...filters,
    [field]: selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value],
  };
}

function FacetOptions({ field, options, filters, onChange }: {
  field: ArrayKey;
  options: FacetOption[];
  filters: MediaFilters;
  onChange: (filters: MediaFilters) => void;
}) {
  return (
    <div className="facet-options">
      {options.map((option) => (
        <label key={option.value}>
          <input
            type="checkbox"
            checked={filters[field].includes(option.value)}
            onChange={() => onChange(toggleFacet(filters, field, option.value))}
          />
          <span>{option.label}</span>
          <small>{option.count > 0 ? option.count : "Selected"}</small>
        </label>
      ))}
      {options.length === 0 && <span className="muted">No values available</span>}
    </div>
  );
}

function FacetGroup({ title, field, options, filters, onChange }: {
  title: string;
  field: ArrayKey;
  options: FacetOption[];
  filters: MediaFilters;
  onChange: (filters: MediaFilters) => void;
}) {
  return (
    <fieldset className="facet-group">
      <legend>{title}</legend>
      <FacetOptions field={field} options={options} filters={filters} onChange={onChange} />
    </fieldset>
  );
}

function NumericRange({ label, min, max, step = "1", upperLimit, onMin, onMax }: {
  label: string;
  min: string;
  max: string;
  step?: string;
  upperLimit?: string;
  onMin: (value: string) => void;
  onMax: (value: string) => void;
}) {
  return (
    <fieldset className="filter-range-group">
      <legend>{label}</legend>
      <div className="filter-range-fields">
        <label className="form-field">
          <span>At least (&gt;=)</span>
          <input className="input" type="number" min="0" max={upperLimit} step={step} value={min} onChange={(event) => onMin(event.target.value)} />
        </label>
        <label className="form-field">
          <span>At most (&lt;=)</span>
          <input className="input" type="number" min="0" max={upperLimit} step={step} value={max} onChange={(event) => onMax(event.target.value)} />
        </label>
      </div>
    </fieldset>
  );
}

function LengthRange({ filters, onChange }: {
  filters: MediaFilters;
  onChange: (filters: MediaFilters) => void;
}) {
  return (
    <fieldset className="filter-range-group">
      <legend>Length range</legend>
      <label className="form-field">
        <span>Measure</span>
        <select
          className="input"
          value={filters.lengthUnit}
          onChange={(event) => onChange({
            ...filters,
            lengthUnit: event.target.value as MediaFilters["lengthUnit"],
            lengthMin: "",
            lengthMax: "",
          })}
        >
          <option value="">Choose unit</option>
          <option value="duration_minutes">Runtime (minutes)</option>
          <option value="pages">Pages</option>
          <option value="words">Words</option>
          <option value="chapters">Chapters</option>
          <option value="issues">Issues</option>
          <option value="volumes">Volumes</option>
        </select>
      </label>
      <div className="filter-range-fields">
        <label className="form-field">
          <span>At least (&gt;=)</span>
          <input className="input" type="number" min="0" disabled={!filters.lengthUnit} value={filters.lengthMin} onChange={(event) => onChange({ ...filters, lengthMin: event.target.value })} />
        </label>
        <label className="form-field">
          <span>At most (&lt;=)</span>
          <input className="input" type="number" min="0" disabled={!filters.lengthUnit} value={filters.lengthMax} onChange={(event) => onChange({ ...filters, lengthMax: event.target.value })} />
        </label>
      </div>
    </fieldset>
  );
}

function ReleaseRange({ filters, onChange }: {
  filters: MediaFilters;
  onChange: (filters: MediaFilters) => void;
}) {
  return (
    <fieldset className="filter-range-group">
      <legend>Release date</legend>
      <div className="filter-range-fields">
        <label className="form-field">
          <span>On or after</span>
          <input className="input" type="date" value={filters.releaseFrom} onChange={(event) => onChange({ ...filters, releaseFrom: event.target.value })} />
        </label>
        <label className="form-field">
          <span>On or before</span>
          <input className="input" type="date" value={filters.releaseTo} onChange={(event) => onChange({ ...filters, releaseTo: event.target.value })} />
        </label>
      </div>
    </fieldset>
  );
}

function RangeCategory({ category, filters, onChange }: {
  category: CategoryKey;
  filters: MediaFilters;
  onChange: (filters: MediaFilters) => void;
}) {
  if (category === "lengthRange") return <LengthRange filters={filters} onChange={onChange} />;
  if (category === "viewerRating") {
    return <NumericRange label="Viewer rating" min={filters.viewerRatingMin} max={filters.viewerRatingMax} step="0.1" upperLimit="10" onMin={(value) => onChange({ ...filters, viewerRatingMin: value })} onMax={(value) => onChange({ ...filters, viewerRatingMax: value })} />;
  }
  if (category === "seasons") {
    return <NumericRange label="Seasons" min={filters.seasonsMin} max={filters.seasonsMax} onMin={(value) => onChange({ ...filters, seasonsMin: value })} onMax={(value) => onChange({ ...filters, seasonsMax: value })} />;
  }
  if (category === "entries") {
    return <NumericRange label="Entries" min={filters.episodesMin} max={filters.episodesMax} onMin={(value) => onChange({ ...filters, episodesMin: value })} onMax={(value) => onChange({ ...filters, episodesMax: value })} />;
  }
  return <ReleaseRange filters={filters} onChange={onChange} />;
}

export default function MediaFilterPanel({ filters, onChange, onClear }: {
  filters: MediaFilters;
  onChange: (filters: MediaFilters) => void;
  onClear: () => void;
}) {
  const [layout, setLayout] = useState<FilterLayout>("categories");
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [facets, setFacets] = useState<MediaFacets>(EMPTY_FACETS);
  const [facetSearch, setFacetSearch] = useState("");
  const [loadingFacet, setLoadingFacet] = useState<ArrayKey | "overview" | null>(null);

  const loadFacet = useCallback(async (field: ArrayKey, search = "") => {
    setLoadingFacet(field);
    const query = new URLSearchParams();
    if (search.trim()) query.set("q", search.trim());
    try {
      const response = await fetch(browserApiUrl(`/media/facets/${field}?${query.toString()}`));
      if (!response.ok) return;
      const data = (await response.json()) as { options: FacetOption[] };
      setFacets((current) => ({ ...current, [field]: data.options }));
    } finally {
      setLoadingFacet((current) => current === field ? null : current);
    }
  }, []);

  const loadOverview = useCallback(async () => {
    setLoadingFacet("overview");
    try {
      const response = await fetch(browserApiUrl("/media/facets"));
      if (!response.ok) return;
      setFacets((await response.json()) as MediaFacets);
    } finally {
      setLoadingFacet((current) => current === "overview" ? null : current);
    }
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    const frame = window.requestAnimationFrame(() => {
      const restored = stored === "overview" || stored === "categories" ? stored : "categories";
      setLayout(restored);
      if (restored === "overview") void loadOverview();
      recordLayoutPreference(restored);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loadOverview]);

  useEffect(() => {
    if (layout !== "categories" || category === null) return;
    const selected = FACET_CATEGORIES.find((item) => item.key === category);
    if (!selected) return;
    const timer = window.setTimeout(() => {
      void loadFacet(selected.key, facetSearch);
    }, facetSearch ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [category, facetSearch, layout, loadFacet]);

  function chooseLayout(next: FilterLayout) {
    setLayout(next);
    if (next === "categories") setCategory(null);
    if (next === "overview") void loadOverview();
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, next);
    recordLayoutPreference(next);
  }

  const selectedFacet = FACET_CATEGORIES.find((item) => item.key === category);
  const selectedOptions = useMemo(() => {
    if (!selectedFacet) return [];
    const options = facets[selectedFacet.key];
    const known = new Set(options.map((option) => option.value));
    return [
      ...filters[selectedFacet.key]
        .filter((value) => !known.has(value))
        .map((value) => ({ value, label: value, count: 0 })),
      ...options,
    ];
  }, [facets, filters, selectedFacet]);

  return (
    <div className="facet-panel">
      <div className="facet-panel__header">
        <strong>Filters</strong>
        <div className="segmented-control filter-layout-toggle" aria-label="Filter layout">
          <button type="button" className={layout === "overview" ? "active" : ""} aria-pressed={layout === "overview"} onClick={() => chooseLayout("overview")}>Overview</button>
          <button type="button" className={layout === "categories" ? "active" : ""} aria-pressed={layout === "categories"} onClick={() => chooseLayout("categories")}>Categories</button>
        </div>
        <button className="link-button" type="button" onClick={onClear}>Clear all</button>
      </div>

      {layout === "overview" ? (
        <>
          {loadingFacet === "overview" && <span className="muted">Loading filters...</span>}
          <div className="facet-grid">
            {FACET_CATEGORIES.map((item) => (
              <FacetGroup key={item.key} title={item.label} field={item.key} options={facets[item.key]} filters={filters} onChange={onChange} />
            ))}
          </div>
          <div className="range-grid">
            <LengthRange filters={filters} onChange={onChange} />
            <RangeCategory category="viewerRating" filters={filters} onChange={onChange} />
            <RangeCategory category="seasons" filters={filters} onChange={onChange} />
            <RangeCategory category="entries" filters={filters} onChange={onChange} />
            <ReleaseRange filters={filters} onChange={onChange} />
          </div>
        </>
      ) : (
        <div className={`category-filter${category === null ? " category-filter--collapsed" : ""}`}>
          <div className="category-filter__categories" role="tablist" aria-label="Filter categories">
            {ALL_CATEGORIES.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={category === item.key}
                className={category === item.key ? "active" : ""}
                onClick={() => {
                  setCategory(item.key);
                  setFacetSearch("");
                }}
              >
                <span>{item.label}</span>
                {item.key in filters && Array.isArray(filters[item.key as ArrayKey]) && filters[item.key as ArrayKey].length > 0 && (
                  <small>{filters[item.key as ArrayKey].length}</small>
                )}
              </button>
            ))}
          </div>
          {category !== null && (
            <div className="category-filter__values" role="tabpanel">
              {selectedFacet ? (
              <fieldset className="facet-group">
                <legend>{selectedFacet.label}</legend>
                <input
                  className="input facet-search"
                  type="search"
                  value={facetSearch}
                  onChange={(event) => setFacetSearch(event.target.value)}
                  placeholder={`Search ${selectedFacet.label.toLowerCase()}`}
                />
                {loadingFacet === selectedFacet.key
                  ? <span className="muted">Loading values...</span>
                  : <FacetOptions field={selectedFacet.key} options={selectedOptions} filters={filters} onChange={onChange} />}
              </fieldset>
              ) : (
                <RangeCategory category={category} filters={filters} onChange={onChange} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
