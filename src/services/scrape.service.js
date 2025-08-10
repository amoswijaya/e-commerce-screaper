import {
  openBrowser,
  closeBrowser,
  createPagePool,
  destroyPagePool,
  newPage,
  setInterception,
} from "../scrapers/browser.js";
import { getListPageHTML, bumpToNextPage } from "../scrapers/listPage.js";
import { getDetailRawWithPage } from "../scrapers/detailPage.js";
import { parseDetailUrls } from "../parsers/list.parser.js";
import { extractProductFromCleanText } from "../ai/extractProduct.js";
import { logger } from "../utils/logger.js";
import { firstPrice, guessDescription } from "../utils/extractors.js";

export async function scrapeService({ startUrl, maxPages = 1, limit = 20 }) {
  await openBrowser();

  const items = [];
  let pagesCrawled = 0;
  let url = startUrl;

  const listPage = await newPage({ block: true });

  try {
    logger.info("Warm-up session (allow all resources) …");
    await setInterception(listPage, { enabled: false });
    await listPage.goto(startUrl, {
      waitUntil: "networkidle2",
      timeout: 60_000,
    });
    await listPage
      .waitForFunction(
        () =>
          !/Pardon Our Interruption/i.test(
            document.title || document.body?.innerText || ""
          ),
        { timeout: 15000 }
      )
      .catch(() => {});
    await setInterception(listPage, { enabled: true });
    logger.info("Warm-up done.");
  } catch (e) {
    logger.warn("Warm-up skipped", e?.message || String(e));
  }

  const CONCURRENCY = Number(process.env.CONCURRENCY || 4);
  const pool = await createPagePool(CONCURRENCY);

  logger.info("Scrape start", {
    startUrl,
    maxPages,
    limit,
    concurrency: CONCURRENCY,
  });

  try {
    for (let p = 1; p <= maxPages; p++) {
      const t0 = Date.now();
      const html = await getListPageHTML(url, listPage);
      const listMs = Date.now() - t0;

      let detailUrls = parseDetailUrls(html);
      logger.info("List parsed", {
        page: p,
        listMs: `${listMs}ms`,
        urls: detailUrls.length,
      });

      if (!detailUrls.length) {
        logger.warn("No detail URLs found; stopping pagination", {
          page: p,
          url,
        });
        break;
      }

      pagesCrawled++;

      if (items.length + detailUrls.length > limit) {
        detailUrls = detailUrls.slice(0, limit - items.length);
      }

      let cursor = 0;
      const perPageResults = await Promise.all(
        pool.map(async (page, workerIndex) => {
          const results = new Array(detailUrls.length);
          while (true) {
            const idx = cursor++;
            if (idx >= detailUrls.length) break;
            const detailUrl = detailUrls[idx];

            try {
              const tFetch = Date.now();
              const { cleanedText, pageTitle, metaDescription, _meta } =
                await getDetailRawWithPage(page, detailUrl);
              const fetchMs = Date.now() - tFetch;

              logger.debug("detail.meta", {
                url: detailUrl,
                worker: workerIndex,
                cleanedLen: _meta.cleanedLen,
                hasIframeDesc: _meta.hasIframeDesc,
                hasTitle: _meta.hasTitle,
                hasMetaDesc: _meta.hasMetaDesc,
                fetchMs: `${fetchMs}ms`,
              });

              const tAI = Date.now();
              let normalized = await extractProductFromCleanText({
                cleanedText,
                pageTitle,
                metaDescription,
                url: detailUrl,
              });
              const aiMs = Date.now() - tAI;

              const before = { ...normalized };
              if (!normalized?.name || normalized.name === "-") {
                normalized.name = pageTitle !== "-" ? pageTitle : "-";
              }
              if (!normalized?.price || normalized.price === "-") {
                const pNum = firstPrice(cleanedText);
                if (pNum != null) normalized.price = pNum;
              }
              if (!normalized?.description || normalized.description === "-") {
                const d = guessDescription(cleanedText);
                if (d && d !== "-") normalized.description = d;
              }

              const reasons = [];
              if (before.name === "-" && normalized.name !== "-")
                reasons.push("fallback:name=title");
              if (before.price === "-" && normalized.price !== "-")
                reasons.push("fallback:price=regex");
              if (before.description === "-" && normalized.description !== "-")
                reasons.push("fallback:desc=guess");
              if (reasons.length)
                logger.debug("fallbacks.used", { url: detailUrl, reasons });

              const item = {
                name: normalized?.name || pageTitle || "-",
                price:
                  normalized?.price === 0 || normalized?.price
                    ? normalized.price
                    : "-",
                description: normalized?.description || metaDescription || "-",
                link: detailUrl || "-",
              };

              for (const k of ["name", "price", "description", "link"]) {
                if (item[k] == null || item[k] === "") item[k] = "-";
              }

              if (
                item.name === "-" ||
                item.price === "-" ||
                item.description === "-"
              ) {
                logger.warn("incomplete.item", {
                  url: detailUrl,
                  nameEmpty: item.name === "-",
                  priceEmpty: item.price === "-",
                  descEmpty: item.description === "-",
                  cleanedLen: _meta.cleanedLen,
                  aiMs: `${aiMs}ms`,
                });
              } else {
                logger.debug("item.ok", {
                  url: detailUrl,
                  name: String(item.name).slice(0, 80),
                  price: item.price,
                  aiMs: `${aiMs}ms`,
                });
              }

              results[idx] = item;
            } catch (err) {
              logger.error("detail.error", {
                url: detailUrl,
                worker: workerIndex,
                error: err?.message || String(err),
              });
              results[idx] = {
                name: "-",
                price: "-",
                description: "-",
                link: detailUrl || "-",
              };
            }
          }
          return results;
        })
      );

      const ordered = [];
      for (const part of perPageResults) {
        if (Array.isArray(part)) {
          for (const r of part) if (r) ordered.push(r);
        }
      }

      items.push(...ordered.filter(Boolean));
      logger.info("Page done", {
        page: p,
        batchAdded: ordered.filter(Boolean).length,
        total: items.length,
      });

      if (items.length >= limit) break;
      url = bumpToNextPage(url);
    }
  } finally {
    await destroyPagePool(pool);
    await listPage.close().catch(() => {});
    await closeBrowser();
  }

  const out = {
    source: "ebay",
    startUrl,
    pagesCrawled,
    count: items.length,
    items,
  };
  logger.info("Scrape done", { pagesCrawled, count: items.length });
  return out;
}
