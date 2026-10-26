// 32 chars, no 0/O/1/I so codes survive being read aloud or typed
export const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const WORDS = "SUNNY TIGER MAPLE RIVER COBALT AMBER PIXEL ROCKET LEMON FALCON MANGO ORBIT CEDAR PEARL ZEBRA NOVA".split(" ");

// unbiased random int in [0, n) via rejection sampling
const rnd = (n) => {
  const max = 2 ** 32 - (2 ** 32 % n), b = new Uint32Array(1);
  do crypto.getRandomValues(b); while (b[0] >= max);
  return b[0] % n;
};
const chars = (n) => Array.from({ length: n }, () => A[rnd(32)]).join("");
const group = (s, g = 4) => s.match(new RegExp(`.{1,${g}}`, "g")).join("-");

// Luhn mod 32: catches typos/transpositions without a database lookup
const luhn = (s, f) => {
  let sum = 0;
  for (let i = s.length - 1; i >= 0; i--, f = 3 - f) {
    const d = f * A.indexOf(s[i]);
    sum += Math.floor(d / 32) + (d % 32);
  }
  return sum;
};
export const withCheck = (s) => s + A[(32 - (luhn(s, 2) % 32)) % 32];
export const validCheck = (s) => luhn(s.replace(/-/g, ""), 1) % 32 === 0;

// HMAC-SHA256 tag: verifiable offline with the secret, unforgeable without it
export const tag = async (secret, msg, n = 5) => {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(msg)));
  return Array.from(mac.slice(0, n), (b) => A[b % 32]).join(""); // 256 % 32 == 0, no bias
};
export const validSigned = async (secret, code) => {
  const [id, t] = code.split("-").slice(-2);
  return (await tag(secret, id)) === t;
};

const one = {
  random: async ({ length }) => group(chars(length)),
  words: async () => `${WORDS[rnd(16)]}-${WORDS[rnd(16)]}-${10 + rnd(90)}`, // ~16 bits: low-value promos only
  checksum: async ({ length }) => group(withCheck(chars(length))),
  signed: async ({ secret }) => { const id = chars(5); return `${id}-${await tag(secret, id)}`; },
};

export async function generate({ algo, count, length = 8, prefix = "", secret = "" }) {
  if (algo === "signed" && !secret) throw new Error("Secret required");
  const out = new Set();
  // ponytail: no retry cap; fine until count approaches the code space (words: ~14k)
  while (out.size < count) out.add((prefix ? prefix + "-" : "") + (await one[algo]({ length, secret })));
  return [...out];
}

// Default list, most common first. Sources: public coupon-aggregator rankings
// (WELCOME*, BLACKFRIDAY*, SAVE*, FREESHIP*, FIRST*/NEWCUSTOMER). The nl-BE and
// NEWSLETTER entries are common conventions, not ranked data.
const pct = (w, p) => p.map((n) => w + n);
const DEFAULT = [
  ...pct("WELCOME", ["10", "15", "20", "5", "25", "30", "50", "", "BACK", "HOME", "2026", "2025"]),
  ...pct("NEWSLETTER", ["10", "15", "20", ""]),
  ...pct("BLACKFRIDAY", ["", "10", "15", "20", "25", "30", "2026", "2025"]),
  "BF", "BF10", "BF20", ...pct("CYBERMONDAY", ["", "10", "15", "20"]), "CM",
  ...pct("SAVE", ["10", "15", "20", "5", "25", "30", "50"]),
  "NEWCUSTOMER", "NEWCUSTOMER10", "FIRSTBUY", "FIRSTORDER", ...pct("FIRST", ["10", "15", "20"]),
  ...pct("HELLO", ["10", "15", "20"]),
  ...pct("SIGNUP", ["10", "15", ""]),
  "FREESHIP", "FREESHIPPING",
  ...pct("VIP", ["10", "15", "20", ""]),
  ...pct("THANKS", ["10", "15"]), "THANKYOU", "THANKYOU10",
  "SPRINGSALE", ...pct("SUMMER", ["10", "15", "20", "SALE"]), "EASTER", "HALLOWEEN", "CHRISTMAS", "XMAS",
  ...pct("WELKOM", ["10", "15", "20", "5", ""]),
  ...pct("NIEUWSBRIEF", ["10", "15", ""]),
  ...pct("KORTING", ["10", "15", "20"]),
  ...pct("ZOMER", ["10", "15", "20"]), "GRATISVERZENDING", "ZOMERSALE", "WINTERSALE",
];
// Shop-name guesses (NIKE10...) go first, then the default list
export const common = (extra = []) => [...new Set([
  ...extra.map((w) => w.trim().toUpperCase()).filter(Boolean).flatMap((w) => pct(w, ["10", "15", "20"])),
  ...DEFAULT,
])];
