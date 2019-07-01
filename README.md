[![Netlify Status](https://api.netlify.com/api/v1/badges/f8ef64eb-39f9-46c6-b042-635a8704cc42/deploy-status)](https://app.netlify.com/sites/kinopio-client/deploys)

# kinopio-client

<img src="./src/assets/logo.png" alt="logo" width="200">

The place for people to tap and smile.

## Install

```
git clone https://github.com/kinopio-club/kinopio-client.git
cd kinopio-client
npm install
```

## Run

```
vue ui
Admin: http://localhost:8000
App: http://localhost:8080
```

## Primary Files

| File | Description |
| ------------- |-------------|
| `router` | Client-side routes |
| `App.vue` | Root component, used by all routes|
| `store.js` | [Vuex](https://vuex.vuejs.org/) store, contains global observables and methods needed by multiple components |
| `utils.js` | Functional methods that just do dom manipulations or common tasks. These can't access components or store directly |
| `views/Space.vue` | Contains the core interaction layer which sends user inputs to painting, connecting, dragging etc. components. Also where new connections are created and checked to see if they connect |
| `components/Block.vue` | Displays blocks from the `store`, and shows `BlockDetails` |
| `components/Connection.vue` | Displays connections from the `store`, and shows `ConnectionDetails` |
| `components/Header.vue` | Used for moving between spaces, searching/filter, shows user presence, changing user prefs, and Kinopio meta options. Shown on all routes |
| `components/MagicPaint.vue` | The canvas layers used for animating painting, scroll locking on touch, and more. As well as for multi-block selection which reveals `MultipleBlockActions` |


## See Also

- [are.na/kinopio](https://www.are.na/kinopio)
- [github.com/kinopio-club](https://github.com/kinopio-club)
