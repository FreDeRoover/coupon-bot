// Runs inside the page. Slow on purpose: it stops at the first code that isn't
// rejected, so it can't hammer a shop's validation endpoint.
export async function tryCodes(codes, delay, pat, key, t) {
  const f = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k]); // same as fmt() in i18n.js: this function must be self-contained
  const re = (k) => new RegExp(pat[k], "i");
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
      [hidden] { display: none !important; }
      .confirm { display: flex; gap: 8px; margin-top: 10px; }
      .confirm button { flex: 1; text-align: center; padding: 7px 10px; }
      #no { background: #6f655b; }
      @keyframes in { from { opacity: 0; transform: translateY(8px); } }
      @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
    </style>
    <div class="card" role="status" aria-live="polite">
      <div class="top"><span class="brand">Coupon<span>Bot</span></span><button id="x"></button></div>
      <div class="code" id="code"></div>
      <div class="msg" id="msg"></div>
      <div class="bar"><div class="fill" id="fill"></div></div>
      <div class="confirm" id="confirm" hidden><button id="yes"></button><button id="no"></button></div>
    </div>`;
  document.documentElement.append(host);
  const $r = (id) => root.getElementById(id);
  $r("code").textContent = t.lookingField;
  $r("yes").textContent = t.yes;
  $r("no").textContent = t.no;
  const card = root.querySelector(".card");
  const finish = (code, msg, ok) => {
    card.classList.add("done");
    card.classList.toggle("ok", !!ok);
    $r("code").textContent = code;
    $r("msg").textContent = msg;
    $r("confirm").hidden = true;
    $r("x").textContent = t.close;
    $r("x").onclick = () => host.remove();
  };
  const armStop = () => {
    $r("x").textContent = t.stop;
    $r("x").onclick = () => { window.__couponRun++; finish(t.stopped, t.stoppedMsg, false); };
  };
  armStop();

  // remembered per shop (hostname) in chrome.storage.local; never leaves the browser
  const save = async (change) => {
    const s = (await chrome.storage.local.get(key))[key] || {};
    change(s);
    await chrome.storage.local.set({ [key]: s });
  };
  // true = it worked, false = it didn't, null = banner closed
  const ask = (code) => new Promise((resolve) => {
    card.classList.add("ok");
    $r("code").textContent = code;
    $r("msg").textContent = t.askTotal;
    $r("confirm").hidden = false;
    $r("yes").onclick = () => resolve(true);
    $r("no").onclick = () => resolve(false);
    $r("x").textContent = t.close;
    $r("x").onclick = () => resolve(null);
  });

  // page text as a set of lines; our own banner is hidden while measuring
  const lines = () => {
    host.style.display = "none";
    const t = new Set(document.body.innerText.split("\n").map((s) => s.trim()).filter(Boolean));
    host.style.display = "";
    return t;
  };
  const field = () => [...document.querySelectorAll("input:not([type=hidden]):not([type=password])")]
    .find((i) => i.offsetParent && re("field").test([i.name, i.id, i.placeholder, i.autocomplete, i.getAttribute("aria-label")].join(" ")));
  const apply = (input) => {
    for (let el = input.parentElement, n = 0; el && n < 4; el = el.parentElement, n++) {
      const b = [...el.querySelectorAll("button, input[type=submit], [role=button]")]
        .find((x) => re("button").test((x.innerText || x.value || "").trim()));
      if (b) return b.click();
    }
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", keyCode: 13, bubbles: true }));
    input.form?.requestSubmit?.();
  };
  const ERR = re("error");
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;

  if (!field()) return finish(t.noField, t.noFieldMsg, false);

  for (const [i, code] of codes.entries()) {
    const input = field();
    if (window.__couponRun !== run) return; // stopped
    if (!input) break;
    $r("code").textContent = code;
    $r("msg").textContent = f(t.trying, { i: i + 1, n: codes.length });
    $r("fill").style.width = `${(i / codes.length) * 100}%`;
    const before = lines();
    const seen = [];
    const watch = new MutationObserver((ms) => ms.forEach((m) => {
      m.addedNodes.forEach((n) => seen.push(n.textContent));
      if (m.type === "characterData") seen.push(m.target.textContent);
    }));
    watch.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    setValue.call(input, code);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    apply(input);
    await sleep(delay);
    if (window.__couponRun !== run) return;
    watch.disconnect();
    const added = [...lines()].filter((l) => !before.has(l)).concat(seen).join(" ");
    if (ERR.test(added)) continue;
    const worked = await ask(code);
    if (worked === null) return host.remove();
    if (worked) {
      await save((s) => { s.win = code; s.bad = (s.bad || []).filter((c) => c !== code); });
      return finish(code, f(t.saved, { shop: key }), true);
    }
    await save((s) => { s.bad = [...(s.bad || []), code]; if (s.win === code) delete s.win; });
    card.classList.remove("ok");
    $r("confirm").hidden = true;
    armStop();
  }
  finish(t.noCode, t.noCodeMsg, false);
}
