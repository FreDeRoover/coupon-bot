# Adding a market (country or language)

Markets are plain JSON files. No JavaScript needed.

1. Copy `markets/be.json` to `markets/<country>.json` (lowercase ISO code, e.g. `markets/nl.json`).
2. Edit it:
   - `name`: shown in the popup, e.g. `"Netherlands (nl-NL)"`.
   - `regions`: ISO country codes, used to preselect the market from the browser language.
   - `groups`: every `word` combined with every `suffix`, e.g. `WELKOM` + `10` gives `WELKOM10`.
   - `codes`: single codes that don't fit a pattern.
   - `ui.error`, `ui.field`, `ui.button`: the words shops in your language use for "invalid code", the coupon input (name/placeholder) and the apply button. English ones are always included.
3. Add your file name (without `.json`) to `markets/index.json`.
4. Run `node test.mjs`. It checks the file format and that the index is complete.
5. Open a PR. Say in the description where the codes come from (links).

## Rules

- Codes must be real conventions: a shop's published welcome offer, a coupon-site ranking, or a recurring seasonal name. No random strings.
- Put the most likely codes first. The bot tries them in order, one every 2.5 seconds.
- Only public, generic codes. Never codes belonging to one customer or leaked from a shop.
- UPPERCASE, A-Z and 0-9 only.
