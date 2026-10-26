// run: node test.mjs
import assert from "node:assert/strict";
import { common } from "./gen.js";

const cm = common(["shop"]);
assert(cm.includes("NEWSLETTER10") && cm.includes("BLACKFRIDAY15") && cm[0] === "SHOP10");
assert.equal(new Set(cm).size, cm.length);
console.log("ok");
