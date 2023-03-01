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
  isLoading: Boolean
})
const emit = defineEmits(['selectSpace'])

const selectSpace = (spaceId) => {
  emit('selectSpace', spaceId)
}
const spaceIsCurrentSpace = (spaceId) => {
  return spaceId === store.state.currentSpace.id
}
</script>

<template lang="pug">
ul.results-list
  template(v-for="group in groupedItems")
    //- space
    li.space-name(v-if="group.spaceId" :data-space-id="group.spaceId" @click="selectSpace(group.spaceId)" :class="{ active: spaceIsCurrentSpace(group.spaceId) }")
      BackgroundPreview(v-if="group.space" :space="group.space")
      span.badge.space-badge
        span {{group.spaceName}}
    //- cards
    CardList(:cards="group.cards" :primaryActionIsCardListOptions="primaryActionIsCardListOptions")
Loader(:visible="isLoading")
</template>

<style lang="stylus">
</style>
