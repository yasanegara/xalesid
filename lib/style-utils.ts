export function darkenHex(hex: string, amount = 0.25): string {
  try {
    const clean = hex.replace("#", "");
    const num = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
    const r = Math.max(0, Math.floor(((num >> 16) & 0xff) * (1 - amount)));
    const g = Math.max(0, Math.floor(((num >> 8) & 0xff) * (1 - amount)));
    const b = Math.max(0, Math.floor((num & 0xff) * (1 - amount)));
    return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
  } catch {
    return "#b8860b";
  }
}

// Warna pucat-lembut dari warna utama, dasar buat background gaya Neumorphism
export function neuroBaseHex(hex: string): string {
  try {
    const clean = hex.replace("#", "");
    const num = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
    const r = (num >> 16) & 0xff;
    const g = (num >> 8) & 0xff;
    const b = num & 0xff;
    const mix = (c: number) => Math.round(c * 0.12 + 235 * 0.88); // dicampur 88% putih
    return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
  } catch {
    return "#eceef2";
  }
}

export function radiusForPreset(preset: string): string {
  if (preset === "minimal") return "6px";
  if (preset === "playful") return "24px";
  if (preset === "glass") return "18px";
  if (preset === "neuro") return "20px";
  return "4px"; // brutal / bold / default
}

const GOOGLE_FONT_MAP: Record<string, string> = {
  Poppins: "Poppins:wght@400;600;700;800;900",
  Inter: "Inter:wght@400;600;700;800;900",
  "Playfair Display": "Playfair+Display:wght@400;600;700;800;900",
  Nunito: "Nunito:wght@400;600;700;800;900",
};

export function googleFontHref(fontName: string | null): string | null {
  if (!fontName || fontName === "Plus Jakarta Sans") return null;
  const spec = GOOGLE_FONT_MAP[fontName];
  if (!spec) return null;
  return `https://fonts.googleapis.com/css2?family=${spec}&display=swap`;
}
