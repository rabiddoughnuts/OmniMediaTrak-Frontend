"use client";

import Image from "next/image";
import Link from "next/link";
import { forwardRef, type CSSProperties, type ReactNode } from "react";
import { TableVirtuoso, type TableComponents } from "react-virtuoso";
import {
  MEDIA_COLUMN_LABELS,
  mediaValue,
  type MediaColumnKey,
  type MediaItem,
} from "../lib/media-fields";

type Sort = "added" | "release" | "title" | "viewer_rating" | "seasons" | "episodes";

type ColumnLayout = { weight: number; minWidth: number };

const COLUMN_LAYOUTS: Record<MediaColumnKey, ColumnLayout> = {
  cover: { weight: 0.7, minWidth: 64 },
  title: { weight: 2.2, minWidth: 180 },
  type: { weight: 1.1, minWidth: 100 },
  release_date: { weight: 1.15, minWidth: 118 },
  country_of_origin: { weight: 0.9, minWidth: 90 },
  creators: { weight: 1.8, minWidth: 150 },
  genres: { weight: 1.8, minWidth: 150 },
  tags: { weight: 1.8, minWidth: 150 },
  media_status: { weight: 1.2, minWidth: 112 },
  content_rating: { weight: 1.15, minWidth: 110 },
  viewer_rating: { weight: 1, minWidth: 96 },
  season_count: { weight: 0.85, minWidth: 84 },
  episode_count: { weight: 0.9, minWidth: 88 },
  platforms: { weight: 1.7, minWidth: 145 },
  media_length: { weight: 1.2, minWidth: 112 },
  description: { weight: 3.4, minWidth: 280 },
  status: { weight: 1.2, minWidth: 112 },
  progress: { weight: 0.9, minWidth: 88 },
  rating: { weight: 0.9, minWidth: 88 },
  notes: { weight: 2.4, minWidth: 210 },
  started_at: { weight: 1.15, minWidth: 118 },
  completed_at: { weight: 1.15, minWidth: 118 },
};

const ACTION_LAYOUT: ColumnLayout = { weight: 1.5, minWidth: 134 };

type Props = {
  items: MediaItem[];
  visibleColumns: MediaColumnKey[];
  sort: Sort;
  direction: "asc" | "desc";
  sortKeys: Partial<Record<MediaColumnKey, Sort>>;
  onSort: (column: MediaColumnKey) => void;
  getId?: (item: MediaItem) => string;
  actionHeader?: string;
  renderAction?: (item: MediaItem) => ReactNode;
  loadMore: () => void;
  loading: boolean;
  hasMore: boolean;
  emptyMessage?: string;
  className?: string;
};

const VirtualScroller = forwardRef<HTMLDivElement>((props, ref) => (
  <div {...props} ref={ref} className="table-container virtual-table__scroller" />
));
VirtualScroller.displayName = "VirtualScroller";

const VirtualTableHead = forwardRef<HTMLTableSectionElement>((props, ref) => <thead {...props} ref={ref} />);
VirtualTableHead.displayName = "VirtualTableHead";

const VirtualTableBody = forwardRef<HTMLTableSectionElement>((props, ref) => <tbody {...props} ref={ref} />);
VirtualTableBody.displayName = "VirtualTableBody";

const tableComponents: TableComponents<MediaItem> = {
  Scroller: VirtualScroller,
  Table: (props) => <table {...props} className="media-table" />,
  TableHead: VirtualTableHead,
  TableRow: (props) => <tr {...props} />,
  TableBody: VirtualTableBody,
};

export default function VirtualMediaTable({
  items,
  visibleColumns,
  sort,
  direction,
  sortKeys,
  onSort,
  getId = (item) => item.id,
  actionHeader,
  renderAction,
  loadMore,
  loading,
  hasMore,
  emptyMessage = "No media matches these filters.",
  className = "",
}: Props) {
  const layouts = visibleColumns.map((column) => COLUMN_LAYOUTS[column]);
  const totalWeight = layouts.reduce((total, layout) => total + layout.weight, renderAction ? ACTION_LAYOUT.weight : 0);
  const unitMinimum = Math.max(
    ...layouts.map((layout) => layout.minWidth / layout.weight),
    renderAction ? ACTION_LAYOUT.minWidth / ACTION_LAYOUT.weight : 0
  );
  const tableMinWidth = Math.max(640, Math.ceil(totalWeight * unitMinimum));
  const widthFor = (layout: ColumnLayout) => ({ width: `${(layout.weight / totalWeight) * 100}%` });

  return (
    <div
      className={`virtual-table ${className}`}
      aria-busy={loading}
      style={{ "--media-table-min-width": `${tableMinWidth}px` } as CSSProperties}
    >
      <TableVirtuoso
        style={{ height: "100%" }}
        data={items}
        components={tableComponents}
        computeItemKey={(_, item) => getId(item)}
        increaseViewportBy={{ top: 500, bottom: 900 }}
        endReached={() => { if (hasMore && !loading) loadMore(); }}
        fixedHeaderContent={() => (
          <tr>
            {visibleColumns.map((column) => (
              <th key={column} style={widthFor(COLUMN_LAYOUTS[column])}>
                {sortKeys[column] ? (
                  <button type="button" className="table-sort" onClick={() => onSort(column)}>
                    {MEDIA_COLUMN_LABELS[column]}
                    {sort === sortKeys[column] ? (direction === "asc" ? " ^" : " v") : ""}
                  </button>
                ) : MEDIA_COLUMN_LABELS[column]}
              </th>
            ))}
            {renderAction && <th className="table-action" style={widthFor(ACTION_LAYOUT)}>{actionHeader}</th>}
          </tr>
        )}
        itemContent={(_, item) => (
          <>
            {visibleColumns.map((column) => (
              <td key={column} className={`media-cell media-cell--${column}`} style={widthFor(COLUMN_LAYOUTS[column])}>
                {column === "cover" ? (
                  <Image src={item.cover_url ?? "/images/cover-placeholder.svg"} alt="" width={54} height={81} unoptimized />
                ) : column === "title" ? (
                  <Link className="action-link" href={`/media/${getId(item)}`}>{item.title}</Link>
                ) : mediaValue(item, column) || <span className="muted">-</span>}
              </td>
            ))}
            {renderAction && <td className="table-action" style={widthFor(ACTION_LAYOUT)}>{renderAction(item)}</td>}
          </>
        )}
      />
      {(loading || (!hasMore && items.length === 0)) && (
        <div className="virtual-table__status" aria-live="polite">
          {loading ? "Loading more media..." : emptyMessage}
        </div>
      )}
    </div>
  );
}
