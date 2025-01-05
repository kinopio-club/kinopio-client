import cache from '@/cache.js'
import utils from '@/utils.js'
import consts from '@/consts.js'

import { nanoid } from 'nanoid'
import randomColor from 'randomcolor'
import uniq from 'lodash-es/uniq'
import { nextTick } from 'vue'

// normalized state
// https://github.com/vuejs/vuejs.org/issues/1636

let currentSpaceId
let prevMovePositions = {}

export default {
  namespaced: true,
  state: {
    ids: [],
    lists: {},
    newListColor: randomColor({ luminosity: 'dark' })
  },
  mutations: {

    // init

    clear: (state) => {
      state.ids = []
      state.lists = {}
    },
    restore: (state, lists) => {
      let ids = []
      lists.forEach(list => {
        ids.push(list.id)
        state.lists[list.id] = list
      })
      state.ids = state.ids.concat(ids)
    },

    // create

    create: (state, list) => {
      state.ids.push(list.id)
      state.lists[list.id] = list
      cache.updateSpace('lists', state.lists, currentSpaceId)
    },

    // update

    update: (state, list) => {
      const keys = Object.keys(list)
      keys.forEach(key => {
        state.lists[list.id][key] = list[key]
      })
      cache.updateSpace('lists', state.lists, currentSpaceId)
    },
    move: (state, { lists, spaceId }) => {
      lists.forEach(list => {
        state.lists[list.id].x = list.x
        state.lists[list.id].y = list.y
      })
      cache.updateSpaceListsDebounced(state.lists, currentSpaceId)
    },
    snapGuides: (state, value) => {
      state.snapGuides = value
    },
    resizeWhileDragging: (state, { lists, shouldSnapToGrid }) => {
      lists.forEach(list => {
        const element = utils.listElementFromId(list.id)
        if (!element) { return }
        if (element.dataset.isVisibleInViewport === 'false') { return }
        if (shouldSnapToGrid) {
          element.style.width = utils.roundToNearest(list.resizeWidth) + 'px'
          element.style.height = utils.roundToNearest(list.resizeHeight) + 'px'
        } else {
          element.style.width = list.resizeWidth + 'px'
          element.style.height = list.resizeHeight + 'px'
        }
        element.dataset.resizeWidth = list.resizeWidth
        element.dataset.resizeHeight = list.resizeHeight
      })
    },
    moveWhileDragging: (state, { lists }) => {
      lists.forEach(list => {
        const element = document.querySelector(`.list[data-list-id="${list.id}"]`)
        if (!element) { return }
        if (element.dataset.isVisibleInViewport !== 'false') {
          element.style.left = list.x + 'px'
          element.style.top = list.y + 'px'
        }
        element.dataset.x = list.x
        element.dataset.y = list.y
      })
    },

    // broadcast

    moveBroadcast: (state, { lists }) => {
      lists.forEach(updated => {
        const list = state.lists[updated.id]
        if (!list) { return }
        list.x = updated.x
        list.y = updated.y
      })
      cache.updateSpaceListsDebounced(state.lists, currentSpaceId)
    },

    // remove

    remove: (state, listToRemove) => {
      if (!listToRemove) { return }
      const list = state.lists[listToRemove.id]
      if (!list) { return }
      state.ids = state.ids.filter(id => id !== list.id)
      delete state.lists[list.id]
      cache.updateSpace('lists', state.lists, currentSpaceId)
    }
  },
  actions: {

    // init

    updateSpaceId: (context, spaceId) => {
      currentSpaceId = spaceId
    },
    mergeUnique: (context, { newItems, itemType }) => {
      newItems.forEach(newdList => {
        let shouldUpdate
        let prevdList = context.getters.byId(newdList.id)
        let list = { id: newdList.id }
        let keys = Object.keys(newdList)
        keys = keys.filter(key => key !== 'id')
        keys.forEach(key => {
          if (prevdList[key] !== newdList[key]) {
            list[key] = newdList[key]
            shouldUpdate = true
          }
        })
        if (!shouldUpdate) { return }
        context.commit('update', list)
      })
    },
    mergeRemove: (context, { removeItems, itemType }) => {
      removeItems.forEach(list => {
        context.commit('remove', list)
      })
    },

    // create

    add: async (context, { list, shouldResize }) => {
      const count = context.state.ids.length
      const mindListSize = consts.mindListSize
      const isThemeDark = context.rootState.currentUser.theme === 'dark'
      const color = randomColor({ luminosity: 'dark' })
      list = {
        id: list.id || nanoid(),
        spaceId: currentSpaceId,
        userId: context.rootState.currentUser.id,
        x: list.x,
        y: list.y,
        resizeWidth: list.resizeWidth || mindListSize,
        resizeHeight: list.resizeHeight || mindListSize,
        color: list.color || color,
        fill: list.fill || 'filled', // empty, filled
        name: list.name || `dList ${count}`,
        infoHeight: 57,
        infoWidth: 34,
        headerFontId: context.rootState.currentUser.prevHeaderFontId || 0
      }
      context.dispatch('history/add', { lists: [list] }, { root: true })
      context.commit('create', list)
      context.dispatch('broadcast/update', { updates: list, type: 'createdList', handler: 'currentLists/create' }, { root: true })
      if (shouldResize) {
        context.dispatch('history/pause', null, { root: true })
        context.commit('currentUserIsResizingdList', true, { root: true })
        context.commit('currentUserIsResizingdListIds', [list.id], { root: true })
      }
      await context.dispatch('api/addToQueue', { name: 'createdList', body: list }, { root: true })
    },

    // update

    update: async (context, list) => {
      context.dispatch('history/add', { lists: [list] }, { root: true })
      context.commit('update', list)
      context.dispatch('broadcast/update', { updates: list, type: 'updatedList', handler: 'currentLists/update' }, { root: true })
      const keys = Object.keys(list)
      const shouldUpdatePathsKeys = ['x', 'resizeWidth']
      let shouldUpdatePaths = keys.find(key => shouldUpdatePathsKeys.includes(key))
      if (shouldUpdatePaths) {
        nextTick(() => {
          context.dispatch('currentConnections/updatePaths', { itemId: list.id }, { root: true })
        })
      }
      await context.dispatch('api/addToQueue', { name: 'updatedList', body: list }, { root: true })
    },
    updateName (context, { list, newName }) {
      const canEditdList = context.rootGetters['currentUser/canEditdList'](list)
      if (!canEditdList) { return }
      context.dispatch('update', {
        id: list.id,
        name: newName
      })
    },
    updateMultiple: async (context, lists) => {
      const spaceId = context.rootState.currentSpace.id
      let updates = {
        lists,
        spaceId: context.rootState.currentSpace.id
      }
      updates.lists.map(list => {
        delete list.userId
        return list
      })
      context.dispatch('history/add', { lists }, { root: true })
      lists.forEach(list => {
        context.dispatch('broadcast/update', { updates: list, type: 'updatedList', handler: 'currentLists/update' }, { root: true })
        context.commit('update', list)
      })
      cache.updateSpace('editedByUserId', context.rootState.currentUser.id, currentSpaceId)
      await context.dispatch('api/addToQueue', { name: 'updateMultipleLists', body: updates }, { root: true })
    },

    // checklists

    // toggleChecked (context, { listId, value }) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   utils.typeCheck({ value: listId, type: 'string' })
    //   const list = context.getters.byId(listId)
    //   let name = list.name
    //   const checklist = utils.checklistFromString(name)
    //   name = name.replace(checklist, '')
    //   if (value) {
    //     name = `[x] ${name}`
    //   } else {
    //     name = `[] ${name}`
    //   }
    //   const update = {
    //     id: listId,
    //     name
    //   }
    //   context.dispatch('update', update)
    // },
    // removeChecked: (context, listId) => {
    //   utils.typeCheck({ value: listId, type: 'string' })
    //   const list = context.getters.byId(listId)
    //   let name = list.name
    //   name = name.replace('[x]', '').trim()
    //   const update = {
    //     id: listId,
    //     name
    //   }
    //   context.dispatch('update', update)
    // },

    // resize

    resize: (context, { listIds, delta }) => {
      let connections = []
      let lists = []
      listIds.forEach(listId => {
        const rect = utils.listElementDimensions({ id: listId })
        let width = rect.width
        let height = rect.height
        width = width + delta.x
        height = height + delta.y
        const list = { id: listId, resizeWidth: width, resizeHeight: height }
        lists.push(list)
        connections = connections.concat(context.rootGetters['currentConnections/byItemId'](list.id))
        context.commit('currentUserIsResizingdList', true, { root: true })
        context.commit('currentUserIsResizingdListIds', [list.id], { root: true })
      })
      context.commit('resizeWhileDragging', { lists, shouldSnapToGrid: context.rootState.shouldSnapToGrid })
      context.dispatch('currentConnections/updatePathsWhileDragging', { connections }, { root: true })
      context.dispatch('broadcast/update', { updates: { lists }, type: 'resizeLists', handler: 'currentLists/resizeWhileDragging' }, { root: true })
    },

    // dimensions

    updateInfoDimensions: async (context, { lists }) => {
      lists = lists || utils.clone(context.getters.all)
      for (const list of lists) {
        const prevDimensions = {
          infoWidth: list.infoWidth,
          infoHeight: list.infoHeight
        }
        const element = document.querySelector(`.list-info[data-list-id="${list.id}"]`)
        if (!element) { return }
        const DOMRect = element.getBoundingClientRect()
        const infoWidth = Math.round(DOMRect.width + 4)
        const infoHeight = Math.round(DOMRect.height)
        const dimensionsChanged = infoWidth !== prevDimensions.infoWidth || infoHeight !== prevDimensions.infoHeight
        const body = {
          id: list.id,
          infoWidth,
          infoHeight
        }
        if (!dimensionsChanged) { return }
        context.commit('update', body)
        await context.dispatch('api/addToQueue', { name: 'updatedList', body }, { root: true })
      }
    },

    // move

    move: (context, { endCursor, prevCursor, delta }) => {
      const zoom = context.rootGetters.spaceCounterZoomDecimal
      if (!endCursor || !prevCursor) { return }
      endCursor = {
        x: endCursor.x * zoom,
        y: endCursor.y * zoom
      }
      if (context.rootState.shouldSnapToGrid) {
        prevCursor = utils.cursorPositionSnapToGrid(prevCursor)
        endCursor = utils.cursorPositionSnapToGrid(endCursor)
      }
      delta = delta || {
        x: endCursor.x - prevCursor.x,
        y: endCursor.y - prevCursor.y
      }
      let lists = context.getters.isSelected
      if (!lists.length) { return }
      lists = lists.filter(list => context.rootGetters['currentUser/canEditdList'](list))
      // prevent lists bunching up at 0
      let connections = []
      lists.forEach(list => {
        if (!list) { return }
        if (!list.x) { list.y = 0 }
        if (!list.y) { list.y = 0 }
        if (list.x === 0) { delta.x = Math.max(0, delta.x) }
        if (list.y === 0) { delta.y = Math.max(0, delta.y) }
        connections = connections.concat(context.rootGetters['currentConnections/byItemId'](list.id))
      })
      lists = lists.filter(list => Boolean(list))
      // prevent lists with null or negative positions
      lists = utils.clone(lists)
      lists = lists.map(list => {
        let position
        if (prevMovePositions[list.id]) {
          position = prevMovePositions[list.id]
        } else {
          position = utils.listPositionFromElement(list.id)
        }
        list.x = position.x
        list.y = position.y
        // x
        if (list.x === undefined || list.x === null) {
          delete list.x
        } else {
          list.x = Math.max(0, list.x + delta.x)
          list.x = Math.round(list.x)
        }
        // y
        if (list.y === undefined || list.y === null) {
          delete list.y
        } else {
          list.y = Math.max(0, list.y + delta.y)
          list.y = Math.round(list.y)
          list.y = Math.max(consts.minItemXY, list.y)
        }
        list = {
          name: list.name,
          x: list.x,
          y: list.y,
          width: list.resizeWidth,
          height: list.resizeHeight,
          id: list.id
        }
        prevMovePositions[list.id] = list
        return list
      })
      // update
      context.commit('moveWhileDragging', { lists })
      context.commit('listsWereDragged', true, { root: true })
      context.dispatch('currentConnections/updatePathsWhileDragging', { connections }, { root: true })
      context.dispatch('broadcast/update', { updates: { lists }, type: 'moveLists', handler: 'currentLists/moveWhileDragging' }, { root: true })
      context.dispatch('updateSnapGuides', { lists })
    },
    afterMove: (context) => {
      prevMovePositions = {}
      const currentDraggingdListId = context.rootState.currentDraggingdListId
      const currentDraggingdList = context.getters.byId(currentDraggingdListId)
      const spaceId = context.rootState.currentSpace.id
      let listIds = context.getters.isSelectedIds
      listIds = listIds.filter(list => Boolean(list))
      if (!listIds.length) { return }
      // lists
      let lists = listIds.map(id => {
        let list = context.getters.byId(id)
        if (!list) { return }
        list = utils.clone(list)
        if (!list) { return }
        const position = utils.listElementDimensions({ id })
        list.x = position.x
        list.y = position.y
        const { x, y } = list
        return { id, x, y }
      })
      lists = lists.filter(list => Boolean(list))
      context.commit('move', { lists, spaceId })
      lists = lists.filter(list => list)
      // update
      context.dispatch('updateMultiple', lists)
      const list = context.getters.byId(currentDraggingdListId)
      context.dispatch('checkIfItemShouldIncreasePageSize', list, { root: true })
      context.dispatch('broadcast/update', { updates: { lists }, type: 'moveLists', handler: 'currentLists/moveBroadcast' }, { root: true })
      context.dispatch('history/resume', null, { root: true })
      context.dispatch('history/add', { lists, useSnapshot: true }, { root: true })
      nextTick(() => {
        context.dispatch('currentConnections/updateMultiplePaths', lists, { root: true })
      })
    },

    // remove

    remove: async (context, list) => {
      context.dispatch('broadcast/update', { updates: list, type: 'removedList', handler: 'currentLists/remove' }, { root: true })
      context.commit('remove', list)
      context.dispatch('history/add', { lists: [list], isRemoved: true }, { root: true })
      await context.dispatch('api/addToQueue', { name: 'removedList', body: list }, { root: true })
    }
  },
  getters: {
    byId: (state) => (id) => {
      return state.lists[id]
    },
    all: (state) => {
      return state.ids.map(id => state.lists[id])
    },
    isSelectableInViewport: (state, getters) => {
      const elements = document.querySelectorAll('.list')
      let lists = []
      elements.forEach(list => {
        if (list.dataset.isVisibleInViewport === 'false') { return }
        if (list.dataset.isLocked === 'true') { return }
        lists.push(list)
      })
      lists = lists.map(list => getters.byId(list.dataset.listId))
      return lists
    },
    isSelectedIds: (state, getters, rootState, rootGetters) => {
      const currentDraggingId = rootState.currentDraggingdListId
      const multipleSelectedIds = rootState.multipleListsSelectedIds
      let listIds = multipleSelectedIds.concat(currentDraggingId)
      listIds = uniq(listIds)
      listIds = listIds.filter(id => Boolean(id))
      return listIds
    },
    isResizingIds: (state, getters, rootState) => {
      let listIds = rootState.currentUserIsResizingdListIds
      if (getters.isSelectedIds.length) {
        listIds = getters.isSelectedIds
      }
      return listIds
    },
    isSelected: (state, getters) => {
      const listIds = getters.isSelectedIds
      const lists = listIds.map(id => getters.byId(id))
      return lists
    }
    // isNotLocked: (state, getters) => {
    //   let lists = getters.all
    //   return lists.filter(list => !list.isLocked)
    // },
    // isLocked: (state, getters) => {
    //   let lists = getters.all
    //   return lists.filter(list => list.isLocked)
    // },
    // colors: (state, getters) => {
    //   const lists = getters.all
    //   let colors = lists.map(list => list.color)
    //   colors = colors.filter(color => Boolean(color))
    //   return uniq(colors)
    // },
    // newSnapGuide: (state) => ({ side, item, targetdList }) => {
    //   let time = Date.now()
    //   const prevGuide = state.snapGuides.find(guide => guide.side === side)
    //   if (prevGuide) {
    //     time = prevGuide.time
    //   }
    //   return { side, origin: item, target: targetdList, time }
    // }
  }
}
