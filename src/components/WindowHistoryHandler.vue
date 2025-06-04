<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'
import consts from '@/consts.js'

const store = useStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const router = useRouter()

let unsubscribe

onMounted(() => {
  unsubscribe = store.subscribe(mutation => {
    if (mutation.type === 'triggerUpdateWindowHistory') {
      update(mutation.payload)
    } else if (mutation.type === 'triggerUpdateWindowTitle') {
      updateWindowTitle()
    }
  })
})
onBeforeUnmount(() => {
  unsubscribe()
})

const update = async (space) => {
  await updateWindowHistory(space)
  updateWindowTitle()
}
const updateWindowHistory = async (space) => {
  const isEmbedMode = store.state.isEmbedMode
  space = space || spaceStore.getSpaceAllState
  const spaceUrl = utils.url(space)
  const preventUpdate = window.location.pathname.includes(spaceUrl) || spaceUrl.startsWith('loading--')
  if (preventUpdate) { return }
  const currentUserIsSignedIn = userStore.getUserIsSignedIn
  store.commit('currentSpacePath', spaceUrl, { root: true })
  if (navigator.standalone || isEmbedMode) { return }
  await router.push('/' + spaceUrl)
  const state = utils.clone(store.state)
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
