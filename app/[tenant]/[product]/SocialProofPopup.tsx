"use client";

import { useEffect, useState } from "react";

type Buyer = { name: string; createdAt: string };

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "baru saja";
  if (min < 60) return `${min} menit lalu`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} jam lalu`;
  return `${Math.floor(hour / 24)} hari lalu`;
}

export default function SocialProofPopup({ productId }: { productId: string }) {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch(`/api/public/products/${productId}/recent-buyers`)
      .then((r) => r.json())
      .then((data) => setBuyers(Array.isArray(data) ? data : []))
      .catch(() => setBuyers([]));
  }, [productId]);

  useEffect(() => {
    if (buyers.length === 0) return;

    let cycle: ReturnType<typeof setInterval>;
    const firstShow = setTimeout(() => {
      setVisible(true);
      cycle = setInterval(() => {
        setVisible(false);
        setTimeout(() => {
          setIndex((i) => (i + 1) % buyers.length); // looping balik ke awal
          setVisible(true);
        }, 400);
      }, 6000);
    }, 2000);

    return () => {
      clearTimeout(firstShow);
      if (cycle) clearInterval(cycle);
    };
  }, [buyers]);

  if (buyers.length === 0) return null;
  const current = buyers[index];

  return (
    <div className={`sp-toast ${visible ? "sp-toast-show" : ""}`}>
      🎉 <b>{current.name}</b> baru aja beli produk ini · {timeAgo(current.createdAt)}
    </div>
  );
}
