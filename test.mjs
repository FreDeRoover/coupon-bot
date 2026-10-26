// run: node test.mjs
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { build, order, patterns } from "./markets.js";
import { fmt } from "./i18n.js";

const load = (f) => JSON.parse(readFileSync(`markets/${f}.json`, "utf8"));
const global = load("global");
const ids = load("index");

// every market file is listed in index.json, and the index lists nothing missing
const files = readdirSync("markets").map((f) => f.replace(".json", "")).filter((f) => !["global", "index"].includes(f));
assert.deepEqual([...ids].sort(), files.sort(), "markets/index.json must list every market file");

for (const m of [global, ...ids.map(load)]) {
  assert(Array.isArray(m.groups) && Array.isArray(m.codes), `${m.name}: groups and codes arrays`);
  assert(["error", "field", "button"].every((k) => Array.isArray(m.ui?.[k])), `${m.name}: ui.error/field/button arrays`);
}
for (const id of ids) {
  const m = load(id);
  assert(/^[a-z]{2}(-[a-z0-9]+)?$/.test(id), `${id}: file name is a lowercase country code`);
  assert(m.name && Array.isArray(m.regions) && m.regions.every((r) => /^[A-Z]{2}$/.test(r)), `${id}: name and ISO regions`);
  const codes = build(m, global);
  assert(codes.length > 20, `${id}: at least 20 codes`);
  assert(codes.every((c) => /^[A-Z0-9]{2,32}$/.test(c)), `${id}: codes are A-Z/0-9, 2-32 chars`);
  for (const k of ["error", "field", "button"]) new RegExp(patterns(m, global)[k], "i"); // compiles
}

const cm = build(load("be"), global, ["shop"]);
assert(cm[0] === "SHOP10" && cm.includes("WELKOM10") && cm.includes("BLACKFRIDAY15"));
assert.equal(new Set(cm).size, cm.length);
assert(new RegExp(patterns(load("be"), global).error, "i").test("Deze code is ongeldig"));
const o = order(["A", "B", "C"], { win: "C", bad: ["B"] });
assert.deepEqual(o, ["C", "A"], "winner first, bad dropped");
assert.deepEqual(order(["A", "A"]), ["A"], "no saved entry, deduped");
// translations: every locale file is a subset of en.json with the same {placeholders}
const loc = (l) => JSON.parse(readFileSync(`locales/${l}.json`, "utf8"));
const en = loc("en");
const vars = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join();
for (const f of readdirSync("locales")) {
  const l = f.replace(".json", ""), tr = loc(l);
  assert(/^[a-z]{2,3}$/.test(l), `${f}: file name is a language code`);
  for (const [k, v] of Object.entries(tr)) {
    assert(k in en, `${l}: unknown key ${k}`);
    assert.equal(vars(v), vars(en[k]), `${l}.${k}: same {placeholders} as en`);
    assert(!/[\u2013\u2014]/.test(v), `${l}.${k}: no dashes`);
  }
}
const used = new Set(["popup.html", "popup.js", "trier.js"].flatMap((f) => [...readFileSync(f, "utf8").matchAll(/data-i18n(?:-placeholder)?="(\w+)"|\bt\.(\w+)/g)].map((m) => m[1] || m[2])));
assert.deepEqual([...used].filter((k) => !(k in en)), [], "keys used in code exist in en.json");
assert.deepEqual(Object.keys(en).filter((k) => !used.has(k)), [], "no unused keys in en.json");
assert.equal(fmt("Code {i} of {n}", { i: 2, n: 9 }), "Code 2 of 9");
console.log("ok", ids.join(","), cm.length);
