import { common } from "./gen.js";

const $ = (id) => document.getElementById(id);
const DELAY = 2500;

// Runs inside the page. Slow on purpose: it stops at the first code that isn't
// rejected, so it can't hammer a shop's validation endpoint.
async function tryCodes(codes, delay) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  document.getElementById("coupon-bot")?.remove();
  const run = (window.__couponRun = (window.__couponRun || 0) + 1); // bumping it cancels this run

  const host = document.createElement("div");
  host.id = "coupon-bot";
  host.style.cssText = "all:initial;position:fixed;z-index:2147483647;right:16px;bottom:16px";
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `
    <style>
      .card { box-sizing: border-box; width: 280px; padding: 14px 16px; border-radius: 14px; background: #fbf3e4; color: #1f1a17;
              font: 14px/1.4 ui-rounded, "SF Pro Rounded", system-ui, sans-serif; border: 2px dashed #d9c9ad;
              box-shadow: 0 12px 30px -8px rgba(0,0,0,.45); animation: in .25s both; }
      .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
      .brand { font: italic 800 15px Georgia, serif; }
      .brand span { color: #e4572e; }
      button { all: unset; cursor: pointer; padding: 4px 10px; border-radius: 8px; background: #1f1a17; color: #fbf3e4; font-weight: 800; font-size: 12px; }
      button:focus-visible { outline: 2px solid #e4572e; outline-offset: 2px; }
      .code { font: 800 20px ui-monospace, "SF Mono", Menlo, monospace; letter-spacing: .02em; word-break: break-all; }
      .msg { margin-top: 2px; color: #6f655b; }
      .bar { margin-top: 10px; height: 6px; border-radius: 3px; background: #e6d8bd; overflow: hidden; }
      .fill { height: 100%; width: 0; background: #e4572e; transition: width .3s; }
      .ok { border: 2px solid #2e7d4f; } .ok .code { color: #2e7d4f; }
      .done .bar { display: none; }
      @keyframes in { from { opacity: 0; transform: translateY(8px); } }
      @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
    </style>
    <div class="card" role="status" aria-live="polite">
      <div class="top"><span class="brand">Coupon<span>Bot</span></span><button id="x">Stop</button></div>
      <div class="code" id="code">Looking for coupon field...</div>
      <div class="msg" id="msg"></div>
      <div class="bar"><div class="fill" id="fill"></div></div>
    </div>`;
  document.documentElement.append(host);
  const $r = (id) => root.getElementById(id);
  const card = root.querySelector(".card");
  const finish = (code, msg, ok) => {
    card.classList.add("done");
    card.classList.toggle("ok", !!ok);
    $r("code").textContent = code;
    $r("msg").textContent = msg;
    $r("x").textContent = "Close";
    $r("x").onclick = () => host.remove();
  };
  $r("x").onclick = () => { window.__couponRun++; finish("Stopped", "Check the cart: the last code tried may still be applied.", false); };

  // page text as a set of lines; our own banner is hidden while measuring
  const lines = () => {
    host.style.display = "none";
    const t = new Set(document.body.innerText.split("\n").map((s) => s.trim()).filter(Boolean));
    host.style.display = "";
    return t;
  };
  const field = () => [...document.querySelectorAll("input:not([type=hidden]):not([type=password])")]
    .find((i) => i.offsetParent && /coupon|promo|voucher|discount|korting|code|bon|réduction|reduction|remise/i.test([i.name, i.id, i.placeholder, i.autocomplete, i.getAttribute("aria-label")].join(" ")));
  const apply = (input) => {
    for (let el = input.parentElement, n = 0; el && n < 4; el = el.parentElement, n++) {
      const b = [...el.querySelectorAll("button, input[type=submit], [role=button]")]
        .find((x) => /apply|redeem|submit|toepassen|toevoegen|gebruik|activeer|valideer|inwisselen|appliquer|valider|utiliser|ajouter|^ok$/i.test((x.innerText || x.value || "").trim()));
      if (b) return b.click();
    }
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", keyCode: 13, bubbles: true }));
    input.form?.requestSubmit?.();
  };
  const ERR = /invalid|not valid|expired|not found|doesn.t exist|unknown|incorrect|ongeldig|niet geldig|bestaat niet|verlopen|niet gevonden|onbekend|fout|error|invalide|expiré|introuvable|n.existe pas|erreur|déjà utilisé|al gebruikt|already used/i;
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;

  if (!field()) return finish("No coupon field found", "Open the cart or checkout step that has a discount code box, then try again.", false);

  for (const [i, code] of codes.entries()) {
    const input = field();
    if (window.__couponRun !== run) return; // stopped
    if (!input) break;
    $r("code").textContent = code;
    $r("msg").textContent = `Trying ${i + 1} of ${codes.length}`;
    $r("fill").style.width = `${(i / codes.length) * 100}%`;
    const before = lines();
    setValue.call(input, code);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    apply(input);
    await sleep(delay);
    if (window.__couponRun !== run) return;
    const added = [...lines()].filter((l) => !before.has(l)).join(" ");
    if (!ERR.test(added)) return finish(code, "Not rejected. Check your total before paying.", true);
  }
  finish("No code worked", "Try adding the shop name to the list.", false);
}

const codes = () => common($("extra").value.split(","));

const update = () => {
  const n = codes().length;
  $("n").textContent = n;
  $("eta").textContent = `codes to try, about ${Math.ceil((n * DELAY) / 60000)} min if none work`;
};
try { $("extra").value = localStorage.getItem("extra") || ""; } catch {}
$("extra").oninput = () => {
  try { localStorage.setItem("extra", $("extra").value); } catch {}
  update();
};
update();

$("try").onclick = async () => {
  $("err").textContent = "";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: tryCodes, args: [codes(), DELAY] });
    window.close();
  } catch {
    $("err").textContent = "Can't run on this page. Open a shop's cart or checkout tab first.";
  }
};
