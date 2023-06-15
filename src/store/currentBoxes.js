// import utils from '@/utils.js'
import cache from '@/cache.js'
import utils from '@/utils.js'

import { nanoid } from 'nanoid'
import randomColor from 'randomcolor'
import uniq from 'lodash-es/uniq'

// normalized state
// https://github.com/vuejs/vuejs.org/issues/1636

let currentSpaceId
let prevMovePositions = {}

export default {
  namespaced: true,
  state: {
    ids: [],
    boxes: {},
    snapGuides: [] // { side, box, toBox }, { ... }
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

    resizeBroadcast: (state, { box }) => {
      const element = document.querySelector(`.box[data-box-id="${box.id}"]`)
      element.style.width = box.resizeWidth + 'px'
      element.style.height = box.resizeHeight + 'px'
    },
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
      const minBoxSize = 70
      const isThemeDark = context.rootState.currentUser.theme === 'dark'
      let color = randomColor({ luminosity: 'light' })
      if (isThemeDark) {
        color = randomColor({ luminosity: 'dark' })
      }
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
        name: box.name || `Box ${count}`
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
    },
    updateName (context, { box, newName }) {
      const canEditBox = context.rootGetters['currentUser/canEditBox'](box)
      if (!canEditBox) { return }
      context.dispatch('update', {
        id: box.id,
        name: newName
      })
    },

    // resize

    resize: (context, { boxIds, delta }) => {
      boxIds.forEach(boxId => {
        const box = context.getters.byId(boxId)
        let width = box.resizeWidth
        let height = box.resizeHeight
        width = width + delta.x
        height = height + delta.y
        const updates = { id: boxId, resizeWidth: width, resizeHeight: height }
        context.dispatch('update', updates)
        context.dispatch('broadcast/update', { updates, type: 'resizeBox', handler: 'currentBoxes/update' }, { root: true })
      })
    },

    // snapping

    updateSnapGuides: (context, boxes) => {
      const snapThreshold = 25
      const closenessThreshold = 100
      const targetBoxes = utils.clone(context.getters.all)
      boxes = utils.clone(boxes)
      let snapGuides = []
      boxes.forEach(box => {
        targetBoxes.forEach(targetBox => {
          if (targetBox.id === box.id) { return }
          targetBox.width = targetBox.resizeWidth
          targetBox.height = targetBox.resizeHeight
          // const left = closestBox.distances.left
          const distances = {
            // ┌────┐     ┌────┐
            // │ B  │────▶│ OB │ y + height/2
            // └────┘     └────┘
            //  x + w      x
            left: utils.distanceBetweenTwoPoints(
              {
                x: box.x + box.width,
                y: box.y + (box.height / 2)
              },
              {
                x: targetBox.x,
                y: targetBox.y + (targetBox.height / 2)
              }
            ),
            // ┌────┐     ┌────┐
            // │ OB │◀────│ B  │ y + height/2
            // └────┘     └────┘
            //  x + w      x
            right: utils.distanceBetweenTwoPoints(
              {
                x: box.x,
                y: box.y + (box.height / 2)
              },
              {
                x: targetBox.x + targetBox.width,
                y: targetBox.y + (targetBox.height / 2)
              }
            ),
            // ┌────┐
            // │ B  │
            // └────┘ y + height
            //    │
            //    ▼
            // ┌────┐ y
            // │ OB │
            // └────┘
            //    x + width/2
            top: utils.distanceBetweenTwoPoints(
              {
                x: box.x + (box.width / 2),
                y: box.y + box.height
              },
              {
                x: targetBox.x + (targetBox.width / 2),
                y: targetBox.y
              }
            ),
            // ┌────┐
            // │ OB │
            // └────┘ y
            //    ▲
            //    │
            // ┌────┐ y + height
            // │ B  │
            // └────┘
            //    x + width/2
            bottom: utils.distanceBetweenTwoPoints(
              {
                x: box.x + (box.width / 2),
                y: box.y
              },
              {
                x: targetBox.x + (targetBox.width / 2),
                y: targetBox.y + targetBox.height
              }
            )
          }
          // snap left
          const isNearLeft = distances.left < closenessThreshold
          const isSnapLeft = Math.abs((box.x + box.width) - targetBox.x) <= snapThreshold
          const isLeftOf = (box.x + box.width) < targetBox.x
          if (isNearLeft && isSnapLeft && isLeftOf) {
            snapGuides.push({ side: 'left', origin: box, target: targetBox, distance: distances.left })
          }
          // snap right
          const isNearRight = distances.right < closenessThreshold
          const isSnapRight = Math.abs(box.x - (targetBox.x + targetBox.width)) <= snapThreshold
          const isRightOf = box.x > (targetBox.x + targetBox.width)
          if (isNearRight && isSnapRight && isRightOf) {
            snapGuides.push({ side: 'right', origin: box, target: targetBox, distance: distances.right })
          }
          // snap top
          const isNearTop = distances.top < closenessThreshold
          const isSnapTop = Math.abs((box.y + box.height) - targetBox.y) <= snapThreshold
          const isTopOf = (box.y + box.height) < targetBox.y
          if (isNearTop && isSnapTop && isTopOf) {
            snapGuides.push({ side: 'top', origin: box, target: targetBox, distance: distances.top })
          }
          // snap bottom
          const isNearBottom = distances.bottom < closenessThreshold
          const isSnapBottom = Math.abs(box.y - (targetBox.y + targetBox.height)) <= snapThreshold
          const isBottomOf = box.y > (targetBox.y + targetBox.height)
          if (isNearBottom && isSnapBottom && isBottomOf) {
            snapGuides.push({ side: 'bottom', origin: box, target: targetBox, distance: distances.bottom })
          }
        })
      })
      // limit each origin box to it's closest target
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
      context.dispatch('update', updated)
    },

    // move

    // moveWhileDragging: (context, boxes) => {
    //   boxes.forEach(box => {
    //     const element = document.querySelector(`.box[data-box-id="${box.id}"]`)
    //     element.style.left = box.x + 'px'
    //     element.style.top = box.y + 'px'
    //   })
    // },
    move: (context, { endCursor, prevCursor, delta }) => {
      const zoom = context.rootGetters.spaceCounterZoomDecimal
      if (!endCursor || !prevCursor) { return }
      endCursor = {
        x: endCursor.x * zoom,
        y: endCursor.y * zoom
      }
      delta = delta || {
        x: endCursor.x - prevCursor.x,
        y: endCursor.y - prevCursor.y
      }
      let boxes = context.getters.isSelected
      boxes = boxes.filter(box => !box.isLocked)
      boxes = boxes.filter(box => context.rootGetters['currentUser/canEditBox'](box))
      // prevent boxes bunching up at 0
      boxes.forEach(box => {
        if (!box) { return }
        if (box.x === 0) { delta.x = Math.max(0, delta.x) }
        if (box.y === 0) { delta.y = Math.max(0, delta.y) }
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
      context.dispatch('broadcast/update', { updates: { boxes }, type: 'moveBoxes', handler: 'currentBoxes/moveWhileDraggingBroadcast' }, { root: true })
      context.dispatch('updateSnapGuides', boxes)
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
