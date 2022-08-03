// import utils from '@/utils.js'
import cache from '@/cache.js'

import { nanoid } from 'nanoid'
import randomColor from 'randomcolor'
// import last from 'lodash-es/last'
// import uniq from 'lodash-es/uniq'

// normalized state
// https://github.com/vuejs/vuejs.org/issues/1636

let currentSpaceId

export default {
  namespaced: true,
  state: {
    ids: [],
    boxes: {}
  },
  mutations: {

    // init

    clear: (state) => {
      state.ids = []
      state.boxes = {}
    },
    restore: (state, boxes) => {
      console.log(boxes)
      let ids = []
      boxes.forEach(box => {
        ids.push(box.id)
        state.boxes[box.id] = box
      })
      state.ids = state.ids.concat(ids)
    },

    // create

    create: (state, box) => {
      state.ids.push(box.id)
      state.boxes[box.id] = box
      cache.updateSpace('boxes', state.boxes, currentSpaceId)
    },

    // update

    update: (state, box) => {
      const keys = Object.keys(box)
      keys.forEach(key => {
        state.boxes[box.id][key] = box[key]
      })
      cache.updateSpace('boxes', state.boxes, currentSpaceId)
    },

    // broadcast

    // updatePathsBroadcast: (state, { boxes }) => {
    //   boxes.forEach(box => {
    //     state.boxes[box.id].path = box.path
    //   })
    //   cache.updateSpaceboxesDebounced(state.boxes, currentSpaceId)
    // },

    // remove

    remove: (state, boxToRemove) => {
      if (!boxToRemove) { return }
      const box = state.boxes[boxToRemove.id]
      if (!box) { return }
      state.ids = state.ids.filter(id => id !== box.id)
      delete state.boxes[box.id]
      cache.updateSpace('boxes', state.boxes, currentSpaceId)
    }
  },
  actions: {

    // init

    updateSpaceId: (context, spaceId) => {
      currentSpaceId = spaceId
    },
    mergeUnique: (context, newBoxes) => {
      newBoxes.forEach(newBox => {
        let shouldUpdate
        let prevBox = context.getters.byId(newBox.id)
        let box = { id: newBox.id }
        let keys = Object.keys(newBox)
        keys = keys.filter(key => key !== 'id')
        keys.forEach(key => {
          if (prevBox[key] !== newBox[key]) {
            box[key] = newBox[key]
            shouldUpdate = true
          }
        })
        if (!shouldUpdate) { return }
        context.commit('update', box)
      })
    },
    mergeRemove: (context, removeBoxes) => {
      removeBoxes.forEach(box => {
        context.commit('remove', box)
      })
    },

    // create

    add: (context, { box, shouldResize }) => {
      const count = context.state.ids.length
      const minBoxSize = 70
      box = {
        id: box.id || nanoid(),
        spaceId: currentSpaceId,
        userId: context.rootState.currentUser.id,
        x: box.x,
        y: box.y,
        resizeWidth: box.resizeWidth || minBoxSize,
        resizeHeight: box.resizeHeight || minBoxSize,
        color: randomColor({ luminosity: 'light' }),
        fill: 'filled', // empty, filled
        name: box.name || `Box ${count}`
      }
      context.commit('create', box)
      context.dispatch('api/addToQueue', { name: 'createBox', body: box }, { root: true })
      // context.dispatch('broadcast/update', { updates: box, type: 'addBox', handler: 'currentboxes/create' }, { root: true })
      context.dispatch('history/add', { boxes: [box] }, { root: true })
      if (shouldResize) {
        context.commit('currentUserIsResizingBox', true, { root: true })
        context.commit('currentUserIsInteractingBoxId', box.id, { root: true })
      }
    },

    // update

    update: (context, box) => {
      context.dispatch('history/add', { boxes: [box] }, { root: true })
      context.commit('update', box)
      context.dispatch('api/addToQueue', { name: 'updateBox', body: box }, { root: true })
      // context.dispatch('broadcast/update', { updates: box, type: 'updateBox', handler: 'currentboxes/update' }, { root: true })
    },

    // remove

    remove: (context, box) => {
      context.dispatch('api/addToQueue', { name: 'removeBox', body: box }, { root: true })
      // context.dispatch('broadcast/update', { updates: box, type: 'removeBox', handler: 'currentboxes/remove' }, { root: true })
      context.commit('remove', box)
      context.dispatch('history/add', { boxes: [box], isRemoved: true }, { root: true })
    }
  },
  getters: {
    byId: (state) => (id) => {
      return state.boxes[id]
    },
    all: (state) => {
      return state.ids.map(id => state.boxes[id])
    }
  }
}
