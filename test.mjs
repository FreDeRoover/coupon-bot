// run: node test.mjs
import assert from "node:assert/strict";
import { generate, validCheck, validSigned, withCheck } from "./gen.js";

const base = { count: 200, length: 8 };
for (const algo of ["random", "checksum", "signed", "words"]) {
  const codes = await generate({ ...base, algo, secret: "s3cret", prefix: "X" });
  assert.equal(new Set(codes).size, 200, `${algo} unique`);
  assert(codes.every((c) => c.startsWith("X-")), `${algo} prefix`);
}

const c = (await generate({ algo: "checksum", count: 1, length: 8 }))[0];
assert(validCheck(c));
const typo = c[0] === "A" ? "B" + c.slice(1) : "A" + c.slice(1);
assert(!validCheck(typo), "typo detected");
assert(validCheck(withCheck("ABCDEFGH")));

const s = (await generate({ algo: "signed", count: 1, secret: "k" }))[0];
assert(await validSigned("k", s));
assert(!(await validSigned("other", s)));
console.log("ok");
