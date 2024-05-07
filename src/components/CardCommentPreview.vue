<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import UserLabelInline from '@/components/UserLabelInline.vue'
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
const truncatedName = computed(() => utils.truncated(props.card.name))
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
</script>

<template lang="pug">
.card-comment-preview(v-if="visible" :style="styles")
  UserLabelInline(:user="createdByUser")
  .row
    span.badge.status.inline-badge
      img.icon.time(src="@/assets/time.svg")
      span {{ relativeDate }}
  p {{ truncatedName }}

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
  .row
    margin-top 1px
    margin-bottom 6px
</style>
