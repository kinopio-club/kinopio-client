<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import cache from '@/cache.js'
import ResultsFilter from '@/components/ResultsFilter.vue'

// import fuzzy from '@/libs/fuzzy.js'

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
  const cachedEmojis = await cache.emojis()
  console.log('🍇🍇🍇', cachedEmojis)
  if (cachedEmojis.length) {
    state.emojis = cachedEmojis
  } else {
    state.isLoadingEmojis = true
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
  console.log('☀️☀️ state.filteredEmojis', state.filteredEmojis)
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

const categoryClassIndex = (index) => {
  return `category-${index}`
}

</script>

<template lang="pug">
dialog.narrow.emoji-picker(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'height': state.dialogHeight + 'px'}")
  ResultsFilter(
    :items="state.emojis"
    @updateFilter="updateFilter"
    @focusNextItem="focusNextItemFromFilter"
    @focusPreviousItem="focusPreviousItemFromFilter"
    @selectItem="selectItemFromFilter"
    :showFilter="true"
  )
  ul.results-list(v-for="(category, index) in state.filteredEmojis" :isLoading="state.isLoadingEmojis")
    .badge.secondary.category(:class="categoryClassIndex(index)")
      span {{ category.name }}
    .row
      template(v-for="emoji in category.emojis")
        span.emoji(:data-emoji="emoji.name") {{emoji.emoji}}
</template>

<style lang="stylus">
dialog.emoji-picker
  overflow auto
  max-height 350px
  .input
    margin-bottom 0
  ul.results-list
    padding-left 8px
    padding-right 8px
  .category
    margin-top 10px
    width fit-content
    &.category-0
      margin-top 0
  .row
    max-width 100%
    flex-wrap wrap
    .emoji
      padding 3px
      font-size 20px
      cursor pointer
      &:hover
        background-color var(--secondary-hover-background)
        border-radius var(--entity-radius)
      &:active,
      &.active
        background-color var(--secondary-active-background)
        box-shadow var(--button-active-inset-shadow)
</style>
