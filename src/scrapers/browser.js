import puppeteer from "puppeteer";
import { getLaunchOptions } from "../config/puppeteer.js";

let browser;

function defaultBlockList() {
  return (process.env.BLOCK_RESOURCES || "image,font,media,stylesheet")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function openBrowser() {
  if (!browser) browser = await puppeteer.launch(getLaunchOptions());
  return browser;
}

export async function setInterception(page, { enabled }) {
  page.removeAllListeners("request");
  if (enabled) {
    const blockList = defaultBlockList();
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (blockList.includes(req.resourceType())) return req.abort();
      req.continue();
    });
  } else {
    try {
      await page.setRequestInterception(false);
    } catch {}
  }
}

async function stealthTweak(page) {
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    window.chrome = { runtime: {} };
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3] });
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });
  });
}

export async function preparePage(page, { block = true } = {}) {
  await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 });
  await stealthTweak(page);
  await page.setUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  });
  await setInterception(page, { enabled: block });
  page.setDefaultNavigationTimeout(60_000);
  return page;
}

export async function newPage(opts = {}) {
  const b = await openBrowser();
  const page = await b.newPage();
  return preparePage(page, opts);
}

export async function createPagePool(size = 4) {
  const pages = [];
  for (let i = 0; i < size; i++) pages.push(await newPage({ block: true }));
  return pages;
}

export async function destroyPagePool(pages = []) {
  await Promise.all(pages.map((p) => p?.close().catch(() => {})));
}

export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
