import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import MediaTrackingPanel from "../../../components/MediaTrackingPanel";
import { serverApiUrl } from "../../../lib/api-url";

type MediaDetail = {
  id: string;
  title: string;
  type: string;
  release_date: string | null;
  end_date: string | null;
  country_of_origin: string | null;
  language_code: string | null;
  cover_url: string | null;
  description: string | null;
  attributes: Record<string, unknown>;
  alternate_titles: Array<{ title: string; title_type: string; language_code: string | null }>;
  credits: Array<{ id: string; name: string; role: string }>;
  event: Record<string, unknown> | null;
  relationships: Array<{ media_id: string; title: string; type: string; relation_type: string; direction: string }>;
  sources: Array<{
    slug: string;
    provider: string;
    source_url: string | null;
    homepage_url: string | null;
    attribution_url: string | null;
    license_name: string | null;
    license_url: string | null;
  }>;
};

function displayValue(value: unknown) {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value ?? "");
}

export default async function MediaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await fetch(serverApiUrl(`/media/${encodeURIComponent(id)}`), {
    next: { revalidate: 60 },
  });
  if (!response.ok) notFound();
  const media = (await response.json()) as MediaDetail;
  const attributes = Object.entries(media.attributes ?? {}).filter(([, value]) => value !== null && value !== "" && (!Array.isArray(value) || value.length > 0));

  return (
    <section className="page media-detail">
      <nav className="breadcrumb"><Link href="/catalog">Catalog</Link><span>/</span><span>{media.title}</span></nav>
      <div className="media-detail__layout">
        <article className="media-detail__main">
          <header className="media-detail__header">
            <div className="media-detail__cover">
              <Image src={media.cover_url ?? "/images/cover-placeholder.svg"} alt={media.title} width={280} height={420} unoptimized className="media-detail__cover-image" />
            </div>
            <div>
              <p className="page__eyebrow">{media.type}</p>
              <h1 className="page__title">{media.title}</h1>
              <p className="media-detail__byline">{media.credits.map((credit) => credit.name).join(", ")}</p>
              <dl className="detail-facts">
                {media.release_date && <div><dt>Released</dt><dd>{media.release_date}</dd></div>}
                {media.end_date && <div><dt>Ended</dt><dd>{media.end_date}</dd></div>}
                {media.country_of_origin && <div><dt>Country</dt><dd>{media.country_of_origin}</dd></div>}
                {media.language_code && <div><dt>Language</dt><dd>{media.language_code}</dd></div>}
              </dl>
            </div>
          </header>

          {media.description && <section className="detail-section"><h2>Overview</h2><p>{media.description}</p></section>}
          {attributes.length > 0 && <section className="detail-section"><h2>Details</h2><dl className="detail-grid">{attributes.map(([key, value]) => <div key={key}><dt>{key.replaceAll("_", " ")}</dt><dd>{displayValue(value)}</dd></div>)}</dl></section>}
          {media.event && <section className="detail-section"><h2>Event</h2><dl className="detail-grid">{Object.entries(media.event).filter(([, value]) => value !== null).map(([key, value]) => <div key={key}><dt>{key.replaceAll("_", " ")}</dt><dd>{displayValue(value)}</dd></div>)}</dl></section>}
          {media.alternate_titles.length > 0 && <section className="detail-section"><h2>Alternate titles</h2><ul className="plain-list">{media.alternate_titles.map((title) => <li key={`${title.title_type}-${title.language_code}-${title.title}`}>{title.title}<span>{title.title_type}{title.language_code ? `, ${title.language_code}` : ""}</span></li>)}</ul></section>}
          {media.relationships.length > 0 && <section className="detail-section"><h2>Related media</h2><ul className="plain-list">{media.relationships.map((item) => <li key={`${item.media_id}-${item.relation_type}-${item.direction}`}><Link href={`/media/${item.media_id}`}>{item.title}</Link><span>{item.relation_type.replaceAll("_", " ")}</span></li>)}</ul></section>}
          {media.sources.length > 0 && <section className="detail-section"><h2>Sources</h2><ul className="source-tags">{media.sources.map((source, index) => {
            const href = source.source_url ?? source.attribution_url ?? source.homepage_url;
            return <li key={`${source.slug}-${source.source_url ?? index}`}>
              {href
                ? <a className="source-tag" href={href} target="_blank" rel="noreferrer"><span>{source.provider}</span>{source.license_name && <small>{source.license_name}</small>}</a>
                : <Link className="source-tag" href={`/sources#${source.slug}`}><span>{source.provider}</span>{source.license_name && <small>{source.license_name}</small>}</Link>}
            </li>;
          })}</ul><p className="source-note"><Link href="/sources">Source and license details</Link></p></section>}
        </article>
        <MediaTrackingPanel mediaId={media.id} />
      </div>
    </section>
  );
}
