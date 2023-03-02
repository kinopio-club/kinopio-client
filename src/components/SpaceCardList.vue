<script setup>
import CardList from '@/components/CardList.vue'
import Loader from '@/components/Loader.vue'
import BackgroundPreview from '@/components/BackgroundPreview.vue'

import { reactive, computed, onMounted, defineProps, defineEmits, watch } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const props = defineProps({
  groupedItems: Array,
  primaryActionIsCardListOptions: Boolean,
  isLoading: Boolean,
  search: String
})
const emit = defineEmits(['selectSpace', 'selectCard'])

const spaceIsCurrentSpace = (spaceId) => {
  return spaceId === store.state.currentSpace.id
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
  template(v-for="group in groupedItems")
    //- space
    hr
    li.space-name(v-if="group.spaceId" :data-space-id="group.spaceId" @click="selectSpace(group.spaceId)" :class="{ active: spaceIsCurrentSpace(group.spaceId) }")
      BackgroundPreview(v-if="group.space" :space="group.space")
      span {{group.spaceName}}
    //- cards
    CardList(:cards="group.cards" :search="search" :primaryActionIsCardListOptions="primaryActionIsCardListOptions" @selectCard="selectCard")
Loader(:visible="isLoading")
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
