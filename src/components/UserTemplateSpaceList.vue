<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
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

const emit = defineEmits(['updateDialogHeight', 'isLoading', 'selectSpace'])

const state = reactive({
  remoteSpaces: [],
  localSpaces: []
})

const init = async () => {
  updateRemoteSpaces()
  updateLocalSpaces()
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
  const element = resultsSectionElement.value
  state.resultsSectionHeight = utils.elementHeight(element, true)
}
const triggerTemplatesIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerTemplatesIsVisible')
}

// spaces

const selectSpace = (space) => {
  emit('selectSpace', space)
}
const updateLocalSpaces = async () => {
  const cachedSpaces = await cache.getAllSpaces()
  const spaces = cachedSpaces.filter(space => {
    const isUser = store.state.currentUser.id === space.userId
    return space.isTemplate && isUser
  })
  state.localSpaces = spaces
}
const updateRemoteSpaces = async () => {
  const currentUserIsSignedIn = store.getters['currentUser/isSignedIn']
  if (!currentUserIsSignedIn) { return }
  emit('isLoading', true)
  try {
    const remoteSpaces = await store.dispatch('api/getUserSpaces')
    state.remoteSpaces = remoteSpaces.filter(space => space.isTemplate)
  } catch (error) {
    console.error('🚒 updateRemoteSpaces', error)
  }
  emit('isLoading', false)
}
const templateSpaces = computed(() => {
  let spaces = state.localSpaces
  if (state.remoteSpaces.length) {
    spaces = state.remoteSpaces
  }
  spaces = sortSpacesByEditedAt(spaces)
  updateHeight()
  return spaces
})
</script>

<template lang="pug">
section.results-section.user-template-space-list(ref="resultsSectionElement" :style="{'max-height': state.resultsSectionHeight + 'px'}")
  template(v-if="templateSpaces.length")
    SpaceList(
      :spaces="templateSpaces"
      @selectSpace="selectSpace"
      :isLoading="state.isLoading"
      :parentDialog="parentDialog"
      :showDuplicateTemplateIcon="true"
    )
  .button-wrap
    button(@click="triggerTemplatesIsVisible")
      img.icon.templates(src="@/assets/templates.svg")
      span Templates
    //- Loader(:visible="state.templatesIsLoading" :isSmall="true")

</template>

<style lang="stylus">
.user-template-space-list
  position relative
  .button-wrap
    margin-left 4px
    margin-bottom 4px
  .loader
    position absolute
    top 4px
    left 8px
</style>
