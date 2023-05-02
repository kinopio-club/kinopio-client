<script setup>
import Loader from '@/components/Loader.vue'
import NameSegment from '@/components/NameSegment.vue'
import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const props = defineProps({
  visible: Boolean,
  cardId: String
  // shouldTruncateName: Boolean
})

const isLoadingOtherItems = computed(() => store.state.isLoadingOtherItems)

// update card
const state = reactive({
  otherCard: {},
  nameSegments: []
})
watch(() => store.state.isLoadingOtherItems, (value, prevValue) => {
  if (!value) {
    state.otherCard = store.getters.otherCardById(props.cardId)
    updateNameSegments()
  }
})
const updateNameSegments = () => {
  const card = store.getters['currentCards/nameSegments'](state.otherCard)
  state.nameSegments = card.nameSegments
}

</script>

<template lang="pug">
.other-card-preview(v-if="visible" href="")
  .badge.button-badge.link-badge(@click.stop.prevent="")
    //- img.icon(src="@/assets/card.svg")
    template(v-if="isLoadingOtherItems")
      span {{props.cardId}}
    template(v-else)
      template(v-for="segment in state.nameSegments")
        img.card-image(v-if="segment.isImage" :src="segment.url")
        NameSegment(:segment="segment")

</template>

<style lang="stylus">
.other-card-preview
  text-decoration none
  .link-badge
    display block
  .card-image
    vertical-align middle
    border-radius var(--entity-radius)
    max-height 100px
    display block
    margin 4px 0px
  .tag
    display inline-block

</style>
