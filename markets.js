// Pure helpers: used by the popup and by test.mjs.
// A market file is data only (see CONTRIBUTING.md): codes + the words a shop in that language uses.
const expand = (m) => [
  ...m.groups.flatMap((g) => g.words.flatMap((w) => g.suffixes.map((s) => w + s))),
  ...m.codes,
];

// Shop-name guesses (NIKE10...) first, then the market's codes, then the global ones
export const build = (market, global, shops = []) => [...new Set([
  ...shops.map((w) => w.trim().toUpperCase()).filter(Boolean).flatMap((w) => ["10", "15", "20", "5"].map((p) => w + p)),
  ...(market ? expand(market) : []),
  ...expand(global),
])];

const alt = (words) => words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");

// Regex sources for the page script: market words are added to the global ones
export const patterns = (market, global) => {
  const all = (k) => [...global.ui[k], ...(market ? market.ui[k] : [])];
  return { error: alt(all("error")), field: alt(all("field")), button: alt(all("button")) + "|^ok$" };
};
