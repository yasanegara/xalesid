// Satu fungsi buat 2 penyedia AI beda, biar kode pemanggilnya gak perlu tau bedanya
// Sekarang juga ngembaliin berapa token yang beneran kepakai, buat dicatat ke kuota

type AIResult = { text: string; totalTokens: number };

export async function generateWithAI(provider: string, apiKey: string, prompt: string): Promise<AIResult> {
  if (provider === "openai") {
    return generateWithOpenAI(apiKey, prompt);
  }
  return generateWithAnthropic(apiKey, prompt);
}

async function generateWithAnthropic(apiKey: string, prompt: string): Promise<AIResult> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
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

async function generateWithOpenAI(apiKey: string, prompt: string): Promise<AIResult> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim() || "";
  const totalTokens = data.usage?.total_tokens || 0;
  return { text, totalTokens };
}
