import { build, order, patterns } from "./markets.js";
import { tryCodes } from "./trier.js";

const $ = (id) => document.getElementById(id);
const DELAY = 2500;

const json = (path) => fetch(path).then((r) => r.json());
const global = await json("markets/global.json");
const ids = await json("markets/index.json");
const markets = Object.fromEntries(await Promise.all(ids.map(async (id) => [id, await json(`markets/${id}.json`)])));

// saved choice, else the market matching the browser's region, else global only
for (const id of ids) $("market").add(new Option(markets[id].name, id));
$("market").add(new Option("Other (global codes only)", ""), 0);
const guess = ids.find((id) => markets[id].regions.includes(new Intl.Locale(navigator.language).region)) ?? "";
$("market").value = localStorage.getItem("market") ?? guess;
$("extra").value = localStorage.getItem("extra") || "";

const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const key = tab?.url ? new URL(tab.url).hostname.replace(/^www\./, "") : "";
const saved = key ? (await chrome.storage.local.get(key))[key] || {} : {};
$("mem").textContent = saved.win ? `Remembered for ${key}: ${saved.win}` : "";

const market = () => markets[$("market").value];
const codes = () => order(build(market(), global, $("extra").value.split(",")), saved);

const update = () => {
  const n = codes().length;
  $("n").textContent = n;
  $("eta").textContent = `codes to try, about ${Math.ceil((n * DELAY) / 60000)} min if none work`;
};
$("market").onchange = () => { localStorage.setItem("market", $("market").value); update(); };
$("extra").oninput = () => { localStorage.setItem("extra", $("extra").value); update(); };
update();

$("try").onclick = async () => {
  $("err").textContent = "";
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: tryCodes, args: [codes(), DELAY, patterns(market(), global), key] });
    window.close();
  } catch {
    $("err").textContent = "Can't run on this page. Open a shop's cart or checkout tab first.";
  }
};
