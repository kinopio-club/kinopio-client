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
  return {
    left: props.card.x + 'px',
    top: props.card.y + 'px'
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
  position absolute
  max-width 180px
  background teal
  background var(--secondary-hover-background)
  margin-left 6px
  margin-top 6px
  padding 4px
  z-index var(--max-z)
  border-radius var(--entity-radius)
  pointer-events none
  .row
    margin-top 1px
    margin-bottom 6px
</style>
