export function cleanText(input) {
  return String(input || '')
    .replace(/\s+/g, ' ')
    .trim();
}
