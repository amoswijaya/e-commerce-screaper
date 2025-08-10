export function firstPrice(text = "") {
  const s = text.replace(/\s/g, "");
  const m = s.match(/(?:US\$|\$|€|£)\s*([0-9]{1,6}(?:[.,][0-9]{2})?)/i);
  if (!m) return null;
  const num = parseFloat(m[1].replace(",", "."));
  return Number.isFinite(num) ? num : null;
}

export function guessDescription(text = "", max = 400) {
  if (!text) return "-";
  const low = text.toLowerCase();
  const idx = ["description", "about this item", "item specifics"]
    .map((k) => low.indexOf(k))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b)[0];
  const slice = idx >= 0 ? text.slice(idx, idx + 1200) : text.slice(0, 1200);
  return slice.replace(/\s+/g, " ").trim().slice(0, max) || "-";
}
