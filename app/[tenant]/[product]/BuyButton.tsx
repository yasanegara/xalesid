"use client";

import { trackEvent } from "@/lib/track-client";

export default function BuyButton({ productId, href }: { productId: string; href: string }) {
  function handleClick() {
    trackEvent("cta_click", productId);
  }

  return (
    <a className="lp-btn" href={href} onClick={handleClick}>
      Beli sekarang →
    </a>
  );
}
