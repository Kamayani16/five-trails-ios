# Five Trails for iPhone

The Five Trails web game ([Kamayani16/five-trails](https://github.com/Kamayani16/five-trails)) inside a
[Capacitor](https://capacitorjs.com) app, with:

- **Coin packs** sold through Apple in-app purchases, using the free, MIT-licensed
  [cordova-plugin-purchase](https://github.com/j3k0/cordova-plugin-purchase) (`capacitor-plugin-cdv-purchase`).
  No paid service is involved; the game server checks every purchase with Apple itself.
- **Reminders** ("your free chest is ready") through `@capacitor/local-notifications`.

The game itself is not copied here: it comes in as a git submodule (`game/`), so the app always
ships the same code as the website.

## What is in this repository

| Path | What it is |
|---|---|
| `game/` | The game repository (submodule). Its `web/` folder is what the app shows. |
| `src/native.js` | The small native bridge: loads the purchase plugin and local notifications. |
| `scripts/build.mjs` | Builds `www/`: copies `game/web`, sets your server address, adds `native.js`. |
| `capacitor.config.json` | App id `com.fivetrails.app`, name, colours. |
| `ios/` | The Xcode project (Swift Package Manager, no CocoaPods needed). |

## One-time setup on a Mac

You need a Mac with **Xcode** (from the App Store), **Node.js 20 or newer**, and an
**Apple Developer Program** membership.

```sh
git clone --recursive https://github.com/Kamayani16/five-trails-ios
cd five-trails-ios
npm install
FT_SERVER_URL=wss://YOUR-GAME-SERVER/ws npm run sync
npm run open
```

`FT_SERVER_URL` is the WebSocket address of your deployed game server (the same server that runs the
website, ending in `/ws`). It must be `wss://`.

In Xcode:

1. Select the **App** target → **Signing & Capabilities** → choose your **Team**.
2. If `com.fivetrails.app` is taken, change the **Bundle Identifier** (and `appId` in
   `capacitor.config.json` to match). Use the same value for `FT_APPLE_BUNDLE_ID` on the server.
3. Click **+ Capability** → **In-App Purchase**.
4. Pick an iPhone (or a simulator) and press **Run**.

## Coin packs in App Store Connect

Create the app in [App Store Connect](https://appstoreconnect.apple.com), sign the **Paid Apps
agreement** (Business → Agreements, with bank and tax details), then under the app →
**Monetization → In-App Purchases** add four **Consumable** products. The ids must match exactly:

| Product ID | Coins | Suggested price |
|---|---|---|
| `coins_300` | 300 | ₹99 / $0.99 |
| `coins_1000` | 1,000 (+11% bonus) | ₹299 / $2.99 |
| `coins_1800` | 1,800 (+20% bonus) | ₹499 / $4.99 |
| `coins_4000` | 4,000 (+33%, best value) | ₹999 / $9.99 |

Why these: an active player earns roughly 200–400 coins a day for free (battles, the chest, quests),
and shop items cost 200–750. So ₹99 is about a day of play or one table theme, and the bigger packs
give bonus coins without making anything feel locked behind money. Prices can be changed in App
Store Connect at any time; the coin amounts live on the server (`server/src/iap.rs`).

Each product needs a display name, a description and a review screenshot (a screenshot of the
shop's **Get coins** tab is fine).

## Turning purchases on in the game server

The packs only appear in the app when the server has an App Store key. In App Store Connect →
**Users and Access → Integrations → In-App Purchase**, generate a key and download the `.p8` file
(you can only download it once). Then start the server with:

```sh
FT_APPLE_ISSUER_ID=...        # shown on that page
FT_APPLE_KEY_ID=...           # the key's id
FT_APPLE_KEY_FILE=/secrets/AuthKey_XXXX.p8
FT_APPLE_BUNDLE_ID=com.fivetrails.app
FT_ALLOWED_ORIGINS=https://YOUR-SITE,capacitor://localhost
```

`capacitor://localhost` is the address the iPhone app connects from; without it the server refuses the
app's connection. Also set **App Store Server Notifications** (Version 2) to
`https://YOUR-GAME-SERVER/apple/notifications`, so refunds take the coins back.

More detail: the game repository's README, section *In-app purchases*.

## Testing purchases

1. App Store Connect → **Users and Access → Sandbox** → add a tester (use an email that is not an
   Apple ID).
2. On the iPhone: **Settings → App Store → Sandbox Account** → sign in with the tester.
3. Run the app from Xcode, open the shop → **Get coins**, buy a pack. Sandbox purchases are free.
4. Coins should land in the piggy bank a moment later. If not, check the server log for
   `App Store purchase paid` or an error about the key.

TestFlight builds also use sandbox purchases. To refuse them on a live server set `FT_APPLE_SANDBOX=0`
(not recommended until after App Review, which uses sandbox purchases too).

## Updating the game inside the app

```sh
npm run update-game        # pull the latest game into game/
FT_SERVER_URL=wss://YOUR-GAME-SERVER/ws npm run sync
git commit -am "Update the game" && git push
```

Then in Xcode raise the **Build** number and **Product → Archive** to upload a new version.

## Before submitting to the App Store

- App icon: `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` (1024×1024, no
  transparency). A simple one in the game's colours is included; replace it with a designed icon.
- Launch screen: `ios/App/App/Assets.xcassets/Splash.imageset/`.
- Privacy: the app stores a player name and progress on your server, and makes no tracking or ads
  calls. Fill in App Privacy in App Store Connect accordingly, and add a privacy policy URL.
- The app is set to portrait only and declares that it uses no non-exempt encryption
  (`ITSAppUsesNonExemptEncryption = false`), which avoids the export-compliance question on upload.
