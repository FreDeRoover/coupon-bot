# Coupon Bot

Browser extension (Chrome, Brave, any Chromium) that tries common Belgian (nl-BE/fr-BE) coupon codes at checkout.

## Install

1. Download `coupon-bot.zip` from the [latest release](../../releases/latest) and unzip it.
2. Open `brave://extensions` (or `chrome://extensions`) and enable Developer mode.
3. Click Load unpacked and select the unzipped folder.

## Release

```sh
git tag v1.0.0 && git push origin v1.0.0
```

CI runs `node test.mjs` on every push and PR. A `v*` tag also zips the extension and attaches it to a GitHub release.

## Add your country

Markets are JSON files in [`markets/`](markets). See [CONTRIBUTING.md](CONTRIBUTING.md) - a PR with one file is enough.
