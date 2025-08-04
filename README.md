[![Netlify Status](https://api.netlify.com/api/v1/badges/f8ef64eb-39f9-46c6-b042-635a8704cc42/deploy-status)](https://app.netlify.com/sites/kinopio-client/deploys)

# kinopio-client

<img src="./src/assets/logo-base.png" alt="logo" width="200">

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

## Run with Production API Server

You can force the local app to use the prod API by editing `.env.local` so that `VITE_PROD_SERVER=true`. Create `env.local` by duplicating and renaming `.env.local.sample`.

When the app starts up, the `🐸 kinopio-server URL` will be displayed in the browser logs.

## Linting

	npm run lint

Use the [Vue devtools](https://github.com/vuejs/vue-devtools) for Firefox and Chrome. For Safari, uncomment code in `main.js` then,

	./node_modules/.bin/vue-devtools

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
| `components/layers/PaintSelectCanvas.vue` | The layers used for drawing the paint strokes for multiple card and connection selection which reveals `MultipleSelectedActions`, scroll locking on touch, and other `<canvas>` elements that need to cover the viewport |
| `components/NewBlankTemplate.vue` | Template file for new components |
| `components/NewBlankDialogTemplate.vue` | Template file for new dialog components |

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

## HTTPS Signing

> You shouldn't need to run this or update the cert until 2025, but just in case

To work with code that only works on https (e.g. clipboard copy and paste), [mkcert](https://github.com/FiloSottile/mkcert) was used to create a local ssl certificate

    brew install mkcert
    mkcert -install
	mkcert -key-file ./.cert/key.pem -cert-file ./.cert/cert.pem "kinopio.local" "localhost" "127.0.0.1"

## Testing page-meta

`page-meta.js` is an [edge function](https://www.netlify.com/platform/core/functions/) that runs in an isolated server-side container before page requests. It writes `index.html` metatags for title, description etc. for crawlers.

I couldn't figure out how to run the netlify-cli locally, so instead I test this in staging using PR deploy URLs. 

To view the logs: 

Netlify website → Deploys → Edge Functions

## Static Pages use Static-Site Generation (SSG)

[`vite-ssg`](https://github.com/antfu-collective/vite-ssg) is used to generate static HTML files of static page routes in `views/`, to make them accessible to robots/SEO.

Routes that should get statically generated at build time (`npm run build`) are defined in `vite.config.js` in `ssgOptions.includedRoutes`. Included routes will get rendered by the server at build time. The generated HTML for each page will get stored as static HTML file.

To include/exclude code execution on the server-side we can use [`import.meta.env.SSR`](https://vite.dev/guide/env-and-mode.html#built-in-constants) for JavaScript and [`ClientOnly`](https://github.com/antfu-collective/vite-ssg?tab=readme-ov-file#clientonly) in Vue component templates.

## See Also

- [are.na/kinopio/kinopio-design](https://www.are.na/kinopio/kinopio-design)
- [github.com/kinopio-club](https://github.com/kinopio-club)
- [User Forums](https://forum.kinopio.club)
- [Discord](https://kinopio.club/discord)
