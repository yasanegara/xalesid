"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/track-client";

export default function PageViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    trackEvent("page_view", productId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null; // gak nampilin apa-apa, cuma buat efek sampingnya
}
