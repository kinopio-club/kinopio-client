// import utils from '@/utils.js'
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
    boxes: {},
    snapGuides: [] // { side, origin, target }, { ... }
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
    move: (state, { boxes, spaceId }) => {
      boxes.forEach(box => {
        state.boxes[box.id].x = box.x
        state.boxes[box.id].y = box.y
      })
      cache.updateSpaceBoxesDebounced(state.boxes, currentSpaceId)
    },
    snapGuides: (state, value) => {
      state.snapGuides = value
    },

    // broadcast

    // resizeBroadcast: (state, { box }) => {
    //   const element = document.querySelector(`.box[data-box-id="${box.id}"]`)
    //   element.style.width = box.resizeWidth + 'px'
    //   element.style.height = box.resizeHeight + 'px'
    // },
    moveWhileDraggingBroadcast: (state, { boxes }) => {
      boxes.forEach(box => {
        const element = document.querySelector(`.box[data-box-id="${box.id}"]`)
        element.style.left = box.x + 'px'
        element.style.top = box.y + 'px'
      })
    },
    moveBroadcast: (state, { boxes }) => {
      boxes.forEach(updated => {
        const box = state.boxes[updated.id]
        if (!box) { return }
        box.x = updated.x
        box.y = updated.y
      })
      cache.updateSpaceBoxesDebounced(state.boxes, currentSpaceId)
    },

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
    mergeUnique: (context, { newItems, itemType }) => {
      newItems.forEach(newBox => {
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
    mergeRemove: (context, { removeItems, itemType }) => {
      removeItems.forEach(box => {
        context.commit('remove', box)
      })
    },

    // create

    add: (context, { box, shouldResize }) => {
      const count = context.state.ids.length
      const minBoxSize = consts.minBoxSize
      const isThemeDark = context.rootState.currentUser.theme === 'dark'
      const color = randomColor({ luminosity: 'dark' })
      box = {
        id: box.id || nanoid(),
        spaceId: currentSpaceId,
        userId: context.rootState.currentUser.id,
        x: box.x,
        y: box.y,
        resizeWidth: box.resizeWidth || minBoxSize,
        resizeHeight: box.resizeHeight || minBoxSize,
        color: box.color || color,
        fill: box.fill || 'filled', // empty, filled
        name: box.name || `Box ${count}`,
        infoHeight: 57,
        infoWidth: 34,
        headerFontId: context.rootState.currentUser.prevHeaderFontId || 0
      }
      context.dispatch('history/add', { boxes: [box] }, { root: true })
      context.commit('create', box)
      context.dispatch('api/addToQueue', { name: 'createBox', body: box }, { root: true })
      context.dispatch('broadcast/update', { updates: box, type: 'createBox', handler: 'currentBoxes/create' }, { root: true })
      if (shouldResize) {
        context.dispatch('history/pause', null, { root: true })
        context.commit('currentUserIsResizingBox', true, { root: true })
        context.commit('currentUserIsResizingBoxIds', [box.id], { root: true })
      }
    },

    // update

    update: (context, box) => {
      context.dispatch('history/add', { boxes: [box] }, { root: true })
      context.commit('update', box)
      context.dispatch('api/addToQueue', { name: 'updateBox', body: box }, { root: true })
      context.dispatch('broadcast/update', { updates: box, type: 'updateBox', handler: 'currentBoxes/update' }, { root: true })
      const keys = Object.keys(box)
      const shouldUpdatePathsKeys = ['x', 'resizeWidth']
      let shouldUpdatePaths = keys.find(key => shouldUpdatePathsKeys.includes(key))
      if (shouldUpdatePaths) {
        nextTick(() => {
          context.dispatch('currentConnections/updatePaths', { itemId: box.id }, { root: true })
        })
      }
    },
    updateName (context, { box, newName }) {
      const canEditBox = context.rootGetters['currentUser/canEditBox'](box)
      if (!canEditBox) { return }
      context.dispatch('update', {
        id: box.id,
        name: newName
      })
    },
    updateMultiple: (context, boxes) => {
      const spaceId = context.rootState.currentSpace.id
      let updates = {
        boxes,
        spaceId: context.rootState.currentSpace.id
      }
      updates.boxes.map(box => {
        delete box.userId
        return box
      })
      context.dispatch('api/addToQueue', { name: 'updateMultipleBoxes', body: updates }, { root: true })
      context.dispatch('history/add', { boxes }, { root: true })
      boxes.forEach(box => {
        context.dispatch('broadcast/update', { updates: box, type: 'updateBox', handler: 'currentBoxes/update' }, { root: true })
        context.commit('update', box)
      })
      cache.updateSpace('editedByUserId', context.rootState.currentUser.id, currentSpaceId)
    },

    // checkboxes

    toggleChecked (context, { boxId, value }) {
      utils.typeCheck({ value, type: 'boolean' })
      utils.typeCheck({ value: boxId, type: 'string' })
      const box = context.getters.byId(boxId)
      let name = box.name
      const checkbox = utils.checkboxFromString(name)
      name = name.replace(checkbox, '')
      if (value) {
        name = `[x] ${name}`
      } else {
        name = `[] ${name}`
      }
      const update = {
        id: boxId,
        name
      }
      context.dispatch('update', update)
    },
    removeChecked: (context, boxId) => {
      utils.typeCheck({ value: boxId, type: 'string' })
      const box = context.getters.byId(boxId)
      let name = box.name
      name = name.replace('[x]', '').trim()
      const update = {
        id: boxId,
        name
      }
      context.dispatch('update', update)
    },

    // resize

    resize: (context, { boxIds, delta }) => {
      let connections = []
      boxIds.forEach(boxId => {
        const box = context.getters.byId(boxId)
        let width = box.resizeWidth
        let height = box.resizeHeight
        width = width + delta.x
        height = height + delta.y
        const updates = { id: boxId, resizeWidth: width, resizeHeight: height }
        context.dispatch('update', updates)
        context.dispatch('broadcast/update', { updates, type: 'resizeBox', handler: 'currentBoxes/update' }, { root: true })
        connections = connections.concat(context.rootGetters['currentConnections/byItemId'](box.id))
      })
      context.dispatch('currentConnections/updatePathsWhileDragging', { connections }, { root: true })
    },

    // dimensions

    updateInfoDimensions: (context, { boxes }) => {
      boxes = boxes || utils.clone(context.getters.all)
      boxes.forEach(box => {
        const prevDimensions = {
          infoWidth: box.infoWidth,
          infoHeight: box.infoHeight
        }
        const element = document.querySelector(`.box-info[data-box-id="${box.id}"]`)
        if (!element) { return }
        const DOMRect = element.getBoundingClientRect()
        const infoWidth = Math.round(DOMRect.width + 4)
        const infoHeight = Math.round(DOMRect.height)
        const dimensionsChanged = infoWidth !== prevDimensions.infoWidth || infoHeight !== prevDimensions.infoHeight
        const body = {
          id: box.id,
          infoWidth,
          infoHeight
        }
        if (!dimensionsChanged) { return }
        context.commit('update', body)
        context.dispatch('api/addToQueue', { name: 'updateBox', body }, { root: true })
      })
    },

    // snapping

    updateSnapGuides: (context, { boxes, cards }) => {
      const snapThreshold = 6
      const spaceEdgeThreshold = 100
      let targetBoxes = utils.clone(context.getters.all)
      let snapGuides = []
      let items
      if (cards) {
        cards = utils.clone(cards)
        cards = [ utils.boundaryRectFromItems(cards) ] // combine multiple selected cards
        items = cards
        targetBoxes = targetBoxes.filter(box => !box.isLocked)
      } else if (boxes) {
        items = utils.clone(boxes)
      }
      items = items.map(item => {
        item.width = item.resizeWidth || item.width
        item.height = item.resizeheight || item.height
        return item
      })
      items.forEach(item => {
        targetBoxes.forEach(targetBox => {
          if (targetBox.id === item.id) { return }
          targetBox.width = targetBox.resizeWidth
          targetBox.height = targetBox.resizeHeight
          const isBetweenTargetBoxPointsX = utils.isBetween({
            value: item.x,
            min: targetBox.x + snapThreshold,
            max: targetBox.x + targetBox.width - snapThreshold
          })
          const isBetweenTargetBoxPointsY = utils.isBetween({
            value: item.y,
            min: targetBox.y + snapThreshold,
            max: targetBox.y + targetBox.height - snapThreshold
          })
          // item sides
          const itemLeft = item.x
          const itemRight = item.x + item.width
          const itemTop = item.y
          const itemBottom = item.y + item.height
          // target sides
          const targetBoxLeft = targetBox.x
          const targetBoxRight = targetBox.x + targetBox.width
          const targetBoxTop = targetBox.y
          const targetBoxBottom = targetBox.y + targetBox.height
          const targetBoxIsMinX = targetBox.x <= spaceEdgeThreshold
          const targetBoxIsMinY = targetBox.y <= spaceEdgeThreshold
          // snap left
          const isSnapLeftFromItemRight = Math.abs(itemRight - targetBoxLeft) <= snapThreshold
          const isSnapLeftFromItemLeft = Math.abs(itemLeft - targetBoxLeft) <= snapThreshold
          if (!targetBoxIsMinX && isBetweenTargetBoxPointsY && (isSnapLeftFromItemRight || isSnapLeftFromItemLeft)) {
            snapGuides.push({ side: 'left', origin: item, target: targetBox })
          }
          // snap right
          const isSnapRightFromItemLeft = Math.abs(itemLeft - targetBoxRight) <= snapThreshold
          const isSnapRightFromItemRight = Math.abs(itemRight - targetBoxRight) <= snapThreshold
          if (isBetweenTargetBoxPointsY && (isSnapRightFromItemLeft || isSnapRightFromItemRight)) {
            snapGuides.push({ side: 'right', origin: item, target: targetBox })
          }
          // snap top
          const isSnapTopFromItemBottom = Math.abs(itemBottom - targetBoxTop) <= snapThreshold
          const isSnapTopFromItemTop = Math.abs(itemTop - targetBoxTop) <= snapThreshold
          if (!targetBoxIsMinY && isBetweenTargetBoxPointsX && (isSnapTopFromItemBottom || isSnapTopFromItemTop)) {
            snapGuides.push({ side: 'top', origin: item, target: targetBox })
          }
          // snap bottom
          const isSnapBottomFromItemTop = Math.abs(itemTop - targetBoxBottom) <= snapThreshold
          const isSnapBottomFromItemBottom = Math.abs(itemBottom - targetBoxBottom) <= snapThreshold
          if (isBetweenTargetBoxPointsX && (isSnapBottomFromItemTop || isSnapBottomFromItemBottom)) {
            snapGuides.push({ side: 'bottom', origin: item, target: targetBox })
          }
        })
      })
      // limit each origin item to it's closest target
      let normalizedGuides = {}
      snapGuides.forEach(snapGuide => {
        const originGuide = normalizedGuides[snapGuide.origin.id]
        if (originGuide) {
          if (snapGuide.distance < originGuide.distance) {
            normalizedGuides[snapGuide.origin.id] = snapGuide
          }
        } else {
          normalizedGuides[snapGuide.origin.id] = snapGuide
        }
      })
      let normalizedGuideKeys = Object.keys(normalizedGuides)
      snapGuides = normalizedGuideKeys.map(key => normalizedGuides[key])
      context.commit('snapGuides', snapGuides)
    },
    snap: (context, { side, origin, target }) => {
      const borderWidth = 2
      let updated = { id: origin.id }
      origin = context.getters.byId(origin.id)
      const alignWithOriginY = side === 'right' || side === 'left'
      // size
      if (alignWithOriginY) {
        updated.y = target.y
        updated.resizeHeight = Math.max(target.resizeHeight, origin.resizeHeight)
      } else {
        updated.x = target.x
        updated.resizeWidth = Math.max(target.resizeWidth, origin.resizeWidth)
      }
      // position
      if (side === 'right') {
        updated.x = target.x + target.resizeWidth - borderWidth
      } else if (side === 'left') {
        updated.x = target.x - origin.resizeWidth + borderWidth
      } else if (side === 'top') {
        updated.y = target.y - origin.resizeHeight + borderWidth
      } else if (side === 'bottom') {
        updated.y = target.y + target.resizeHeight - borderWidth
      }
      context.dispatch('history/resume', null, { root: true })
      context.dispatch('update', updated)
      context.commit('snapGuides', [])
    },
    expand: (context, { side, origin, target }) => {
      const padding = consts.spaceBetweenCards
      let updated = { id: target.id }
      const delta = {
        x: origin.x - target.x,
        y: origin.y - target.y
      }
      if (side === 'right') {
        // increase width
        updated.resizeWidth = target.width + origin.width + padding
        // increase height if origin is taller than target
        if (origin.height + delta.y > target.resizeHeight) {
          updated.resizeHeight = origin.height + delta.y + padding
        }
      } else if (side === 'left') {
        // increase width and shift left
        updated.resizeWidth = target.width + origin.width + padding
        updated.x = target.x - origin.width - padding
        // increase height if origin is taller than target
        if (origin.height + delta.y > target.resizeHeight) {
          updated.resizeHeight = origin.height + delta.y + padding
        }
      } else if (side === 'top') {
        // increase height and shift up
        const paddingTop = 30 + padding
        updated.resizeHeight = target.resizeHeight + origin.height + paddingTop
        updated.y = target.y - origin.height - paddingTop
        // increase width if origin is wider than target
        if (origin.width + delta.x > target.resizeWidth) {
          updated.resizeWidth = origin.width + delta.x + padding
        }
      } else if (side === 'bottom') {
        // increase width
        updated.resizeHeight = target.resizeHeight + origin.height + padding
        // increase width if origin is wider than target
        if (origin.width + delta.x > target.resizeWidth) {
          updated.resizeWidth = origin.width + delta.x + padding
        }
      }
      context.dispatch('history/resume', null, { root: true })
      context.dispatch('update', updated)
      context.commit('snapGuides', [])
    },

    // move

    // moveWhileDragging: (context, boxes) => {
    //   boxes.forEach(box => {
    //     const element = document.querySelector(`.box[data-box-id="${box.id}"]`)
    //     element.style.left = box.x + 'px'
    //     element.style.top = box.y + 'px'
    //   })
    //   context.dispatch('currentConnections/updatePathsWhileDragging', { connections }, { root: true })
    // },
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
      let boxes = context.getters.isSelected
      if (!boxes.length) { return }
      boxes = boxes.filter(box => !box.isLocked)
      boxes = boxes.filter(box => context.rootGetters['currentUser/canEditBox'](box))
      // prevent boxes bunching up at 0
      let connections = []
      boxes.forEach(box => {
        if (!box) { return }
        if (box.x === 0) { delta.x = Math.max(0, delta.x) }
        if (box.y === 0) { delta.y = Math.max(0, delta.y) }
        connections = connections.concat(context.rootGetters['currentConnections/byItemId'](box.id))
      })
      boxes = boxes.filter(box => Boolean(box))
      // prevent boxes with null or negative positions
      boxes = utils.clone(boxes)
      boxes = boxes.map(box => {
        let position
        if (prevMovePositions[box.id]) {
          position = prevMovePositions[box.id]
        } else {
          position = utils.boxPositionFromElement(box.id)
        }
        box.x = position.x
        box.y = position.y
        // x
        if (box.x === undefined || box.x === null) {
          delete box.x
        } else {
          box.x = Math.max(0, box.x + delta.x)
          box.x = Math.round(box.x)
        }
        // y
        if (box.y === undefined || box.y === null) {
          delete box.y
        } else {
          box.y = Math.max(0, box.y + delta.y)
          box.y = Math.round(box.y)
          box.y = Math.max(consts.minItemXY, box.y)
        }
        box = {
          name: box.name,
          x: box.x,
          y: box.y,
          width: box.resizeWidth,
          height: box.resizeHeight,
          id: box.id
        }
        prevMovePositions[box.id] = box
        return box
      })
      // update
      context.commit('move', { boxes })
      context.commit('boxesWereDragged', true, { root: true })
      context.dispatch('currentConnections/updatePathsWhileDragging', { connections }, { root: true })
      context.dispatch('broadcast/update', { updates: { boxes }, type: 'moveBoxes', handler: 'currentBoxes/moveWhileDraggingBroadcast' }, { root: true })
      context.dispatch('updateSnapGuides', { boxes })
    },
    afterMove: (context) => {
      prevMovePositions = {}
      const currentDraggingBoxId = context.rootState.currentDraggingBoxId
      const spaceId = context.rootState.currentSpace.id
      let boxIds = context.getters.isSelectedIds
      boxIds = boxIds.filter(box => Boolean(box))
      if (!boxIds.length) { return }
      let boxes = boxIds.map(id => {
        let box = context.getters.byId(id)
        if (!box) { return }
        box = utils.clone(box)
        if (!box) { return }
        const position = utils.boxPositionFromElement(id)
        box.x = position.x
        box.y = position.y
        const { x, y } = box
        return { id, x, y }
      })
      boxes = boxes.filter(box => Boolean(box))
      context.commit('move', { boxes, spaceId })
      boxes = boxes.filter(box => box)
      boxes.forEach(box => {
        context.dispatch('api/addToQueue', {
          name: 'updateBox',
          body: box
        }, { root: true })
      })
      const box = context.getters.byId(currentDraggingBoxId)
      context.dispatch('checkIfItemShouldIncreasePageSize', box, { root: true })
      context.dispatch('broadcast/update', { updates: { boxes }, type: 'moveBoxes', handler: 'currentBoxes/moveBroadcast' }, { root: true })
      context.dispatch('history/resume', null, { root: true })
      context.dispatch('history/add', { boxes, useSnapshot: true }, { root: true })
      nextTick(() => {
        context.dispatch('currentConnections/updateMultiplePaths', boxes, { root: true })
      })
    },

    // remove

    remove: (context, box) => {
      context.dispatch('api/addToQueue', { name: 'removeBox', body: box }, { root: true })
      context.dispatch('broadcast/update', { updates: box, type: 'removeBox', handler: 'currentBoxes/remove' }, { root: true })
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
    },
    isSelectableInViewport: (state, getters) => {
      const elements = document.querySelectorAll('.box')
      let boxes = []
      elements.forEach(box => {
        if (box.dataset.isVisibleInViewport === 'false') { return }
        boxes.push(box)
      })
      boxes = boxes.map(box => getters.byId(box.dataset.boxId))
      return boxes
    },
    isSelectedIds: (state, getters, rootState, rootGetters) => {
      const currentDraggingId = rootState.currentDraggingBoxId
      const multipleSelectedIds = rootState.multipleBoxesSelectedIds
      let boxIds = multipleSelectedIds.concat(currentDraggingId)
      boxIds = uniq(boxIds)
      boxIds = boxIds.filter(id => Boolean(id))
      return boxIds
    },
    isSelected: (state, getters) => {
      const boxIds = getters.isSelectedIds
      const boxes = boxIds.map(id => getters.byId(id))
      return boxes
    },
    isNotLocked: (state, getters) => {
      let boxes = getters.all
      return boxes.filter(box => !box.isLocked)
    },
    isLocked: (state, getters) => {
      let boxes = getters.all
      return boxes.filter(box => box.isLocked)
    },
    colors: (state, getters) => {
      const boxes = getters.all
      let colors = boxes.map(box => box.color)
      colors = colors.filter(color => Boolean(color))
      return uniq(colors)
    }
  }
}
