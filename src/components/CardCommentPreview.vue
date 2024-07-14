<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import UserLabelInline from '@/components/UserLabelInline.vue'
import NameSegment from '@/components/NameSegment.vue'
import utils from '@/utils.js'

const store = useStore()

const props = defineProps({
  visible: Boolean,
  card: Object
})

const styles = computed(() => {
  const zoom = store.getters.spaceCounterZoomDecimal
  const offset = 6
  return {
    left: `${props.card.x + offset}px`,
    top: `${props.card.y + offset}px`,
    transform: `scale(${zoom})`
  }
})

const createdByUser = computed(() => {
  // same as userDetailsWrap.cardCreatedByUser
  const userId = props.card.userId
  let user = store.getters['currentSpace/userById'](userId)
  if (!user) {
    user = {
      name: '',
      color: '#cdcdcd' // secondary-active-background
    }
  }
  return user
})
const relativeDate = computed(() => utils.shortRelativeTime(props.card.nameUpdatedAt || props.card.updatedAt))

// name

const normalizedCard = computed(() => {
  let card = utils.clone(props.card)
  card = store.getters['currentCards/nameSegments'](card)
  return card
})
const isStrikeThrough = computed(() => {
  return props.card.name.startsWith('[x]')
})
const urlPreviewImage = computed(() => {
  if (!props.card.urlPreviewIsVisible) { return }
  return props.card.urlPreviewImage
})
</script>

<template lang="pug">
.card-comment-preview(v-if="visible" :style="styles")
  UserLabelInline(:user="createdByUser")
  .row
    span.badge.status.inline-badge
      img.icon.time(src="@/assets/time.svg")
      span {{ relativeDate }}
  template(v-for="segment in normalizedCard.nameSegments")
    img.card-image(v-if="segment.isImage" :src="segment.url")
    img.card-image(v-if="urlPreviewImage" :src="urlPreviewImage")
    NameSegment(:segment="segment" :isStrikeThrough="isStrikeThrough")
  .bottom-gradient
</template>

<style lang="stylus">
.card-comment-preview
  transform-origin top left
  position absolute
  max-width 180px
  background var(--secondary-hover-background)
  padding 4px
  z-index var(--max-z)
  border-radius var(--entity-radius)
  pointer-events none
  max-height 400px
  overflow hidden
  .row
    margin-top 1px
    margin-bottom 6px
  p
    padding 2px
    padding-top 0
    word-wrap break-word
    overflow-wrap break-word
  .tag
    display inline-block
    margin 0
  .bottom-gradient
    position absolute
    width 100%
    left 0
    bottom 0
    background linear-gradient(transparent, var(--secondary-hover-background))
    height 8px
  .card-image
    border-radius var(--entity-radius)
  .name-segment
    white-space pre-wrap
</style>
