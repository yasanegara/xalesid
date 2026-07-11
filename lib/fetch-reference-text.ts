export async function fetchReferenceText(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal, headers: { "user-agent": "Mozilla/5.0" } });
    clearTimeout(timeout);
    if (!res.ok) return "";

    const html = await res.text();
    // Bersihin tag HTML kasar-kasaran, cukup buat ngasih AI gambaran gaya bahasanya
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return text.slice(0, 2000); // dibatasin biar prompt-nya gak kepanjangan
  } catch {
    return ""; // gagal ambil ya udah, lanjut generate tanpa referensi ini
  }
}
