// Runs the page script against test/checkout.html in a real browser.
// Needs Chrome (CI) or BROWSER=/path/to/chromium-based/binary, e.g. Brave.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chromium } from "playwright-core";
import { patterns } from "../markets.js";
import { tryCodes } from "../trier.js";

const load = (f) => JSON.parse(readFileSync(new URL(`../markets/${f}.json`, import.meta.url), "utf8"));
const pat = patterns(load("be"), load("global"));
const tr = (l) => JSON.parse(readFileSync(new URL(`../locales/${l}.json`, import.meta.url), "utf8"));
const en = tr("en"), fr = { ...en, ...tr("fr") };
const page_ = (q = "") => new URL(`checkout.html${q}`, import.meta.url).href;

const browser = await chromium.launch({
  executablePath: process.env.BROWSER,
  channel: process.env.BROWSER ? undefined : "chrome",
});
const page = await browser.newPage();
// the extension's chrome.storage.local, recorded so we can assert what was saved
await page.exposeFunction("__set", (o) => (page.stored = { ...page.stored, ...o }));
await page.addInitScript(() => {
  window.chrome = { storage: { local: { get: async () => ({}), set: async (o) => window.__set(o) } } };
});

// start the run without awaiting: it waits for a click on the banner's buttons
const start = async (url, codes, t = en) => {
  page.stored = {};
  await page.goto(url);
  await page.addScriptTag({ content: `window.__try = ${tryCodes}` });
  return page.evaluate(([c, p, s]) => window.__try(c, 150, p, "shop.test", s), [codes, pat, t]);
};
const banner = (id) => page.locator(`#coupon-bot >> ${id}`);

// 1. rejects with the same error text twice, accepts the third code, user confirms
for (const [q, bad, t, saved] of [["", "ongeldig", en, /Saved for/], ["?lang=fr", "invalide", fr, /Enregistré pour/]]) {
  const run = start(page_(q), ["WELKOM15", "NEW10", "BIENVENUE10", "SAVE10"], t);
  await banner("#yes").click();
  await run;
  assert.match(await banner("#code").textContent(), /BIENVENUE10/, `${bad}: stopped on the valid code`);
  assert.match(await banner("#msg").textContent(), saved, `${bad}: banner is translated`);
  assert.equal(page.stored["shop.test"].win, "BIENVENUE10");
  assert.match(await page.locator("#total").textContent(), /90,00/, "discount really applied");
}

// 2. user says it didn't work: code is remembered as bad and the run ends with nothing found
{
  const run = start(page_(), ["WELKOM15", "BIENVENUE10"]);
  await banner("#no").click();
  await run;
  assert.match(await banner("#code").textContent(), /No code worked/);
  assert.deepEqual(page.stored["shop.test"].bad, ["BIENVENUE10"]);
}

// 3. no coupon field on the page
{
  page.stored = {};
  await page.setContent("<p>Just a cart</p>");
  await page.addScriptTag({ content: `window.__try = ${tryCodes}` });
  await page.evaluate(([c, p, s]) => window.__try(c, 150, p, "shop.test", s), [["A"], pat, en]);
  assert.match(await banner("#code").textContent(), /No coupon field found/);
}

await browser.close();
console.log("ok checkout");
