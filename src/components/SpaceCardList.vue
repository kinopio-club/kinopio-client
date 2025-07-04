<script setup>
import { reactive, computed, onMounted, watch } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import CardList from '@/components/CardList.vue'
import Loader from '@/components/Loader.vue'
import BackgroundPreview from '@/components/BackgroundPreview.vue'

const globalStore = useGlobalStore()
const spaceStore = useSpaceStore()

const props = defineProps({
  groupedItems: Array,
  isLoading: Boolean,
  search: String,
  currentCard: Object
})
const emit = defineEmits(['selectSpace', 'selectCard'])

const spaceIsCurrentSpace = (spaceId) => {
  return spaceId === spaceStore.id
}
const spaceIsFocused = (spaceId) => {
  return globalStore.previousResultItem.id === spaceId
}

const selectSpace = (spaceId) => {
  emit('selectSpace', spaceId)
}
const selectCard = (card) => {
  emit('selectCard', card)
}
</script>

<template lang="pug">
ul.results-list
  template(v-for="group in props.groupedItems")
    //- space
    hr
    li.space-name(v-if="group.spaceId" :data-space-id="group.spaceId" @click="selectSpace(group.spaceId)" :class="{ active: spaceIsCurrentSpace(group.spaceId), hover: spaceIsFocused(group.spaceId) }")
      BackgroundPreview(v-if="group.space" :space="group.space")
      span {{group.spaceName}}
    //- cards
    CardList(:cards="group.cards" :search="props.search" :currentCard="props.currentCard" @selectCard="selectCard")
Loader(:visible="props.isLoading")
</template>

<style lang="stylus">
.results-list
  hr:first-child
    display none
  hr
    margin 4px 0
    margin-left -4px
    width calc(100% + 8px)
  .background-preview
    margin-right 6px

</style>
