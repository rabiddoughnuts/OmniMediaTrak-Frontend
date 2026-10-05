export type MediaItem = {
  id: string;
  media_id?: string;
  title: string;
  type: string;
  release_date: string | null;
  country_of_origin: string | null;
  creators: string[] | null;
  genres: string[];
  tags: string[];
  platforms: string[];
  media_status: string | null;
  content_rating: string | null;
  viewer_rating: number | string | null;
  season_count: number | null;
  episode_count: number | null;
  media_length: string | null;
  cover_url?: string | null;
  description?: string | null;
  status?: string | null;
  progress?: number | null;
  rating?: number | null;
  notes?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
};

export type FacetOption = { value: string; label: string; count: number };
export type MediaFacets = {
  types: FacetOption[];
  genres: FacetOption[];
  tags: FacetOption[];
  platforms: FacetOption[];
  statuses: FacetOption[];
  contentRatings: FacetOption[];
  countries: FacetOption[];
  lengths: FacetOption[];
  ranges: Record<string, number | string | null>;
};

export type MediaFilters = {
  q: string;
  types: string[];
  genres: string[];
  tags: string[];
  platforms: string[];
  statuses: string[];
  contentRatings: string[];
  countries: string[];
  lengths: string[];
  lengthUnit: "" | "duration_minutes" | "pages" | "words" | "chapters" | "issues" | "volumes";
  lengthMin: string;
  lengthMax: string;
  viewerRatingMin: string;
  viewerRatingMax: string;
  seasonsMin: string;
  seasonsMax: string;
  episodesMin: string;
  episodesMax: string;
  releaseFrom: string;
  releaseTo: string;
};

export const EMPTY_MEDIA_FILTERS: MediaFilters = {
  q: "", types: [], genres: [], tags: [], platforms: [], statuses: [],
  contentRatings: [], countries: [], lengths: [], lengthUnit: "", lengthMin: "",
  lengthMax: "", viewerRatingMin: "",
  viewerRatingMax: "", seasonsMin: "", seasonsMax: "", episodesMin: "", episodesMax: "",
  releaseFrom: "", releaseTo: "",
};

export type MediaColumnKey =
  | "cover" | "title" | "type" | "release_date" | "country_of_origin" | "creators"
  | "genres" | "tags" | "media_status" | "content_rating" | "viewer_rating"
  | "season_count" | "episode_count" | "platforms" | "media_length" | "description"
  | "status" | "progress" | "rating" | "notes" | "started_at" | "completed_at";

export const MEDIA_COLUMN_LABELS: Record<MediaColumnKey, string> = {
  cover: "Cover", title: "Title", type: "Media Type", release_date: "Release Date",
  country_of_origin: "Country", creators: "Creators", genres: "Genres", tags: "Tags",
  media_status: "Media Status", content_rating: "Content Rating", viewer_rating: "Viewer Rating",
  season_count: "Seasons", episode_count: "Episodes", platforms: "Platforms",
  media_length: "Length", description: "Description", status: "Your Status",
  progress: "Progress", rating: "Your Rating", notes: "Notes", started_at: "Started",
  completed_at: "Completed",
};

export function mediaValue(item: MediaItem, key: MediaColumnKey) {
  const value = item[key as keyof MediaItem];
  if (Array.isArray(value)) return value.join(", ");
  return value === null || value === undefined ? "" : String(value);
}

export function filtersToQuery(filters: MediaFilters) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (Array.isArray(value)) {
      if (value.length) query.set(key, value.join(","));
    } else if (value.trim()) query.set(key, value.trim());
  }
  return query;
}

export function filtersToDefinition(filters: MediaFilters) {
  return {
    ...filters,
    q: filters.q || null,
    lengthUnit: filters.lengthUnit || null,
    lengthMin: filters.lengthMin ? Number(filters.lengthMin) : null,
    lengthMax: filters.lengthMax ? Number(filters.lengthMax) : null,
    viewerRatingMin: filters.viewerRatingMin ? Number(filters.viewerRatingMin) : null,
    viewerRatingMax: filters.viewerRatingMax ? Number(filters.viewerRatingMax) : null,
    seasonsMin: filters.seasonsMin ? Number(filters.seasonsMin) : null,
    seasonsMax: filters.seasonsMax ? Number(filters.seasonsMax) : null,
    episodesMin: filters.episodesMin ? Number(filters.episodesMin) : null,
    episodesMax: filters.episodesMax ? Number(filters.episodesMax) : null,
  };
}

type StoredMediaFilters = Partial<Record<keyof MediaFilters, string | string[] | number | null>>;

export function definitionToFilters(value?: StoredMediaFilters | null): MediaFilters {
  const result = { ...EMPTY_MEDIA_FILTERS };
  if (!value) return result;
  for (const key of Object.keys(result) as Array<keyof MediaFilters>) {
    const incoming = value[key];
    if (Array.isArray(result[key])) {
      (result[key] as string[]) = Array.isArray(incoming) ? incoming.map(String) : [];
    } else {
      (result[key] as string) = incoming === null || incoming === undefined ? "" : String(incoming);
    }
  }
  return result;
}
