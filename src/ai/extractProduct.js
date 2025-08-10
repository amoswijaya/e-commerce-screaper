import { aiClient } from "./client.js";

function extractJson(text) {
  if (!text) return null;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export async function extractProductFromCleanText({
  cleanedText,
  url,
  pageTitle,
  metaDescription,
}) {
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";
  const MAX_INPUT = Number(process.env.AI_MAX_INPUT_CHARS || 8000);
  const contentText = (cleanedText || "").slice(0, MAX_INPUT);

  const system = [
    "You extract e-commerce product data from raw page text.",
    'Return STRICT JSON: { "name": string, "price": number|string, "description": string }.',
    "Rules:",
    '- If any field is unknown, set it to "-" (string).',
    '- For price: prefer the current/Buy It Now price. Parse numeric value if obvious (e.g., $114.80 => 114.80). If ambiguous, just return the price text (e.g., "$114.80").',
    "- For name: prefer the product/item title, not marketing copy.",
    "- For description: 1-3 sentences summarizing product features/specs (no boilerplate).",
  ].join("\n");

  const user = [
    `URL: ${url}`,
    `PAGE_TITLE: ${pageTitle || "-"}`,
    `META_DESCRIPTION: ${metaDescription || "-"}`,
    "",
    "CLEANED_PAGE_TEXT:",
    "-------------------",
    contentText,
  ].join("\n");

  const resp = await aiClient.chat.completions.create({
    model,
    temperature: 0,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const text = resp.choices?.[0]?.message?.content || "";
  const parsed = extractJson(text);
  if (parsed && typeof parsed === "object") return parsed;

  return {
    name: pageTitle || "-",
    price: "-",
    description: metaDescription || "-",
  };
}
