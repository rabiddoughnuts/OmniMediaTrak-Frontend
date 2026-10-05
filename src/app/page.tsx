import { serverApiUrl } from "../lib/api-url";

export const dynamic = "force-dynamic";

type MediaItem = {
  id: string;
  title: string;
  type: string;
  description?: string | null;
};

type MediaResponse = {
  items: MediaItem[];
};

async function fetchMediaItems(): Promise<MediaItem[]> {
  try {
    const response = await fetch(serverApiUrl("/media?page=1&pageSize=3"), {
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as MediaResponse;
    return Array.isArray(data.items) ? data.items.slice(0, 3) : [];
  } catch {
    return [];
  }
}

const PANEL_LABELS = ["Now tracking", "In progress", "Next up"];

export default async function HomePage() {
  const items = await fetchMediaItems();
  return (
    <section className="hero">
      <section className="hero__content">
        <p className="hero__eyebrow">Private alpha MVP</p>
        <h1 className="hero__title">OmniMediaTrak</h1>
        <p className="hero__subtitle">
          Track books, anime, games, and more in one place. Built for fast
          discovery and calm, focused lists.
        </p>
        <div className="hero__details">
          <h2 className="hero__section-title">What is OmniMediaTrak?</h2>
          <p className="hero__body">
            OmniMediaTrak was born out of my own mild descent into madness -- the kind
            you experience when you realize you need half a dozen different websites,
            three apps, and a notebook that you keep praying does not mysteriously
            vanish just to remember what media you are hoping to get to. I got tired
            of bouncing between anime trackers, book logs, movie lists, and whatever
            note keeping app I know I am not going to use consistently. Even within
            those solutions, you cannot compare show info without clicking into the
            media pages, so now I am clicking in and out of shows, trying to remember
            and compare my choices to figure out what to watch next. So I built the
            thing I always wished existed: one clean, unified place to track
            everything I watch, read, or play. No clutter, no digging through menus,
            no &quot;wait, which app did I put that in?&quot; moments. Just a straightforward,
            spreadsheet-style dashboard where your entire media life finally lives in
            one spot. The site is free, supported only by tiny, unobtrusive sidebar
            ads and an optional donate button to keep the servers alive. If you have
            ever felt the pain of trying to pick your next show and realizing the
            info you need is scattered across the internet like pirate loot, or that
            you need a million clicks and a properly working memory to compare the
            information you want, OmniMediaTrak might just save your sanity too.
          </p>
          <div className="hero__donate">
            <button className="button button--primary" type="button">
              Donate
            </button>
          </div>
        </div>
      </section>
      <section className="hero__panel">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={index === 0 ? "panel__card panel__card--accent" : "panel__card"}
          >
            <p className="panel__label">{PANEL_LABELS[index] ?? "On deck"}</p>
            <p className="panel__title">{item.title}</p>
            <p className="panel__meta">{item.type}</p>
          </div>
        ))}
      </section>
    </section>
  );
}
