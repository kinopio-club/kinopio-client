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
  const globalStoreUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerUpdateWindowHistory') {
        update()
      } else if (name === 'triggerUpdateWindowTitle') {
        updateWindowTitle()
      }
    }
  )
  unsubscribes = () => {
    globalStoreUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
})

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
  const state = globalStore.getGlobalAllState
  history.replaceState({ ...history.state, ...state }, '')
}
const updateWindowTitle = () => {
  const space = spaceStore.getSpaceAllState
  let title
  if (space.name === 'Hello Kinopio') {
    title = 'Kinopio'
  } else if (space.name) {
    title = `${space.name} – Kinopio`
  } else {
    title = 'Kinopio'
  }
  if (consts.isDevelopment()) {
    title = `[DEV] ${title}`
  }
  document.title = title
}
</script>

<template lang="pug">
</template>
<style lang="stylus">
</style>
