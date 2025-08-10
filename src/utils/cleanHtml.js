import * as cheerio from "cheerio";

export function htmlToCleanText(html, { maxChars = 30000 } = {}) {
  const $ = cheerio.load(html);

  $(
    "script,style,noscript,template,svg,iframe,link,meta,button,form,nav,header,footer,aside"
  ).remove();

  $("*")
    .contents()
    .each(function () {
      if (this.type === "comment") $(this).remove();
    });

  let text = $("body").text() || "";
  text = text.replace(/\s+/g, " ").trim();

  if (text.length > maxChars) text = text.slice(0, maxChars);
  return text;
}
