<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'

import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useGlobalStore } from '@/stores/useGlobalStore'

import utils from '@/utils.js'
import consts from '@/consts.js'

const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()
const broadcastStore = useBroadcastStore()
const themeStore = useThemeStore()
const globalStore = useGlobalStore()

let statusRetryCount = 0

let unsubscribes

onMounted(() => {
  console.info('🐢 kinopio-client build mode', import.meta.env.MODE)
  console.info('🐸 kinopio-server URL', consts.apiHost())
  if (utils.isLinux()) {
    utils.setCssVariable('sans-serif-font', '"Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif')
  }
  if (!import.meta.env.SSR) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', logSystemThemeChange)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateSystemTheme)
    updateIsOnline()
    window.addEventListener('online', updateIsOnline)
    window.addEventListener('offline', updateIsOnline)
  }

  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerUserIsLoaded') { updateSystemTheme() }
    }
  )
  const broadcastActionUnsubscribe = broadcastStore.$onAction(
    ({ name, args }) => {
      if (name === 'joinSpaceRoom') {
        updateMetaRSSFeed()
      }
    }
  )
  unsubscribes = () => {
    broadcastActionUnsubscribe()
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  if (!import.meta.env.SSR) {
    window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', logSystemThemeChange)
    window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', updateSystemTheme)
    window.removeEventListener('online', updateIsOnline)
    window.removeEventListener('offline', updateIsOnline)
  }
  unsubscribes()
})

const spaceName = computed(() => spaceStore.name)
const isSpacePage = computed(() => globalStore.getIsSpacePage)

// styles and position

const pageWidth = computed(() => {
  if (!isSpacePage.value) { return }
  const size = Math.max(globalStore.pageWidth, globalStore.viewportWidth)
  return size + 'px'
})
const pageHeight = computed(() => {
  if (!isSpacePage.value) { return }
  const size = Math.max(globalStore.pageHeight, globalStore.viewportHeight)
  return size + 'px'
})
const pageCursor = computed(() => {
  const isPanning = globalStore.currentUserIsPanning
  const isPanningReady = globalStore.currentUserIsPanningReady
  const toolbarIsBox = globalStore.getToolbarIsBox
  if (isPanning) {
    return 'grabbing'
  } else if (isPanningReady) {
    return 'grab'
  } else if (toolbarIsBox) {
    return 'crosshair'
  }
  return undefined
})
const spaceZoomDecimal = computed(() => globalStore.getSpaceZoomDecimal)

// users

const currentUserId = computed(() => userStore.id)

// online

const updateIsOnline = () => {
  const clientStatus = window.navigator.onLine
  if (!clientStatus) {
    globalStore.updateIsOnline(false)
    return
  }
  updateServerIsOnline()
}
const updateServerIsOnline = async () => {
  const maxIterations = 10
  const initialDelay = 1000 // 1 second
  const serverStatus = await apiStore.getStatus()
  if (serverStatus) {
    globalStore.updateIsOnline(true)
  // error offline
  } else {
    console.info('server online status', serverStatus)
    globalStore.updateIsOnline(false)
  }
  // retry
  let delay // delay increases up to ~15 minutes
  if (statusRetryCount < maxIterations) {
    statusRetryCount++
    delay = Math.pow(2, statusRetryCount) * initialDelay
  }
  delay = delay || 15 * 60 * 1000 // 15 minutes
  setTimeout(updateServerIsOnline, delay)
}

// theme

const isThemeDark = computed(() => themeStore.getIsThemeDark)
const logSystemThemeChange = (event) => {
  const themeIsSystem = userStore.themeIsSystem
  console.warn('🌓 logSystemThemeChange', window.matchMedia('(prefers-color-scheme: dark)'), event, { themeIsSystem })
}
const updateSystemTheme = () => {
  themeStore.updateSystemTheme()
}

// remote

const broadcastUserLabelCursor = (event) => {
  if (!globalStore.getIsSpacePage) { return }
  const updates = utils.cursorPositionInSpace(event)
  if (!updates) { return }
  updates.userId = userStore.id
  updates.zoom = spaceZoomDecimal.value
  broadcastStore.update({ updates, action: 'triggerUpdateRemoteUserCursor' })
}
const isTouchDevice = () => {
  globalStore.isTouchDevice = true
}

// rss

const clearMetaRSSFeed = () => {
  const link = document.querySelector("link[type='application/rss+xml']")
  if (link) {
    link.remove()
  }
}
const updateMetaRSSFeed = () => {
  const spaceIsPrivate = spaceStore.privacy === 'private'
  const spaceIsRemote = spaceStore.getSpaceIsRemote
  clearMetaRSSFeed()
  if (!spaceIsRemote) { return }
  if (spaceIsPrivate) { return }
  const head = document.querySelector('head')
  const spaceId = spaceStore.id
  const url = `${consts.apiHost()}/space/${spaceId}/feed.json`
  const link = document.createElement('link')
  link.rel = 'alternative'
  link.type = 'application/rss+xml'
  link.title = 'JSON Feed'
  link.href = url
  head.appendChild(link)
}
</script>

<template lang='pug'>
.app(
  @pointermove="broadcastUserLabelCursor"
  @touchstart="isTouchDevice"
  :style="{ width: pageWidth, height: pageHeight, cursor: pageCursor }"
  :class="{ 'no-background': !isSpacePage, 'is-dark-theme': isThemeDark }"
  :data-current-user-id="currentUserId"
)
  slot
</template>
