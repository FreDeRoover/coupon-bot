# Adding a market or a translation

Markets and translations are plain JSON files. No JavaScript needed.
A market is a country (codes plus the words its shops use). A translation is a language for the popup. They are separate: Belgium has one market and two languages (nl, fr).

1. Copy `markets/be.json` to `markets/<country>.json` (lowercase ISO code, e.g. `markets/nl.json`).
2. Edit it:
   - `name`: shown in the popup, e.g. `"Netherlands (nl-NL)"`.
   - `regions`: ISO country codes, used to preselect the market from the browser language.
   - `groups`: every `word` combined with every `suffix`, e.g. `WELKOM` + `10` gives `WELKOM10`.
   - `codes`: single codes that don't fit a pattern.
   - `ui.error`, `ui.field`, `ui.button`: the words shops in your language use for "invalid code", the coupon input (name/placeholder) and the apply button. English ones are always included.
3. Add your file name (without `.json`) to `markets/index.json`.
4. Optional but welcome: translate the popup. Copy `locales/en.json` to `locales/<language>.json` (two-letter code, e.g. `locales/de.json`) and translate the values. Keep the `{placeholders}` as they are. Missing keys fall back to English, and the language is picked from the browser language.
5. Run `node test.mjs`. It checks the file formats, that the index is complete, and that translations match `en.json`.
6. Open a PR. Say in the description where the codes come from (links).

## Rules

- Codes must be real conventions: a shop's published welcome offer, a coupon-site ranking, or a recurring seasonal name. No random strings.
- Put the most likely codes first. The bot tries them in order, one every 2.5 seconds.
- Only public, generic codes. Never codes belonging to one customer or leaked from a shop.
- UPPERCASE, A-Z and 0-9 only.
