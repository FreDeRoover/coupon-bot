// run: node test.mjs
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { build, patterns } from "./markets.js";

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
console.log("ok", ids.join(","), cm.length);
