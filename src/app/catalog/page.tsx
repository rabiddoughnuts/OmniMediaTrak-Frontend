import CatalogTable from "../../components/CatalogTable";
import { serverApiUrl } from "../../lib/api-url";
import type { MediaItem } from "../../lib/media-fields";

type MediaResponse = {
  items: MediaItem[];
  page: number;
  pageSize: number;
  total: number | null;
  nextCursor: string | null;
};

async function fetchCatalog(q: string, type: string): Promise<MediaResponse> {
  const query = new URLSearchParams({
    page: "1", pageSize: "50", includeTotal: "true", sort: "title", direction: "asc",
  });
  if (q) query.set("q", q);
  if (type) query.set("type", type);

  try {
    const response = await fetch(serverApiUrl(`/media?${query.toString()}`), {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Catalog request failed");
    return (await response.json()) as MediaResponse;
  } catch {
    return { items: [], page: 1, pageSize: 50, total: 0, nextCursor: null };
  }
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; type?: string }>;
}) {
  const resolved = (await searchParams) ?? {};
  const q = resolved.q?.trim() ?? "";
  const type = resolved.type?.trim() ?? "";
  const initial = await fetchCatalog(q, type);

  return (
    <section className="page catalog-page">
      <header className="page__header">
        <div><h1 className="page__title">Browse the catalog</h1></div>
      </header>
      <CatalogTable key={`${type}:${q}`} initial={initial} initialType={type} initialQuery={q} />
    </section>
  );
}
