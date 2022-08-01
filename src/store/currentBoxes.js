// import utils from '@/utils.js'
import cache from '@/cache.js'

import { nanoid } from 'nanoid'
// import randomColor from 'randomcolor'
// import last from 'lodash-es/last'
// import uniq from 'lodash-es/uniq'

// normalized state
// https://github.com/vuejs/vuejs.org/issues/1636

let currentSpaceId

export default {
  namespaced: true,
  state: {
    // ids: [],
    // boxes: {}
    ids: ['123abc'],
    boxes: {
      '123abc': {
        id: '123abc',
        name: 'blah',
        x: 200,
        y: 200,
        resizeWidth: 200,
        resizeHeight: 200,
        color: 'pink',
        fill: 'empty',
        spaceId: 'WwqDhJVhJZQ4Dtmlx3S_c'
      }
    }
  },
  mutations: {

    // init

    clear: (state) => {
      state.ids = []
      state.boxes = {}
    },
    restore: (state, boxes) => {
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
    // updateReadOnly: (state, box) => {
    //   const keys = Object.keys(box)
    //   keys.forEach(key => {
    //     state.boxes[box.id][key] = box[key]
    //   })
    // },

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

    // create

    add: (context, { box }) => {
      box.id = box.id || nanoid()
      box.spaceId = currentSpaceId
      box.userId = context.rootState.currentUser.id
      context.commit('create', box)
      // context.dispatch('api/addToQueue', { name: 'createbox', body: box }, { root: true })
      // context.dispatch('broadcast/update', { updates: box, type: 'addbox', handler: 'currentboxes/create' }, { root: true })
      context.dispatch('history/add', { boxes: [box] }, { root: true })
    },

    // update

    update: (context, box) => {
      context.dispatch('history/add', { boxes: [box] }, { root: true })
      console.log('🍅', box)
      context.commit('update', box)
      // context.dispatch('api/addToQueue', { name: 'updatebox', body: box }, { root: true })
      // context.dispatch('broadcast/update', { updates: box, type: 'updateboxTypeForbox', handler: 'currentboxes/update' }, { root: true })
    },
    // updatePathsWhileDragging: (context, { boxes, cards }) => {
    //   boxes.forEach(box => {
    //     const path = utils.boxBetweenCards(box.startCardId, box.endCardId)
    //     const element = document.querySelector(`svg .box-path[data-id='${box.id}']`)
    //     const updates = { boxId: box.id, path }
    //     context.commit('triggerUpdateboxPathWhileDragging', updates, { root: true })
    //     context.dispatch('broadcast/update', { updates, type: 'updatebox', handler: 'triggerUpdateboxPathWhileDragging' }, { root: true })
    //     element.setAttribute('d', path)
    //   })
    // },

    // remove

    remove: (context, box) => {
      context.dispatch('api/addToQueue', { name: 'removebox', body: box }, { root: true })
      context.dispatch('broadcast/update', { updates: box, type: 'removebox', handler: 'currentboxes/remove' }, { root: true })
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
