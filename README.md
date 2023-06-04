[![Netlify Status](https://api.netlify.com/api/v1/badges/f8ef64eb-39f9-46c6-b042-635a8704cc42/deploy-status)](https://app.netlify.com/sites/kinopio-client/deploys)

# kinopio-client

<img src="./src/assets/logo-base.png" alt="logo" width="200">

The place for people to tap, drag, and smile.

## Install

```
git clone https://github.com/pketh/kinopio-client.git
cd kinopio-client
npm install
npm install -g @vue/cli
npm install -g hostile
hostile set localhost kinopio.local
```

## Run

```
$ npm run serve
$ https://kinopio.local:8080
```

## Debugging

	npm run lint

Use the [Vue devtools](https://github.com/vuejs/vue-devtools) for Firefox and Chrome. For Safari, uncomment code in `main.js` then,

	./node_modules/.bin/vue-devtools

## Primary Files

| File | Description |
| ------------- |-------------|
| `router` | Client-side routes |
| `App.vue` | Root component, used by all routes|
| `store.js` | [Vuex](https://vuex.vuejs.org/) store, contains global observables and methods needed by multiple components |
| `utils.js` | Functional methods that just do dom manipulations or common tasks. These can't access components or store directly |
| `views/Space.vue` | Contains the core interaction layer which sends user inputs to painting, connecting, dragging etc. components. Also where new connections are created and checked to see if they connect |
| `views/Add.vue` | `kinopio.club/add` page for browser extensions and iOS share sheet |
| `components/Card.vue` | Displays cards from the `store`, and shows `CardDetails` |
| `components/Connection.vue` | Displays connections from the `store`, and shows `ConnectionDetails` |
| `components/Header.vue` | Used for moving between spaces, searching/filter, shows user presence, changing user prefs, and Kinopio meta options. Shown on all routes |
| `components/layers/MagicPaint.vue` | The layers used for animating painting, scroll locking on touch, and more with `<canvas>`. As well as for multiple card and connection selection which reveals `MultipleSelectedActions` |

## How to update the Hello Kinopio Space

The hello space serves as the entry point and marketing page for new users. It's generated within the app from `hello.json`.

To update it, create the space and export it's json. Replace `hello.json` with the exported new json. Be sure to edit the following fields:

| Special Fields | Value
| ------------- |-------------|
| `id` | `''` |
| `name` | `Hello Kinopio` |
| `users` | `[]` |
| `collaborators` | `[]` |
| `spectators` | `[]` |
| `clients` | `[]` |
| `privacy` | `private` |
| `collaboratorKey` | `''` |
| `url` | remove |
| `originSpaceId` | remove |
| `editedAt` | remove |
| `editedByUserId` | remove |
| `createdAt` | remove |
| `updatedAt` | remove |
| `updateHash` | remove |
| `visits` | `0` |
| `showInExplore` | `false` |
| `showInExploreUpdatedAt` | `null` |
| `isTemplate` | `false` |

item `userId`s should be `euGhpBrR9eBcjKnK16C_g`

## HTTPS Signing

> You shouldn't need to run this or update the cert until 2025, but just in case

To work with code that only works on https (e.g. clipboard copy and paste), [mkcert](https://github.com/FiloSottile/mkcert) was used to create a local ssl certificate

	$ mkdir -p .cert && mkcert -key-file ./.cert/key.pem -cert-file ./.cert/cert.pem 'kinopio.local'

## Ngrok tunnelling

use Ngrok to pipe your localhost through an external https server

(Note that dev kinopio-server connections won't work through Ngrok)

### Setup Ngrok

[login](http://ngrok.com) and download ngrok, then connect ngrok to the kinopio ngrok account

    $ ./ngrok authtoken 1e2pCpJsJMwkEkqbDKF0p5eMArQ_5Ztb7NE8fqyftCnuizdab

### Run Ngrok

    $ ./ngrok http https://localhost:8080

## See Also

- [are.na/kinopio](https://www.are.na/kinopio)
- [github.com/kinopio-club](https://github.com/kinopio-club)

