import * as cheerio from "cheerio";

export function parseDetailUrls(html) {
  const $ = cheerio.load(html);
  const urls = new Set();

  $(
    ".su-card-container a.su-link[href], .su-card-container a.image-treatment[href]"
  ).each((_, el) => {
    const href = $(el).attr("href");
    if (href && /^https?:\/\//i.test(href)) urls.add(href);
  });

  $("li.s-item a.s-item__link[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (href && /^https?:\/\//i.test(href)) urls.add(href);
  });

  return Array.from(urls);
}
