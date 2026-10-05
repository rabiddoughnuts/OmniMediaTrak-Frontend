export type MediaTypeOption = {
  label: string;
  value: string;
};

export type MediaGroup = {
  key: string;
  label: string;
  types: MediaTypeOption[];
};

export const MEDIA_GROUPS: MediaGroup[] = [
  {
    key: "video",
    label: "Video Media",
    types: [
      { label: "Shows", value: "show" },
      { label: "Anime", value: "anime" },
      { label: "Webseries/YT", value: "webseries" },
      { label: "Movies", value: "movie" },
    ],
  },
  {
    key: "read",
    label: "Read Media",
    types: [
      { label: "Books", value: "book" },
      { label: "Light Novels", value: "lightnovel" },
      { label: "Web Novels", value: "webnovel" },
    ],
  },
  {
    key: "sequential-art",
    label: "Sequential Art",
    types: [
      { label: "Manga", value: "manga" },
      { label: "Comics", value: "comic" },
      { label: "Webtoons", value: "webtoon" },
    ],
  },
  {
    key: "interactive",
    label: "Interactive Media",
    types: [
      { label: "Games", value: "game" },
      { label: "Visual Novels", value: "visualnovel" },
    ],
  },
  {
    key: "audio",
    label: "Audio Media",
    types: [
      { label: "Podcasts", value: "podcast" },
      { label: "Music", value: "music" },
      { label: "Audiobooks", value: "audiobook" },
    ],
  },
  {
    key: "live",
    label: "Live Events",
    types: [{ label: "Live Events", value: "liveevent" }],
  },
];
