import { newPage, setInterception } from "./browser.js";

function looksLikeBotCheck(html = "") {
  return /Pardon Our Interruption|Checking your browser/i.test(html);
}

export async function getListPageHTML(url, sharedPage) {
  const page = sharedPage || (await newPage({ block: true }));

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  let html = await page.content();

  if (looksLikeBotCheck(html)) {
    await setInterception(page, { enabled: false }); // izinkan JS/CSS biar challenge jalan
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
    await setInterception(page, { enabled: true }); // balik blok lagi
  }

  if (!sharedPage) await page.close();
  return html;
}

export function bumpToNextPage(urlStr) {
  const u = new URL(urlStr);
  const curr = Number(u.searchParams.get("_pgn") || "1");
  u.searchParams.set("_pgn", String(curr + 1));
  return u.toString();
}
