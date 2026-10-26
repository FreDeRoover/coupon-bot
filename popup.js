import { common, generate } from "./gen.js";

const $ = (id) => document.getElementById(id);
const sync = () => ($("secretRow").hidden = $("algo").value !== "signed");
$("algo").onchange = sync;

$("go").onclick = async () => {
  $("err").textContent = "";
  try {
    $("out").value = (await generate({
      algo: $("algo").value,
      count: Math.min(+$("count").value || 1, 1000),
      length: +$("length").value || 8,
      prefix: $("prefix").value.trim().toUpperCase(),
      secret: $("secret").value,
    })).join("\n");
  } catch (e) { $("err").textContent = e.message; }
};

$("copy").onclick = () => navigator.clipboard.writeText($("out").value);

// Runs inside the page. Slow and capped on purpose: it stops at the first code
// that isn't rejected, so it can't hammer a shop's validation endpoint.
async function tryCodes(codes, delay) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const bar = document.body.appendChild(document.createElement("div"));
  bar.style.cssText = "position:fixed;z-index:2147483647;bottom:16px;right:16px;background:#111;color:#fff;padding:10px 14px;font:13px system-ui;border-radius:8px;max-width:300px";
  const say = (t) => (bar.textContent = "Coupon Bot: " + t);
  const lines = () => new Set(document.body.innerText.split("\n").map((s) => s.trim()).filter((s) => s && !s.startsWith("Coupon Bot")));
  const field = () => [...document.querySelectorAll("input:not([type=hidden]):not([type=password])")]
    .find((i) => i.offsetParent && /coupon|promo|voucher|discount|korting|code/i.test([i.name, i.id, i.placeholder, i.autocomplete, i.getAttribute("aria-label")].join(" ")));
  const apply = (input) => {
    for (let el = input.parentElement, n = 0; el && n < 4; el = el.parentElement, n++) {
      const b = [...el.querySelectorAll("button, input[type=submit], [role=button]")]
        .find((x) => /apply|redeem|submit|toepassen|toevoegen|gebruik|activeer|valideer|^ok$/i.test((x.innerText || x.value || "").trim()));
      if (b) return b.click();
    }
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", keyCode: 13, bubbles: true }));
    input.form?.requestSubmit?.();
  };
  const ERR = /invalid|not valid|expired|not found|doesn.t exist|unknown|incorrect|ongeldig|niet geldig|bestaat niet|verlopen|niet gevonden|onbekend|fout|error/i;
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;

  window.__couponStop = false;
  if (!field()) { say("no coupon field found"); return setTimeout(() => bar.remove(), 5000); }
  for (const [i, code] of codes.entries()) {
    const input = field();
    if (window.__couponStop || !input) break;
    say(`${i + 1}/${codes.length} trying ${code}`);
    const before = lines();
    setValue.call(input, code);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    apply(input);
    await sleep(delay);
    const added = [...lines()].filter((l) => !before.has(l)).join(" ");
    if (!ERR.test(added)) return say(`${code} was not rejected - check your total`);
  }
  say(window.__couponStop ? "stopped" : "no code worked");
}

$("try").onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const codes = common($("extra").value.split(",")).slice(0, Math.min(+$("max").value || 30, 60));
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: tryCodes, args: [codes, 2500] });
  window.close();
};

$("stop").onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => (window.__couponStop = true) });
};
