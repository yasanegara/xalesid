import type { ReactNode } from "react";

export const metadata = {
  title: "xales.id",
  description: "Jualan produk digital & fisik, tanpa ribet.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
