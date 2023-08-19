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
    lines: {}
  },
  mutations: {

    // init

    clear: (state) => {
      state.ids = []
      state.lines = {}
    },
    restore: (state, lines) => {
      let ids = []
      lines.forEach(line => {
        ids.push(line.id)
        state.lines[line.id] = line
      })
      state.ids = state.ids.concat(ids)
    },

    // create

    create: (state, line) => {
      state.ids.push(line.id)
      state.lines[line.id] = line
      cache.updateSpace('lines', state.lines, currentSpaceId)
    },

    // update

    update: (state, line) => {
      const keys = Object.keys(line)
      keys.forEach(key => {
        state.lines[line.id][key] = line[key]
      })
      cache.updateSpace('lines', state.lines, currentSpaceId)
    },
    move: (state, { lines, spaceId }) => {
      lines.forEach(line => {
        state.lines[line.id].y = line.y
      })
      cache.updateSpaceLinesDebounced(state.lines, currentSpaceId)
    },

    // broadcast

    moveWhileDraggingBroadcast: (state, { lines }) => {
      lines.forEach(line => {
        const element = document.querySelector(`.line[data-line-id="${line.id}"]`)
        element.style.left = line.x + 'px'
        element.style.top = line.y + 'px'
      })
    },
    moveBroadcast: (state, { lines }) => {
      lines.forEach(updated => {
        const line = state.lines[updated.id]
        if (!line) { return }
        line.x = updated.x
        line.y = updated.y
      })
      cache.updateSpaceLinesDebounced(state.lines, currentSpaceId)
    },

    // remove

    remove: (state, lineToRemove) => {
      if (!lineToRemove) { return }
      const line = state.lines[lineToRemove.id]
      if (!line) { return }
      state.ids = state.ids.filter(id => id !== line.id)
      delete state.lines[line.id]
      cache.updateSpace('lines', state.lines, currentSpaceId)
    }
  },
  actions: {

    // init

    updateSpaceId: (context, spaceId) => {
      currentSpaceId = spaceId
    },
    mergeUnique: (context, { newItems, itemType }) => {
      newItems.forEach(newLine => {
        let shouldUpdate
        let prevLine = context.getters.byId(newLine.id)
        let line = { id: newLine.id }
        let keys = Object.keys(newLine)
        keys = keys.filter(key => key !== 'id')
        keys.forEach(key => {
          if (prevLine[key] !== newLine[key]) {
            line[key] = newLine[key]
            shouldUpdate = true
          }
        })
        if (!shouldUpdate) { return }
        context.commit('update', line)
      })
    },
    mergeRemove: (context, { removeItems, itemType }) => {
      removeItems.forEach(line => {
        context.commit('remove', line)
      })
    },

    // create

    add: (context, { line, shouldResize }) => {
      const count = context.state.ids.length
      const minLineSize = 70
      const isThemeDark = context.rootState.currentUser.theme === 'dark'
      let color = randomColor({ luminosity: 'light' })
      if (isThemeDark) {
        color = randomColor({ luminosity: 'dark' })
      }
      line = {
        id: line.id || nanoid(),
        spaceId: currentSpaceId,
        userId: context.rootState.currentUser.id,
        y: line.y,
        color: line.color || color,
        fill: line.fill || 'filled', // empty, filled
        name: line.name || `Line ${count}`,
        isHorizontal: line.isHorizontal || true
      }
      context.dispatch('history/add', { lines: [line] }, { root: true })
      context.commit('create', line)
      context.dispatch('api/addToQueue', { name: 'createLine', body: line }, { root: true })
      context.dispatch('broadcast/update', { updates: line, type: 'createLine', handler: 'currentLines/create' }, { root: true })
      if (shouldResize) {
        context.dispatch('history/pause', null, { root: true })
        context.commit('currentUserIsResizingLine', true, { root: true })
        context.commit('currentUserIsResizingLineIds', [line.id], { root: true })
      }
    },

    // update

    update: (context, line) => {
      context.dispatch('history/add', { lines: [line] }, { root: true })
      context.commit('update', line)
      context.dispatch('api/addToQueue', { name: 'updateLine', body: line }, { root: true })
      context.dispatch('broadcast/update', { updates: line, type: 'updateLine', handler: 'currentLines/update' }, { root: true })
    },
    updateName (context, { line, newName }) {
      const canEditLine = context.rootGetters['currentUser/canEditLine'](line)
      if (!canEditLine) { return }
      context.dispatch('update', {
        id: line.id,
        name: newName
      })
    },

    // move

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
      let lines = context.getters.isSelected
      lines = lines.filter(line => context.rootGetters['currentUser/canEditLine'](line))
      // prevent lines bunching up at 0
      lines.forEach(line => {
        if (!line) { return }
        if (line.x === 0) { delta.x = Math.max(0, delta.x) }
        if (line.y === 0) { delta.y = Math.max(0, delta.y) }
      })
      lines = lines.filter(line => Boolean(line))
      // prevent lines with null or negative positions
      lines = utils.clone(lines)
      lines = lines.map(line => {
        let position
        if (prevMovePositions[line.id]) {
          position = prevMovePositions[line.id]
        } else {
          position = utils.linePositionFromElement(line.id)
        }
        line.x = position.x
        line.y = position.y
        // x
        if (line.x === undefined || line.x === null) {
          delete line.x
        } else {
          line.x = Math.max(0, line.x + delta.x)
          line.x = Math.round(line.x)
        }
        // y
        if (line.y === undefined || line.y === null) {
          delete line.y
        } else {
          line.y = Math.max(0, line.y + delta.y)
          line.y = Math.round(line.y)
        }
        line = {
          name: line.name,
          x: line.x,
          y: line.y,
          id: line.id
        }
        prevMovePositions[line.id] = line
        return line
      })
      // update
      context.commit('move', { lines })
      context.commit('linesWereDragged', true, { root: true })
      context.dispatch('broadcast/update', { updates: { lines }, type: 'moveLines', handler: 'currentLines/moveWhileDraggingBroadcast' }, { root: true })
    },
    afterMove: (context) => {
      prevMovePositions = {}
      const currentDraggingLineId = context.rootState.currentDraggingLineId
      const spaceId = context.rootState.currentSpace.id
      let lineIds = context.getters.isSelectedIds
      lineIds = lineIds.filter(line => Boolean(line))
      if (!lineIds.length) { return }
      let lines = lineIds.map(id => {
        let line = context.getters.byId(id)
        if (!line) { return }
        line = utils.clone(line)
        if (!line) { return }
        const position = utils.linePositionFromElement(id)
        line.x = position.x
        line.y = position.y
        const { x, y } = line
        return { id, x, y }
      })
      lines = lines.filter(line => Boolean(line))
      context.commit('move', { lines, spaceId })
      lines = lines.filter(line => line)
      lines.forEach(line => {
        context.dispatch('api/addToQueue', {
          name: 'updateLine',
          body: line
        }, { root: true })
      })
      const line = context.getters.byId(currentDraggingLineId)
      context.dispatch('broadcast/update', { updates: { lines }, type: 'moveLines', handler: 'currentLines/moveBroadcast' }, { root: true })
      context.dispatch('history/resume', null, { root: true })
      context.dispatch('history/add', { lines, useSnapshot: true }, { root: true })
    },

    // remove

    remove: (context, line) => {
      context.dispatch('api/addToQueue', { name: 'removeLine', body: line }, { root: true })
      context.dispatch('broadcast/update', { updates: line, type: 'removeLine', handler: 'currentLines/remove' }, { root: true })
      context.commit('remove', line)
      context.dispatch('history/add', { lines: [line], isRemoved: true }, { root: true })
    }
  },
  getters: {
    byId: (state) => (id) => {
      return state.lines[id]
    },
    all: (state) => {
      return state.ids.map(id => state.lines[id])
    },
    isSelectedIds: (state, getters, rootState, rootGetters) => {
      const currentDraggingId = rootState.currentDraggingLineId
      const multipleSelectedIds = rootState.multipleLinesSelectedIds
      let lineIds = multipleSelectedIds.concat(currentDraggingId)
      lineIds = uniq(lineIds)
      lineIds = lineIds.filter(id => Boolean(id))
      return lineIds
    },
    isSelected: (state, getters) => {
      const lineIds = getters.isSelectedIds
      const lines = lineIds.map(id => getters.byId(id))
      return lines
    },
    colors: (state, getters) => {
      const lines = getters.all
      let colors = lines.map(line => line.color)
      colors = colors.filter(color => Boolean(color))
      return uniq(colors)
    }
  }
}
