import { scrapeService } from "../services/scrape.service.js";

export async function scrapeController(req, res, next) {
  try {
    const { query, url, maxPages = "1", limit = "20" } = req.query;
    console.log("hello scrape");
    const startUrl =
      url ||
      (query
        ? `https://www.ebay.com/sch/i.html?_from=R40&_nkw=${encodeURIComponent(
            query
          )}&_sacat=0&rt=nc&_pgn=1`
        : process.env.START_URL);

    if (!startUrl)
      return res.status(400).json({ error: "Provide ?query=... or ?url=..." });

    const result = await scrapeService({
      startUrl,
      maxPages: Number(maxPages),
      limit: Number(limit),
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}
