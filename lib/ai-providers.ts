// Satu fungsi buat 2 penyedia AI beda, biar kode pemanggilnya gak perlu tau bedanya

export async function generateWithAI(provider: string, apiKey: string, prompt: string): Promise<string> {
  if (provider === "openai") {
    return generateWithOpenAI(apiKey, prompt);
  }
  // default: anthropic
  return generateWithAnthropic(apiKey, prompt);
}

async function generateWithAnthropic(apiKey: string, prompt: string): Promise<string> {
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
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.content?.[0]?.text?.trim() || "";
}

async function generateWithOpenAI(apiKey: string, prompt: string): Promise<string> {
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
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}
