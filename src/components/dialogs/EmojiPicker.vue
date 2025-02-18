<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import cache from '@/cache.js'
import ResultsFilter from '@/components/ResultsFilter.vue'
// import Loader from '@/components/Loader.vue'

// import fuzzy from '@/libs/fuzzy.js'
// virtua

const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
  initEmojis()
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['updateGroupEmoji'])

const props = defineProps({
  visible: Boolean,
  currentEmoji: String
})
const state = reactive({
  dialogHeight: null,
  emojis: [], // { name: 'group', [emojis] }
  filteredEmojis: [], // ^
  filter: ''
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    initEmojis()
    updateDialogHeight()
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}
const initEmojis = async () => {
  state.isLoadingEmojis = true
  const cachedEmojis = await cache.emojis()
  console.log('🍇🍇🍇', cachedEmojis)
  if (cachedEmojis.length) {
    state.emojis = cachedEmojis
  } else {
    await remoteEmojis()
  }
  updateFilteredEmojis()
  state.isLoadingEmojis = false
}

const remoteEmojis = async () => {
  try {
    const newEmojis = await store.dispatch('api/getEmojis')
    await cache.updateEmojis({
      emojis: newEmojis.emojis,
      version: newEmojis.version
    })
    state.emojis = newEmojis.emojis

    console.log('🌹🌹🌹🌹🌹', newEmojis, state.emojis)
  } catch (error) {
    console.error('🚒')
  }
}

const updateFilter = (newValue) => {
  console.log('♥️♥️ updateFilter', newValue)
  state.filter = newValue.toLowerCase()
}
const updateFilteredEmojis = () => {
  if (!state.filter) {
    state.filteredEmojis = state.emojis
  } else {
    // TODO fuzzy filter on emoji names
    state.filteredEmojis = []
  }
}
watch(() => state.filter, (value, prevValue) => {
  updateFilteredEmojis()
  console.log('state.filteredEmojis', state.filteredEmojis)
  //   updateDialogHeight()
})

const focusNextItemFromFilter = () => {
  console.log('🅰️🅰️ focusNextItemFromFilter')
}
const focusPreviousItemFromFilter = () => {
  console.log('🎃🎃 focusPreviousItemFromFilter')
}
const selectItemFromFilter = () => {
  console.log('💐💐 selectItemFromFilter')
}

</script>

<template lang="pug">
dialog.narrow.emoji-picker(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  //- section
  //-   input(v-model="filter")

    :placeholder="placeholder"

  ResultsFilter(
    :items="state.emojis"
    @updateFilter="updateFilter"
    @focusNextItem="focusNextItemFromFilter"
    @focusPreviousItem="focusPreviousItemFromFilter"
    @selectItem="selectItemFromFilter"
    :showFilter="true"
  )
  ul.results-list(v-for="(emoji, index) in state.filteredEmojis")
    //- v-for w :data-alases filteredEmojis
    .emoji 1
    .emoji 2
    .emoji 3
</template>

<style lang="stylus">
dialog.emoji-picker
  .input
    margin-bottom 0
</style>
