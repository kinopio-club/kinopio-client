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
| `router` | client-side routes |
| `App.vue` | root component, used by all routes|
| `store.js` | vuex store, contains global observables and methods needed by multiple components |
| `utils.js` | low-level functional methods that just do dom manipulations or common tasks. These can't access components or store directly |
| `views/Space.vue` | contains the core interaction layer which sends user inputs to inking, connecting, dragging etc. components |
| `components/Block.vue` | renders blocks from the `store`, and shows `BlockDetails` |
| `components/Connection.vue` | renders connections from the `store`, and shows `ConnectionDetails` |
| `components/Header.vue` | shown on all routes. Used for moving between spaces, searching/filter, shows user presence, changing user prefs, and Kinopio meta options |
| `components/MagicInk.vue` | the canvas layer used for animating inking, long-press for scroll locking on touch, and multi-selection which reveals `MultipleBlockActions` |


## See Also

- [Are.na](https://www.are.na/kinopio)
- [Github](https://github.com/kinopio-club)
