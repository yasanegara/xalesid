export function darkenHex(hex: string, amount = 0.25): string {
  try {
    const clean = hex.replace("#", "");
    const num = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
    const r = Math.max(0, Math.floor(((num >> 16) & 0xff) * (1 - amount)));
    const g = Math.max(0, Math.floor(((num >> 8) & 0xff) * (1 - amount)));
    const b = Math.max(0, Math.floor((num & 0xff) * (1 - amount)));
    return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
  } catch {
    return "#b8860b"; // fallback ke warna default kalau hex-nya aneh
  }
}

export function radiusForPreset(preset: string): string {
  if (preset === "minimal") return "4px";
  if (preset === "playful") return "22px";
  return "10px"; // bold / default
}

const GOOGLE_FONT_MAP: Record<string, string> = {
  Poppins: "Poppins:wght@400;600;700;800;900",
  Inter: "Inter:wght@400;600;700;800;900",
  "Playfair Display": "Playfair+Display:wght@400;600;700;800;900",
  Nunito: "Nunito:wght@400;600;700;800;900",
};

export function googleFontHref(fontName: string | null): string | null {
  if (!fontName || fontName === "Plus Jakarta Sans") return null; // udah dimuat global
  const spec = GOOGLE_FONT_MAP[fontName];
  if (!spec) return null;
  return `https://fonts.googleapis.com/css2?family=${spec}&display=swap`;
}
