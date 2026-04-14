<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'
import consts from '@/consts.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const router = useRouter()

let unsubscribes

onMounted(() => {
  window.addEventListener('popstate', loadSpaceOnBackOrForward)
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerUpdateWindowHistory') {
        update()
      } else if (name === 'triggerUpdateWindowTitle') {
        updateWindowTitle()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('popstate', loadSpaceOnBackOrForward)
  unsubscribes()
})

watch(() => globalStore.userNotifications, (value, prevValue) => {
  updateWindowTitle()
})

// handles browser back/forward

const loadSpaceOnBackOrForward = () => {
  const url = new URL(window.location)
  if (!utils.urlIsSpace(url.href)) { return }
  const spaceId = utils.spaceIdFromUrl(url.href)
  spaceStore.loadSpace({ id: spaceId })
}

// update browser history/title when space loads

const update = async () => {
  await updateWindowHistory()
  updateWindowTitle()
}
const updateWindowHistory = async () => {
  const isEmbedMode = globalStore.isEmbedMode
  const space = spaceStore.getSpaceAllState
  const spaceUrl = utils.url(space)
  const preventUpdate = window.location.pathname.includes(spaceUrl) || spaceUrl.startsWith('loading--')
  if (preventUpdate) { return }
  const currentUserIsSignedIn = userStore.getUserIsSignedIn
  globalStore.currentSpacePath = spaceUrl
  if (navigator.standalone || isEmbedMode) { return }
  await router.push('/' + spaceUrl)
  let state = globalStore.getGlobalAllState
  state = JSON.parse(JSON.stringify(state))
  history.replaceState({ ...history.state, ...state }, '')
}
const updateWindowTitle = () => {
  const space = spaceStore.getSpaceAllState
  let title
  // name
  if (space.name === 'Hello Kinopio') {
    title = 'Kinopio'
  } else if (space.name) {
    title = `${space.name} – Kinopio`
  } else {
    title = 'Kinopio'
  }
  // dev
  if (consts.isDevelopment()) {
    title = `[DEV] ${title}`
  }
  // notification count
  const unread = globalStore.userNotifications.filter(notification => !notification.isRead)
  const count = unread.length || 0
  if (count) {
    title = `(${count}) ${title}`
  }
  document.title = title
}
</script>

<template lang="pug">
</template>
<style lang="stylus">
</style>
