<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import Loader from '@/components/Loader.vue'
import CardList from '@/components/CardList.vue'
import BoxList from '@/components/BoxList.vue'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const boxStore = useBoxStore()
const cardStore = useCardStore()
const spaceStore = useSpaceStore()

const resultsElement = ref(null)

onMounted(() => {
  clearPreviousResultItem()
  updateResultsSectionHeight()
  window.addEventListener('resize', updateResultsSectionHeight)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateResultsSectionHeight)
})

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  resultsSectionHeight: null
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    clearPreviousResultItem()
    updateResultsSectionHeight()
  }
})

const spaceIsLoaded = computed(() => !globalStore.isLoadingSpace)
watch(() => spaceIsLoaded.value, (value, prevValue) => {
  if (value) {
    updateResultsSectionHeight()
  }
})

const clearPreviousResultItem = () => {
  globalStore.clearPreviousResultItem()
}
const updateResultsSectionHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = resultsElement.value
  state.resultsSectionHeight = utils.elementHeight(element, true)
}

// cards

const cards = computed(() => {
  let items = cardStore.getCardsIsTodoSortedByY
  items = utils.sortByDistanceFromOrigin(items)
  return items
})
const selectCard = (card) => {
  const isCardInCurrentSpace = card.spaceId === spaceStore.id
  if (isCardInCurrentSpace) {
    globalStore.updateFocusOnCardId(card.id)
    globalStore.previousResultItem = card
  }
  // } else {
  // selectSpaceCard(card) Search.vue
  // }
}

// boxes

const selectBox = (box) => {
  globalStore.updateFocusOnBoxId(box.id)
}
const boxes = computed(() => {
  let items = boxStore.getAllBoxes
  items = utils.sortByDistanceFromOrigin(items)
  items = items.filter(item => utils.checkboxFromString(item.name))
  return items
})
</script>

<template lang="pug">
.todos(v-if="props.visible")
  section
    .row
      p Todos
      Loader(:visible="!spaceIsLoaded" :isSmall="true")
    section.subsection(v-if="!cards.length")
      p Prepend cards with
        .badge.info [ ]
        span to create checkbox cards that you can track here.
  section.results-section(v-if="cards.length || boxes.length")
    BoxList(
      :boxes="boxes"
      @selectBox="selectBox"
    )
    CardList(
      :cards="cards"
      :shouldHideDate="true"
      @selectCard="selectCard"
    )
</template>

<style lang="stylus">
.todos
  border-top 1px solid var(--primary-border)
  .button-wrap
    margin 0
  .tips-section
    border 0
    padding-top 0
  .subsection
    padding 4px
    border-radius var(--entity-radius)
  label
    .user
      vertical-align -3px
      transform translateY(-1px)
      margin-right 0
      .user-avatar
        width 17px
        height 16px
  .boxes-list
    padding-left 2px
    padding-right 2px
    padding-bottom 2px
  .loader
    margin-left 6px
</style>
