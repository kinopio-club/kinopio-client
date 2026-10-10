[![Netlify Status](https://api.netlify.com/api/v1/badges/f8ef64eb-39f9-46c6-b042-635a8704cc42/deploy-status)](https://app.netlify.com/sites/kinopio-client/deploys)

# kinopio-client

<img src="./src/assets/logos/logo-base.png" alt="logo" width="200">

Kinopio is a spatial thinking canvas for your new ideas and hard problems.

The `kinopio-client` is the client web app that users use to read and update spaces, cards, connections, etc. – which is saved to localStorage and to the `kinopio-server` via API requests, queued API operations, and websocket broadcasts.

- [Kinopio Architecture and Costs](https://kinopio.club/JOGXFJ0FEMpS3crbh6U9k)
- [How Kinopio is Made](https://pketh.org/how-kinopio-is-made.html) (How data is saved)
- [Discord](https://kinopio.club/discord)

## Install

    git clone https://github.com/pketh/kinopio-client.git
    cd kinopio-client
    npm install
    npm install -g @vue/cli
    npm install -g hostile
    hostile set localhost kinopio.local

## Run

    npm run dev --host
    https://kinopio.local:8080

## Run Tests

    npm run test

## Run with Production API Server

You can force the local app to use the prod API by editing `.env.local` so that `VITE_PROD_SERVER=true`. Create `env.local` by duplicating and renaming `.env.local.sample`.

When the app starts up, the `🐸 kinopio-server URL` will be displayed in the browser logs.

## Linting

Linting runs on commit, but you can manually run it with

	npm run lint

## Primary Files

| File | Description |
| ------------- |-------------|
| `main.js` | Entry point, inits router |
| `router`  | Handles static page and app routes |
| `App.vue` | Root component, used by all routes|
| `stores/useGlobalStore.js` | [Pinia](https://pinia.vuejs.org//) store with global interaction state |
| `stores/useSpaceStore.js` | Pinia store module that handles loading spaces. Each item type in a space has it's own store, e.g. `useCardStore.js`, `useBoxStore.js`, …
| `utils.js` | Functional methods that just do dom manipulations or common tasks. These can't access components or store directly |
| `views/Space.vue` | Contains the core interaction layer which sends user inputs to painting, connecting, dragging etc. components. Also where new connections are created and checked to see if they connect |
| `views/Add.vue` | `kinopio.club/add` page for browser extensions and iOS share sheet |
| `components/Card.vue` | Displays cards from `cardStore` |
| `components/Connection.vue` | Displays connections from `connectionStore` |
| `components/Box.vue` | Displays boxes from `boxStore` |
| `components/Header.vue` | Used for moving between spaces, searching/filter, shows user presence, changing user prefs, and Kinopio meta options. Shown on all routes |
| `components/layers/PaintSelectCanvas.vue` | Paint select strokes for multiple card and connection selection which reveals `MultipleSelectedActions`, scroll locking on touch, and other `<canvas>` elements that need to cover the viewport |
| `components/layers/DrawingStrokes.vue` | Space drawing strokes

## Blank Template Files

Use these as a starting point for new vue components,

| File | Description |
| ------------- |-------------|
| `components/NewBlankTemplate.vue` | Template file for new components |
| `components/NewBlankDialogTemplate.vue` | Template file for new dialog components |
| `components/NewBlankPageTemplate.vue` | Template file for new static SSG pages |

## User States to Design For

| State | Description |
| ------------- |-------------|
| `offline` | indexedDB and API queue operations only |
| `not signed in` | indexedDB only |
| `space is read only` | cannot add cards or edit |
| `space is open` | can add cards, can only edit cards they created |
| `mobile` | touch handlers, no hover, small screen |
| `desktop zoom out` | using the zoom bar or cmd+/- |
| `pinch zoom out/in` | using native touch gesture on mobile |
| `group member or admin` | can see and edit all spaces in the group |

## Post Messages

Post messages are used to communicate with a parent `secureAppContext` environment, such as the iOS app that wraps the website in a child webview.

## How to update the 'Hello Kinopio' Space

The hello space serves as the entry point and marketing page for new users. It's generated within the app from `hello.json`.

To update it, create the space and export its json. Replace the contents of`hello.json` with the new json file.

## How to update the Changelog and "What's New"

[Instructions here](https://kinopio.club/how-to-update-changelog-oi4jZTSI_eAEvov9XbjJM)

## How to Update Blog

Blog posts are markdown files in `src/blog`. Adding one publishes it: `src/blog/my-post.md` becomes `/blog/my-post`, and gets prerendered to its own static html file so robots and link unfurlers see the full post.

Post media lives on the `kinopio-updates` linode s3 bucket, referenced with cdn urls (e.g. `https://updates.kinopio.club/pages/blog/...`

## How to Update Help

Just like the blog, help posts are statically compiled markdown files in `src/help`

## HTTPS Signing

> You shouldn't need to run this or update the cert until 2025, but just in case

To work with code that only works on https (e.g. clipboard copy and paste), [mkcert](https://github.com/FiloSottile/mkcert) was used to create a local ssl certificate

    brew install mkcert
    mkcert -install
    mkdir ./.cert
	mkcert -key-file ./.cert/key.pem -cert-file ./.cert/cert.pem "kinopio.local" "localhost" "127.0.0.1"

## Pre-rendered Pages (Static-Site Generation, SSG)

During the deploy/build process (`npm run build`), [`vite-ssg`](https://github.com/antfu-collective/vite-ssg) generates static HTML pages of routes defined in `vite.config.js` in `ssgOptions.includedRoutes`. Static pages (compiled from vue router into `/dist`) are served to the client directly. The client only goes through vue router for non-static routes like `/app`.

For unfurling, specify static pages in `page-meta.js`.

To test pre-rendered page routes use `npm run build-dev`.

## Testing page-meta

`/edge-functions/page-meta.js` is an [edge function](https://www.netlify.com/platform/core/functions/) that runs in an isolated server-side container before page requests. It writes `index.html` metatags for title, description etc. for crawlers.

I couldn't figure out how to run the netlify-cli locally, so instead I test this in staging using PR deploy URLs.

To view the logs:

    Netlify project → Deploys → Choose PR deployment → Edge Functions

(`Edge Functions` is only visible after deployment is complete)

## Netlify Prerender

The prerender extension in Netlify compiles space URLs into static html, so that they're scannable by search engines which can't run client js.

## See Also

- [are.na/kinopio/kinopio-design](https://www.are.na/kinopio/kinopio-design)
- [github.com/kinopio-club](https://github.com/kinopio-club)
- [User Forums](https://forum.kinopio.club)
- [Discord](https://kinopio.club/discord)

-------

# Tauri

A [native](https://tauri.app) wrapper around the website, it lives in `src-tauri`. It only needs to be rebuilt when the files in `src-tauri` change.

## Files

| File | Description |
| ------------- |-------------|
| `src-tauri/tauri.conf.json` | App name, identifier, window size, dev and production URLs |
| `src-tauri/src/lib.rs` | Creates windows and tabs, menu, opens external links in the system browser |
| `src-tauri/src/init.js` | Script injected into the website by the desktop app, handles link clicks and key events |
| `src-tauri/dev-runner.sh` | Used by `npm run desktop` to name the dev app `[DEV] Kinopio` in the dock |
| `src-tauri/notarize-dmg.js` | Runs after `npm run desktop:build` to notarize and staple the `.dmg` |
| `src-tauri/update-files.js` | Runs after `npm run desktop:build` to collect the files for an app update |

## Install

Building the desktop app needs Rust and the Xcode command line tools

    xcode-select --install
    brew install rustup
    rustup default stable

Homebrew doesn't add Rust to your PATH, so add this to `~/.bash_profile` or `~/.zshrc`

    export PATH="/opt/homebrew/opt/rustup/bin:$PATH"

## Run Development

Make sure `npm run dev` is already running, then in another terminal

    npm run desktop

Changes to `src-tauri` rebuild and relaunch the app automatically.

## Build Production

    npm run desktop:build

Builds for the architecture of your Mac, and outputs to `src-tauri/target/release/bundle/…`

## Sign and Notarize

Without signing, the built app only opens on your own Mac. To distribute it you need a `Developer ID Application` certificate from your Apple Developer account (Xcode → Settings → Accounts → Manage Certificates), and an [app-specific password](https://account.apple.com) for notarization.

Find the name of your certificate with

    security find-identity -v -p codesigning

Then add these to `.env.local`, which `npm run desktop:build` loads. The app is signed, notarized, and stapled as part of the build. The tauri build only notarizes the `.app`, so after it finishes `src-tauri/notarize-dmg.js` runs automatically to notarize and staple the `.dmg` too. Notarizing uploads to Apple and can take a few minutes.

    APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAMID)"
    APPLE_ID=you@example.com
    APPLE_PASSWORD=app-specific-password
    APPLE_TEAM_ID=TEAMID

Check that the built app and dmg are signed and notarized with

    spctl -a -vv src-tauri/target/release/bundle/macos/Kinopio.app
    spctl -a -vv -t open --context context:primary-signature src-tauri/target/release/bundle/dmg/*.dmg

Both should say `accepted` and `source=Notarized Developer ID`.

In `.env.local` specify 

    TAURI_SIGNING_PRIVATE_KEY=/Users/you/.tauri/kinopio.key
    TAURI_SIGNING_PRIVATE_KEY_PASSWORD=

The key has no password, but the blank password line is needed, otherwise the build stops to ask for one.

The same private key at `~/.tauri/kinopio.key` needs to be on every machine that builds the app. 

## Ship an Update

1. Increase `version` in `src-tauri/tauri.conf.json`
2. Build the app with `npm run desktop:build`. This also builds the update files for previous versions
3. Upload the app dmg in `src-tauri/target/release/bundle/dmg`, and the update files in `src-tauri/target/update` to the `kinopio-updates/desktop` bucket
4. Rename app to `kinopio.dmg` 

The app checks `https://updates.kinopio.club/desktop/latest.json` when it launches, and every 6 hours after that. If the version there is newer than its own, it silently downloads and installs the update, which is used the next time the app is launched.

## Icons

App icons in `src-tauri/icons` are generated using

    npx tauri icon src-tauri/app-icon.png
