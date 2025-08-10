import { htmlToCleanText } from "../utils/cleanHtml.js";
import { cleanText } from "../utils/clean.js";
import { setInterception } from "./browser.js";

function looksLikeBotCheck(html = "") {
  return /Pardon Our Interruption|Checking your browser/i.test(html);
}

export async function getDetailRawWithPage(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  let html = await page.content();

  if (looksLikeBotCheck(html)) {
    await setInterception(page, { enabled: false });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60_000 });
    await page
      .waitForFunction(
        () =>
          !/Pardon Our Interruption/i.test(
            document.title || document.body?.innerText || ""
          ),
        { timeout: 15000 }
      )
      .catch(() => {});
    html = await page.content();
    await setInterception(page, { enabled: true });
  }

  let pageTitle = "-";
  let metaDescription = "-";
  try {
    pageTitle = cleanText(await page.title());
  } catch {}
  try {
    metaDescription = await page.$eval('meta[name="description"]', (el) =>
      (el.content || "").trim()
    );
    metaDescription = cleanText(metaDescription || "-");
  } catch {}

  const cleanedTextMain = htmlToCleanText(String(html), { maxChars: 40000 });

  let iframeText = "";
  try {
    for (const f of page.frames() || []) {
      const nm = f.name() || "";
      const fu = f.url() || "";
      if (/desc/i.test(nm) || /desc/i.test(fu)) {
        try {
          const t = await f.$eval("body", (el) => (el.innerText || "").trim());
          if (t && t.length > 10) iframeText += (iframeText ? "\n\n" : "") + t;
        } catch {}
      }
    }
  } catch {}

  const cleanedText = [cleanedTextMain, iframeText]
    .filter(Boolean)
    .join("\n\n");
  const _meta = {
    cleanedLen: cleanedText.length,
    hasIframeDesc: !!iframeText,
    hasTitle: pageTitle !== "-",
    hasMetaDesc: metaDescription !== "-",
  };

  return { url, pageTitle, metaDescription, cleanedText, _meta };
}
