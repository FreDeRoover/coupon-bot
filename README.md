<p align="center">
  <img src="assets/demo.svg" alt="Coupon Bot trying discount codes one by one at checkout until one is not rejected" width="760">
</p>

<p align="center">
  <a href="../../releases/latest"><img alt="Latest release" src="https://img.shields.io/github/v/release/FreDeRoover/coupon-bot?color=e4572e&labelColor=1f1a17"></a>
  <a href="../../actions/workflows/release.yml"><img alt="Tests" src="https://img.shields.io/github/actions/workflow/status/FreDeRoover/coupon-bot/release.yml?branch=main&label=tests&labelColor=1f1a17"></a>
  <a href="markets"><img alt="Markets" src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FFreDeRoover%2Fcoupon-bot%2Fmain%2Fmarkets%2Findex.json&query=%24.length&label=markets&color=2e7d4f&labelColor=1f1a17"></a>
  <img alt="Works in Brave and Chrome" src="https://img.shields.io/badge/Brave%20%7C%20Chrome-any%20Chromium-6f655b?labelColor=1f1a17">
</p>

Browser extension that tries common discount codes at checkout, in the order shops most often use them. It picks your market from the browser language (Belgium nl-BE and fr-BE so far), adds your shop name (`nike` also tries `NIKE10`, `NIKE15`), and stops at the first code the shop does not reject.

## Install

1. Download `coupon-bot.zip` from the [latest release](../../releases/latest) and unzip it.
2. Open `brave://extensions` (or `chrome://extensions`) and enable Developer mode.
3. Click Load unpacked and select the unzipped folder.

## Use

1. Open a shop's cart or checkout page.
2. Click the extension, pick your market, press **Start trying codes**.
3. Watch the banner in the corner. Press Stop at any time, and check your total before paying.

It tries one code every 2.5 seconds, so a full miss takes a few minutes. When a code is not rejected, the banner asks whether your total dropped. Press **It worked** and that code goes first on that shop next time. Press **Didn't work** and it is skipped from then on. Both are stored only in your browser, per shop (hostname plus code), and never sent anywhere.

## Add your country

Markets are JSON files in [`markets/`](markets). A PR with one file is enough:

<details>
<summary>What a market file looks like</summary>

```json
{
  "name": "Netherlands (nl-NL)",
  "regions": ["NL"],
  "groups": [{ "words": ["WELKOM"], "suffixes": ["10", "15", ""] }],
  "codes": ["GRATISVERZENDING"],
  "ui": { "error": ["ongeldig"], "field": ["korting"], "button": ["toepassen"] }
}
```

`WELKOM` + `10` becomes `WELKOM10`. Full steps and rules: [CONTRIBUTING.md](CONTRIBUTING.md).
</details>

<details>
<summary>Releasing</summary>

```sh
git tag v1.0.0 && git push origin v1.0.0
```

CI runs `npm test` on every push and PR: unit checks plus the page script against a fake checkout in `test/` (set `BROWSER` to a Chromium-based binary such as Brave if you have no Chrome). A `v*` tag also zips the extension and attaches it to a GitHub release.
</details>
