import { nextTick, watch } from 'vue'
import { defineStore } from 'pinia'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useCardStore } from '@/stores/useCardStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'

import { useGlobalStore } from '@/stores/useGlobalStore'

import utils from '@/utils.js'

import debounce from 'lodash-es/debounce'
import isEqual from 'lodash-es/isEqual'

const showDebugMessages = true
const max = 30

export const useHistoryStore = defineStore('history', {
  // adapted from https://twitter.com/steveruizok/status/1487052071685734410
  // each `patch` contains `new` and `prev` updates
  // `pointer` is the current position in history
  //
  //                    ┌──────────────────────┐
  //                    │                      │
  //                    │ PREV                 │
  //                    │ Patch 0              │
  //                    │ [{action prev, new}] │
  //                    │                      │
  //                    ├──────────────────────┤
  //                    │                      │
  //                    │ PREV                 │
  //                    │ Patch 1              │
  //                    │ [{…}]                │       ▲
  //                    │                      │       │
  //                    ├──────────────────────┤       │
  //                    │                      │░  ┌ ─ ─ ─   ┌ ─ ─ ─
  //  ┌─────────┐       │ NEW                  │░    Undo │    Redo │
  //  │ Pointer │──────▶│ Patch 2              │░  └ ─ ─ ─   └ ─ ─ ─
  //  └─────────┘░      │ [{…}]                │░                │
  //   ░░░░░░░░░░░      │                      │░                │
  //                    └──────────────────────┘░                ▼
  //                     ░░░░░░░░░░░░░░░░░░░░░░░░
  state: () => ({
    patches: [],
    pointer: 0,
    cardUpdatesProcessing: new Map(),
    prevCardUpdatesProcessing: new Map(),
    cardUpdateKeysProcessing: new Set(),
    shouldPreventPatchUpdates: false
  }),
  actions: {
    // subscribe to items → process updates → create patch

    // init

    init () {
      this.subscribeToCards()
    },

    // patches and pointers

    add (update) { // todo remove?
      console.error('🔮🔮', update)
    },
    addPatch (patch) {
      utils.typeCheck({ value: patch, type: 'array', origin: 'addPatch' })
      console.log('🌺 addPatch', patch)
      patch = patch.filter(item => Boolean(item))
      if (!patch.length) { return }
      // remove patches above pointer
      this.patches = this.patches.slice(0, this.pointer)
      // add patch to pointer
      this.patches.splice(this.pointer, 0, patch)
      this.updatePointer({ increment: true })
      this.trimPatches()
      if (showDebugMessages) {
        console.info('⏺ add history patch', { newPatch: patch, pointer: this.pointer })
      }
    },
    trimPatches () {
      if (this.patches.length > max) {
        this.patches.shift()
        this.pointer = this.pointer - 1
      }
    },
    reset () {
      this.patches = []
      this.pointer = 0
      if (showDebugMessages) {
        console.info('⏹ reset history')
      }
    },
    updatePointer ({ increment, decrement }) {
      if (increment) {
        this.pointer = this.pointer + 1
      } else if (decrement) {
        this.pointer = this.pointer - 1
      }
      this.pointer = Math.max(0, this.pointer)
      this.pointer = Math.min(this.patches.length, this.pointer)
      console.error('🐸🐸🐸 updatePointer', this.pointer, increment, decrement)
    },

    // cards

    processCardUpdated: debounce((store, updates) => {
      const ignoreKeys = ['id', 'nameUpdatedAt', 'height', 'width', 'z', 'prevHeight', 'prevWidth', 'urlPreviewDescription', 'urlPreviewFavicon', 'urlPreviewImage', 'urlPreviewTitle', 'urlPreviewUrl', 'urlPreviewIframeUrl', 'shouldUpdateUrlPreview', 'linkToCardId']
      const cardStore = useCardStore()
      const patch = []
      updates.forEach(update => {
        const keys = Array.from(store.cardUpdateKeysProcessing)
        const everyKeyIsIgnored = keys.every(key => ignoreKeys.includes(key))
        if (everyKeyIsIgnored) { return }
        let prevCard = store.prevCardUpdatesProcessing.get(update.id)
        prevCard = utils.objectPickKeys(prevCard, keys)
        const newCard = store.cardUpdatesProcessing.get(update.id)
        patch.push({
          action: 'cardUpdated',
          prev: prevCard,
          new: newCard
        })
      })
      if (patch.length) {
        store.addPatch(patch)
      }
      store.cardUpdatesProcessing = new Map()
      store.prevCardUpdatesProcessing = new Map()
      store.cardUpdateKeysProcessing = new Set()
    }, 100),
    processCardsCreated (updates) {
      const patch = updates.map(update => {
        return {
          action: 'cardCreated',
          new: update
        }
      })
      this.addPatch(patch)
    },

    subscribeToCards () {
      const cardStore = useCardStore()
      cardStore.$onAction(({ name, args, after, onError }) => {
        if (this.shouldPreventPatchUpdates) { return }
        const updates = args[0]
        switch (name) {
          case 'updateCardsState':
            updates.forEach(update => {
              const keys = Object.keys(update)
              keys.forEach(key => this.cardUpdateKeysProcessing.add(key))
              if (this.cardUpdatesProcessing.has(update.id)) {
                // Merge with existing object
                this.cardUpdatesProcessing.set(update.id, { ...this.cardUpdatesProcessing.get(update.id), ...update })
              } else {
                // Add new object
                this.cardUpdatesProcessing.set(update.id, { ...update })
              }
              if (this.prevCardUpdatesProcessing.has(update.id)) { return }
              const prevCard = cardStore.getCard(update.id)
              this.prevCardUpdatesProcessing.set(prevCard.id, prevCard)
            })
            this.processCardUpdated(this, updates)
            break
          case 'createCards':
            console.log('♥️♥️createCards', updates)
            this.processCardsCreated(updates)
            break
          case 'createCard':
            console.log('♥️createCard', updates)
            this.processCardsCreated([updates])
            break
        }
      })
    },

    // Undo

    async undo () {
      const globalStore = useGlobalStore()
      const cardStore = useCardStore()
      const connectionStore = useConnectionStore()
      const boxStore = useBoxStore()
      if (globalStore.getToolbarIsDrawing) {
        globalStore.triggerDrawingUndo()
        return
      }
      this.shouldPreventPatchUpdates = true
      if (this.pointer === 0) {
        console.log('⏩ undo cancelled, pointer is at start', this.pointer)
        return
      }
      const index = this.pointer - 1
      const patch = this.patches[index]
      for (const item of patch) {
        console.info('⏪ undo', item, { pointer: this.pointer, totalPatches: this.patches.length })
        const { action } = item
        let card, connection, type, box
        switch (action) {
          case 'cardUpdated':
            card = item.prev
            cardStore.updateCard(card)
            await nextTick()
            connectionStore.updateConnectionPath(card.id)
            break
          case 'cardCreated':
            card = item.new
            cardStore.removeCard(card.id)
            break
          case 'cardRemoved':
            card = item.new
            cardStore.restoreRemovedCard(card)
            break
          case 'connectionUpdated':
            connection = item.prev
            connectionStore.updateConnection(connection)
            break
          case 'connectionCreated':
            connection = item.new
            connectionStore.removeConnection(connection)
            break
          case 'connectionRemoved':
            connection = utils.clone(item.new)
            connection.connectionTypeId = connectionStore.getNewConnectionType
            if (!connection.connectionTypeId) {
              connectionStore.createConnectionType()
              connection.connectionTypeId = connectionStore.getNewConnectionType
            }
            connectionStore.createConnection(connection)
            break
          case 'connectionTypeUpdated':
            type = item.prev

            connectionStore.updateConnectionType(type)
            break
          case 'boxCreated':
            box = item.new
            boxStore.removeBox(box)
            break
          case 'boxRemoved':
            box = item.new
            boxStore.createBox(box)
            break
          case 'boxUpdated':
            box = item.prev
            boxStore.updateBox(box)
            await nextTick()
            connectionStore.updateConnectionPath(box.id)
            break
        }
      }
      this.updatePointer({ decrement: true })
      this.shouldPreventPatchUpdates = false
    },

    // Redo

    async redo (patch) {
      const globalStore = useGlobalStore()
      const cardStore = useCardStore()
      const connectionStore = useConnectionStore()
      const boxStore = useBoxStore()

      if (globalStore.getToolbarIsDrawing) {
        globalStore.triggerDrawingRedo()
        return
      }
      if (!patch) {
        if (this.pointer === this.patches.length) {
          console.log('⏩ redo cancelled, pointer is at end', this.pointer, this.patches.length)
          return
        }
        patch = this.patches[this.pointer]
      }
      this.shouldPreventPatchUpdates = true
      for (const item of patch) {
        console.info('⏩ redo', item, { pointer: this.pointer, totalPatches: this.patches.length })
        const { action } = item
        let card, connection, type, box, prevCard
        switch (action) {
          case 'cardUpdated':
            card = item.new
            prevCard = cardStore.getCard(card.id)
            console.log('☎️', prevCard, card)
            if (prevCard) {
              cardStore.updateCard(card)
            } else {
              cardStore.createCard(card, true)
            }
            await nextTick()
            connectionStore.updateConnectionPath(card.id)
            break
          case 'cardCreated':
            card = item.new
            prevCard = cardStore.getCard(card.id)
            if (prevCard) {
              cardStore.restoreRemovedCard(card)
            } else {
              cardStore.createCard(card, true)
            }
            break
          case 'cardRemoved':
            card = item.new
            cardStore.removeCard(card)
            break
          case 'connectionUpdated':
            connection = item.new
            connectionStore.updateConnection(connection)
            break
          case 'connectionCreated':
            connection = utils.clone(item.new)
            connectionStore.createConnection(connection)
            break
          case 'connectionRemoved':
            connection = item.new
            connectionStore.removeConnection(connection)
            break
          case 'connectionTypeUpdated':
            type = item.new
            connectionStore.updateConnectionType(type)
            break
          case 'boxCreated':
            box = item.new
            boxStore.createBox(box)
            break
          case 'boxRemoved':
            box = item.new
            boxStore.removeBox(box)
            break
          case 'boxUpdated':
            box = item.new
            boxStore.updateBox(box)
            await nextTick()
            connectionStore.updateConnectionPath(box.id)
            break
        }
      }
      this.updatePointer({ increment: true })
      this.shouldPreventPatchUpdates = false
    },

    // Restore local changes over remote space
    // replays patches between the time local space is loaded to when remote space is loaded

    redoLocalUpdates () {
      this.patches.forEach(patch => {
        const actions = ['cardUpdated', 'boxUpdated']
        const isUpdate = actions.includes(patch[0].action)
        this.redo(patch)
      })
    }

  }
})
