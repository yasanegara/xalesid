// Satu fungsi buat beberapa penyedia AI beda, biar kode pemanggilnya gak perlu tau bedanya
// Sekarang juga ngembaliin berapa token yang beneran kepakai, dan bisa terima gambar referensi

type AIResult = { text: string; totalTokens: number };

export async function generateWithAI(
  provider: string,
  apiKey: string,
  prompt: string,
  model?: string,
  maxTokens = 400,
  imageUrl?: string
): Promise<AIResult> {
  if (provider === "openai") {
    return generateWithOpenAICompatible(apiKey, prompt, "https://api.openai.com/v1/chat/completions", "gpt-4o-mini", maxTokens, imageUrl);
  }
  if (provider === "sumopod") {
    return generateWithOpenAICompatible(apiKey, prompt, "https://ai.sumopod.com/v1/chat/completions", model || "claude-sonnet-4-6", maxTokens, imageUrl);
  }
  return generateWithAnthropic(apiKey, prompt, maxTokens, imageUrl);
}

async function generateWithAnthropic(apiKey: string, prompt: string, maxTokens: number, imageUrl?: string): Promise<AIResult> {
  const content: any[] = [];

  if (imageUrl) {
    try {
      if (imageUrl.startsWith("data:")) {
        // Ini dari upload file — udah base64, tinggal dibongkar, gak perlu fetch
        const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          content.push({ type: "image", source: { type: "base64", media_type: match[1], data: match[2] } });
        }
      } else {
        // Ini link biasa — ambil dulu isinya, baru diubah ke base64
        const imgRes = await fetch(imageUrl);
        const buffer = await imgRes.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const mediaType = imgRes.headers.get("content-type") || "image/jpeg";
        content.push({ type: "image", source: { type: "base64", media_type: mediaType, data: base64 } });
      }
    } catch {
      // Kalau gambar gagal diproses, lanjut tanpa gambar aja, jangan gagalin semuanya
    }
  }
  content.push({ type: "text", text: prompt });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      messages: [{ role: "user", content }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const text = data.content?.[0]?.text?.trim() || "";
  const totalTokens = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
  return { text, totalTokens };
}

// Dipakai bareng buat OpenAI DAN Sumopod, soalnya formatnya sama-sama "OpenAI-compatible"
async function generateWithOpenAICompatible(
  apiKey: string,
  prompt: string,
  endpoint: string,
  model: string,
  maxTokens: number,
  imageUrl?: string
): Promise<AIResult> {
  const content: any[] = [{ type: "text", text: prompt }];
  if (imageUrl) {
    content.push({ type: "image_url", image_url: { url: imageUrl } });
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: imageUrl ? content : prompt }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI API error (${res.status}): ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim() || "";
  const totalTokens = data.usage?.total_tokens || 0;
  return { text, totalTokens };
}
