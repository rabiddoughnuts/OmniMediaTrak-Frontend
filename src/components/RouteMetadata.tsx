"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function RouteMetadata() {
  const pathname = usePathname();
  useEffect(() => {
    document.body.dataset.page = pathname === "/" ? "home" : pathname.split("/").filter(Boolean)[0] ?? "home";
  }, [pathname]);
  return null;
}
