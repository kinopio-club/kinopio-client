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
    createType: (state, type) => {
      state.typeIds.push(type.id)
      state.types[type.id] = type
      cache.updateSpace('boxTypes', state.types, currentSpaceId)
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

    // updatePathsWhileDraggingBroadcast: (state, { boxes }) => {
    //   boxes.forEach(box => {
    //     const path = utils.boxBetweenCards(box.startCardId, box.endCardId)
    //     const element = document.querySelector(`svg .box-path[data-id='${box.id}']`)
    //     element.setAttribute('d', path)
    //   })
    // },
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

    add: (context, { box, type, shouldNotRecordHistory }) => {
      const isExistingPath = context.getters.isExistingPath({
        startCardId: box.startCardId,
        endCardId: box.endCardId
      })
      if (isExistingPath) { return }
      if (box.startCardId === box.endCardId) { return }
      type = type || context.getters.typeForNewboxes
      box.id = box.id || nanoid()
      box.spaceId = currentSpaceId
      box.userId = context.rootState.currentUser.id
      box.boxTypeId = type.id
      context.dispatch('api/addToQueue', { name: 'createbox', body: box }, { root: true })
      context.dispatch('broadcast/update', { updates: box, type: 'addbox', handler: 'currentboxes/create' }, { root: true })
      if (!shouldNotRecordHistory) {
        context.dispatch('history/add', { boxes: [box] }, { root: true })
      }
      context.commit('create', box)
    },

    // update

    update: (context, box) => {
      context.dispatch('history/add', { boxes: [box] }, { root: true })
      context.commit('update', box)
      context.dispatch('api/addToQueue', { name: 'updatebox', body: box }, { root: true })
      context.dispatch('broadcast/update', { updates: box, type: 'updateboxTypeForbox', handler: 'currentboxes/update' }, { root: true })
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
      // return state.ids.map(id => state.boxes[id])
      return [
        {
          id: '123',
          name: 'blah',
          x: 200,
          y: 200,
          width: 200,
          height: 200,
          color: 'pink'
        }
      ]
    }
  }
}
