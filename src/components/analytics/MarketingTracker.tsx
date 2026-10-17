"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { startSession } from "@/lib/tracking";
import { track } from "@/services/analytics";

/** Counts visits to the marketing landing and sign-up pages. Renders nothing. */
export default function MarketingTracker() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);
  useEffect(() => {
    if (pathname !== "/" && pathname !== "/get-started") return;
    if (last.current === pathname) return;
    last.current = pathname;
    startSession("platform");
    track("platform", { type: "page", page: pathname });
  }, [pathname]);
  return null;
}
