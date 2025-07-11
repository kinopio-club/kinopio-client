import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useApiStore } from '@/stores/useApiStore'

import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'

let checkChangelogIntervalTimer

export const useChangelogStore = defineStore('changelog', {
  state: () => ({
    isUpdated: false,
    updates: []
  }),

  actions: {
    async init () {
      await this.update()
      if (!utils.arrayHasItems(this.updates)) { return }
      checkChangelogIntervalTimer = setInterval(() => {
        this.update()
      }, 1000 * 60 * 60 * 1) // 1 hour
    },
    async update () {
      const apiStore = useApiStore()
      try {
        let posts = await apiStore.getChangelog()
        if (!posts) { return }
        posts = posts.slice(0, 20)
        this.updates = posts
        this.updateIsUpdated()
      } catch (error) {
        console.error('🚒 changelog update', error)
      }
    },
    async updateIsUpdated () {
      if (!this.updates) { return }
      const newId = this.updates[0]?.id || 0
      const prevId = await cache.prevReadChangelogId()
      if (!prevId) {
        // first time visitors are updated to latest changelog
        cache.updatePrevReadChangelogId(newId)
        this.isUpdated = false
      } else {
        const isUpdated = prevId !== newId
        this.isUpdated = isUpdated
      }
    }
  }
})
