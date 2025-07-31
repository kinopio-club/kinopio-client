<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import Loader from '@/components/Loader.vue'
import CardList from '@/components/CardList.vue'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const spaceStore = useSpaceStore()

const resultsElement = ref(null)

onMounted(() => {
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
    updateResultsSectionHeight()
  }
})

const spaceIsLoaded = computed(() => !globalStore.isLoadingSpace)
watch(() => spaceIsLoaded.value, (value, prevValue) => {
  if (value) {
    updateResultsSectionHeight()
  }
})

const updateResultsSectionHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = resultsElement.value
  state.resultsSectionHeight = utils.elementHeight(element, true)
}

const cards = computed(() => cardStore.getCardsIsTodo)

// update cardlist to have checkbox button if card is todo,
// reqs userStore.getUserCanEditSpace, else disabled

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
        span to create checkbox cards
  section.results-section(v-if="cards.length")
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
</style>
