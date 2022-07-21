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
$ http://kinopio.local:8080
```

## Debugging

	npm run lint

Use the [Vue devtools](https://github.com/vuejs/vue-devtools) for Firefox and Chrome. For Safari, uncomment code in `main.js` then,

	./node_modules/.bin/vue-devtools

### Setup Ngrok

[login](http://ngrok.com) and download ngrok, then connect ngrok to the kinopio ngrok account

    $ ./ngrok authtoken 1e2pCpJsJMwkEkqbDKF0p5eMArQ_5Ztb7NE8fqyftCnuizdab

### Using Ngrok

    $ ./ngrok http 8080

## Primary Files

| File | Description |
| ------------- |-------------|
| `router` | Client-side routes |
| `App.vue` | Root component, used by all routes|
| `store.js` | [Vuex](https://vuex.vuejs.org/) store, contains global observables and methods needed by multiple components |
| `utils.js` | Functional methods that just do dom manipulations or common tasks. These can't access components or store directly |
| `views/Space.vue` | Contains the core interaction layer which sends user inputs to painting, connecting, dragging etc. components. Also where new connections are created and checked to see if they connect |
| `views/Add.vue` | `kinopio.club/add` page for browser extensions |
| `components/Card.vue` | Displays cards from the `store`, and shows `CardDetails` |
| `components/Connection.vue` | Displays connections from the `store`, and shows `ConnectionDetails` |
| `components/Header.vue` | Used for moving between spaces, searching/filter, shows user presence, changing user prefs, and Kinopio meta options. Shown on all routes |
| `components/layers/MagicPaint.vue` | The layers used for animating painting, scroll locking on touch, and more with `<canvas>`. As well as for multiple card and connection selection which reveals `MultipleSelectedActions` |

## See Also

- [are.na/kinopio](https://www.are.na/kinopio)
- [github.com/kinopio-club](https://github.com/kinopio-club)
