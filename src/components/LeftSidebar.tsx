"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MEDIA_GROUPS } from "../lib/media-taxonomy";

export default function LeftSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showMediaTypes = pathname.startsWith("/catalog") || pathname.startsWith("/list");
  const activeType = useMemo(
    () => searchParams.get("type"),
    [searchParams]
  );
  const activeGroup = useMemo(
    () => MEDIA_GROUPS.find((group) => group.types.some((item) => item.value === activeType))?.key,
    [activeType]
  );
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(MEDIA_GROUPS.map((group) => group.key))
  );

  useEffect(() => {
    if (!activeGroup) return;
    const frame = window.requestAnimationFrame(() => {
      setOpenGroups((current) => {
        if (current.has(activeGroup)) return current;
        return new Set([...current, activeGroup]);
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeGroup]);

  function selectType(value: string | null) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set("type", value);
    else next.delete("type");
    const queryString = next.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }

  if (!showMediaTypes) {
    return (
      <div className="ad-slot">
        <Image
          src="/images/left-ad-placeholder.svg"
          alt="Left ad slot"
          width={300}
          height={600}
        />
      </div>
    );
  }

  return (
    <ul className="media-type-buttons" aria-label="Media type navigation">
      <li className="media-type-all">
        <button type="button" className={!activeType ? "active" : ""} onClick={() => selectType(null)} aria-pressed={!activeType}>All Media</button>
      </li>
      {MEDIA_GROUPS.map((group) => {
        const isOpen = openGroups.has(group.key);
        return (
          <li className="media-type-group" key={group.key}>
            <button
              type="button"
              className={`media-type-group__toggle${activeGroup === group.key ? " contains-active" : ""}`}
              aria-expanded={isOpen}
              aria-controls={`media-group-${group.key}`}
              onClick={() => setOpenGroups((current) => {
                const next = new Set(current);
                if (next.has(group.key)) next.delete(group.key);
                else next.add(group.key);
                return next;
              })}
            >
              <span>{group.label}</span>
              <span className="media-type-group__indicator" aria-hidden="true">{isOpen ? "-" : "+"}</span>
            </button>
            <ul id={`media-group-${group.key}`} className="media-type-subgroups" hidden={!isOpen}>
              {group.types.map((item) => (
                <li key={item.value}>
                  <button
                    type="button"
                    className={item.value === activeType ? "active" : ""}
                    onClick={() => selectType(item.value)}
                    aria-pressed={item.value === activeType}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}
