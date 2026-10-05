"use client";

import { useEffect, useRef, useState } from "react";
import {
  EMPTY_MEDIA_FILTERS,
  MEDIA_COLUMN_LABELS,
  type MediaColumnKey,
  type MediaFilters,
} from "../lib/media-fields";
import MediaFilterPanel from "./MediaFilterPanel";

type Props = {
  filters: MediaFilters;
  onFiltersChange: (filters: MediaFilters) => void;
  columns: MediaColumnKey[];
  visibleColumns: MediaColumnKey[];
  onToggleColumn: (column: MediaColumnKey) => void;
  maxColumns: number;
  searchDraft: string;
  onSearchDraftChange: (value: string) => void;
  onSearch: () => void;
  searchPlaceholder: string;
};

const FILTER_LABELS: Record<Exclude<keyof MediaFilters, "q">, string> = {
  types: "Type",
  genres: "Genre",
  tags: "Tag",
  platforms: "Platform",
  statuses: "Status",
  contentRatings: "Content rating",
  countries: "Country",
  lengths: "Length",
  lengthUnit: "Length measure",
  lengthMin: "Minimum length",
  lengthMax: "Maximum length",
  viewerRatingMin: "Minimum viewer rating",
  viewerRatingMax: "Maximum viewer rating",
  seasonsMin: "Minimum seasons",
  seasonsMax: "Maximum seasons",
  episodesMin: "Minimum entries",
  episodesMax: "Maximum entries",
  releaseFrom: "Released after",
  releaseTo: "Released before",
};

type FilterChip = { key: Exclude<keyof MediaFilters, "q">; value: string; label: string };

const LENGTH_UNIT_LABELS: Record<MediaFilters["lengthUnit"], string> = {
  "": "",
  duration_minutes: "Runtime (minutes)",
  pages: "Pages",
  words: "Words",
  chapters: "Chapters",
  issues: "Issues",
  volumes: "Volumes",
};

function filterChips(filters: MediaFilters): FilterChip[] {
  const chips: FilterChip[] = [];
  for (const key of Object.keys(FILTER_LABELS) as Array<Exclude<keyof MediaFilters, "q">>) {
    const value = filters[key];
    if (Array.isArray(value)) {
      value.forEach((entry) => chips.push({ key, value: entry, label: `${FILTER_LABELS[key]}: ${entry}` }));
    } else if (value.trim()) {
      const displayedValue = key === "lengthUnit" ? LENGTH_UNIT_LABELS[value as MediaFilters["lengthUnit"]] : value;
      chips.push({ key, value, label: `${FILTER_LABELS[key]}: ${displayedValue}` });
    }
  }
  return chips;
}

export default function MediaTableControls({
  filters,
  onFiltersChange,
  columns,
  visibleColumns,
  onToggleColumn,
  maxColumns,
  searchDraft,
  onSearchDraftChange,
  onSearch,
  searchPlaceholder,
}: Props) {
  const controlsRef = useRef<HTMLDivElement | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const chips = filterChips(filters);

  useEffect(() => {
    function closeMenus(event: MouseEvent) {
      if (controlsRef.current && !controlsRef.current.contains(event.target as Node)) {
        setShowFilters(false);
        setShowColumns(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowFilters(false);
        setShowColumns(false);
      }
    }
    document.addEventListener("click", closeMenus);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("click", closeMenus);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function removeChip(chip: FilterChip) {
    const current = filters[chip.key];
    if (chip.key === "lengthUnit") {
      onFiltersChange({ ...filters, lengthUnit: "", lengthMin: "", lengthMax: "" });
      return;
    }
    onFiltersChange({
      ...filters,
      [chip.key]: Array.isArray(current) ? current.filter((value) => value !== chip.value) : "",
    });
  }

  return (
    <div ref={controlsRef} className="controls-bar media-table-controls">
      <div className="control-group filter-group">
        <div className="filter-dropdown">
          <button type="button" aria-expanded={showFilters} onClick={() => {
            setShowFilters((value) => !value);
            setShowColumns(false);
          }}>Filters{chips.length ? ` (${chips.length})` : ""}</button>
          {showFilters && (
            <div className="filter-menu catalog-filter-menu">
              <MediaFilterPanel
                filters={filters}
                onChange={onFiltersChange}
                onClear={() => onFiltersChange({ ...EMPTY_MEDIA_FILTERS, q: filters.q })}
              />
            </div>
          )}
        </div>
      </div>

      <div className="control-group media-table-controls__columns">
        <div className="columns-dropdown">
          <button type="button" aria-expanded={showColumns} onClick={() => {
            setShowColumns((value) => !value);
            setShowFilters(false);
          }}>Columns</button>
          <div className="columns-menu" hidden={!showColumns}>
            <div className="columns-options">
              {columns.map((key) => (
                <label key={key}>
                  <input type="checkbox" checked={visibleColumns.includes(key)} onChange={() => onToggleColumn(key)} />
                  {MEDIA_COLUMN_LABELS[key]}
                </label>
              ))}
            </div>
            <p className="columns-hint">Select up to {maxColumns} columns.</p>
          </div>
        </div>
      </div>

      <form className="control-group media-table-controls__search" onSubmit={(event) => {
        event.preventDefault();
        onSearch();
      }}>
        <input
          type="search"
          placeholder={searchPlaceholder}
          value={searchDraft}
          onChange={(event) => onSearchDraftChange(event.target.value)}
        />
      </form>

      {chips.length > 0 && (
        <div className="active-filter-chips" aria-label="Selected filters">
          {chips.map((chip) => (
            <button key={`${chip.key}-${chip.value}`} type="button" onClick={() => removeChip(chip)}>
              <span>{chip.label}</span><span aria-hidden="true">x</span>
            </button>
          ))}
          <button className="link-button" type="button" onClick={() => onFiltersChange({ ...EMPTY_MEDIA_FILTERS, q: filters.q })}>Clear all</button>
        </div>
      )}
    </div>
  );
}
