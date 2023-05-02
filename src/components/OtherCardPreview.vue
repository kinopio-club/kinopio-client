<script setup>
import Loader from '@/components/Loader.vue'
import NameSegment from '@/components/NameSegment.vue'
import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const props = defineProps({
  visible: Boolean,
  otherCardId: String,
  otherSpaceId: String
  // shouldTruncateName: Boolean
})

const isLoadingOtherItems = computed(() => store.state.isLoadingOtherItems)
const url = computed(() => utils.urlFromSpaceAndCard({ cardId: props.otherCardId, spaceId: props.otherSpaceId }))

// update card
const state = reactive({
  otherCard: {},
  nameSegments: []
})
watch(() => store.state.isLoadingOtherItems, (value, prevValue) => {
  if (!value) {
    state.otherCard = store.getters.otherCardById(props.otherCardId)
    updateNameSegments()
  }
})
const updateNameSegments = () => {
  const card = store.getters['currentCards/nameSegments'](state.otherCard)
  state.nameSegments = card.nameSegments
}

</script>

<template lang="pug">
a.other-card-preview(v-if="visible" :href="url")
  .badge.button-badge.link-badge(@click.stop.prevent="selectOtherCard($event)")
    template(v-if="isLoadingOtherItems")
      Loader(:visible="true" :isSmall="true")
      span Card
    template(v-else)
      template(v-for="segment in state.nameSegments")
        img.card-image(v-if="segment.isImage" :src="segment.url")
        NameSegment(:segment="segment")

</template>

<style lang="stylus">
.other-card-preview
  display block
  text-decoration none
  word-wrap break-word
  .link-badge
    display block
    margin 0
  .card-image
    vertical-align middle
    border-radius var(--entity-radius)
    max-height 100px
    display block
    margin 4px 0px
  .tag
    display inline-block
  .badge
    > .loader
      vertical-align -2px

</style>
