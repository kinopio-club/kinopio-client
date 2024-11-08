<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import SpaceList from '@/components/SpaceList.vue'
import cache from '@/cache.js'
import utils from '@/utils.js'

import dayjs from 'dayjs'

const store = useStore()

const resultsSectionElement = ref(null)

onMounted(() => {
  init()
})

const emit = defineEmits(['updateDialogHeight', 'isLoading'])

const state = reactive({
  remoteSpaces: []
})

const init = async () => {
  await updateRemoteSpaces()
}
const updateHeight = () => {
  emit('updateDialogHeight')
  updateResultsSectionHeight()
}
// copied from SpaceDetails.vue
const sortSpacesByEditedAt = (spaces) => {
  const sortedSpaces = spaces.sort((a, b) => {
    const bEditedAt = dayjs(b.editedAt).unix()
    const aEditedAt = dayjs(a.editedAt).unix()
    return bEditedAt - aEditedAt
  })
  return sortedSpaces
}
const parentDialog = computed(() => 'addSpace')
const updateResultsSectionHeight = async () => {
  await nextTick()
  let element = resultsSectionElement.value
  state.resultsSectionHeight = utils.elementHeight(element, true)
}

// spaces

const selectSpace = (space) => {
  store.dispatch('currentSpace/changeSpace', space)
}
const localSpaces = () => {
  const spaces = cache.getAllSpaces().filter(space => {
    const isUser = store.state.currentUser.id === space.userId
    return space.isTemplate && isUser
  })
  return spaces
}
const updateRemoteSpaces = async () => {
  const currentUserIsSignedIn = store.getters['currentUser/isSignedIn']
  if (!currentUserIsSignedIn) { return }
  emit('isLoading', true)
  try {
    let remoteSpaces = await store.dispatch('api/getUserSpaces')
    state.remoteSpaces = remoteSpaces.filter(space => space.isTemplate)
  } catch (error) {
    console.error('🚒 updateRemoteSpaces', error)
  }
  emit('isLoading', false)
}
const templateSpaces = computed(() => {
  let spaces = localSpaces()
  if (state.remoteSpaces.length) {
    spaces = state.remoteSpaces
  }
  spaces = sortSpacesByEditedAt(spaces)
  updateHeight()
  return spaces
})
</script>

<template lang="pug">
section.results-section.user-template-space-list(v-if="templateSpaces.length" ref="resultsSectionElement" :style="{'max-height': state.resultsSectionHeight + 'px'}")
  SpaceList(
    :spaces="templateSpaces"
    @selectSpace="selectSpace"
    :isLoading="state.isLoading"
    :parentDialog="parentDialog"
  )
</template>

<style lang="stylus">
.user-template-space-list
  position relative
  .loader
    position absolute
    top 4px
    left 8px
</style>
