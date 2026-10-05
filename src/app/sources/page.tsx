import Link from "next/link";
import { serverApiUrl } from "../../lib/api-url";

export const dynamic = "force-dynamic";

type PublicSource = {
  slug: string;
  display_name: string;
  homepage_url: string | null;
  attribution_text: string | null;
  attribution_url: string | null;
  license_name: string | null;
  license_url: string | null;
  terms_url: string | null;
  media_count: number;
};

export default async function SourcesPage() {
  const response = await fetch(serverApiUrl("/sources"), {
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error("Unable to load public source information");
  const { sources } = (await response.json()) as { sources: PublicSource[] };

  return (
    <section className="page page--scroll source-directory">
      <nav className="breadcrumb"><Link href="/">Home</Link><span>/</span><span>Sources</span></nav>
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Catalog provenance</p>
          <h1 className="page__title">Sources</h1>
          <p className="page__subtitle">Data providers currently represented in the public catalog.</p>
        </div>
      </header>

      <div className="source-directory__list">
        {sources.map((source) => (
          <article id={source.slug} className="source-directory__item" key={source.slug}>
            <div className="source-directory__heading">
              <h2>{source.display_name}</h2>
              <span>{source.media_count.toLocaleString()} media records</span>
            </div>
            {source.attribution_text && <p>{source.attribution_text}</p>}
            <p className="source-directory__links">
              {(source.attribution_url ?? source.homepage_url) && <a href={source.attribution_url ?? source.homepage_url ?? "#"} target="_blank" rel="noreferrer">Source</a>}
              {source.license_url && <a href={source.license_url} target="_blank" rel="noreferrer">{source.license_name ?? "License"}</a>}
              {source.terms_url && <a href={source.terms_url} target="_blank" rel="noreferrer">Terms</a>}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
