<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import UserLabelInline from '@/components/UserLabelInline.vue'
import utils from '@/utils.js'
const store = useStore()

let dateIsUpdated
let updatedAbsoluteDate

onMounted(() => {
  dateIsUpdated = false
  updatedAbsoluteDate = ''
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerCloseChildDialogs' && props.visible) {
      closeDialogsFromParent()
    }
  })
})

const emit = defineEmits(['closeDialogs'])

const props = defineProps({
  visible: Boolean,
  createdByUser: Object,
  updatedByUser: Object,
  card: Object,
  parentElement: Object
})

watch(() => props.visible, async (value, prevValue) => {
  await nextTick()
  if (value) {
    scrollParentIntoView()
  }
})

const closeDialogsFromParent = () => {
  store.commit('userDetailsIsVisible', false)
}
const closeDialogs = () => {
  store.commit('userDetailsIsVisible', false)
  emit('closeDialogs')
}
const scrollParentIntoView = () => {
  const element = props.parentElement
  if (!element) { return }
  store.commit('scrollElementIntoView', { element })
}

// date

const dateUpdatedAt = computed(() => {
  const date = props.card.nameUpdatedAt || props.card.createdAt
  const showAbsoluteDate = store.state.currentUser.filterShowAbsoluteDates
  if (date) {
    if (showAbsoluteDate) {
      return new Date(date).toLocaleString()
    } else {
      return utils.shortRelativeTime(date)
    }
  } else {
    return 'now'
  }
})
const toggleFilterShowAbsoluteDates = () => {
  closeDialogs()
  const value = !store.state.currentUser.filterShowAbsoluteDates
  store.dispatch('currentUser/toggleFilterShowAbsoluteDates', value)
}

// user

const createdByUserIsNotEmpty = computed(() => utils.objectHasKeys(props.createdByUser))
const isUpdatedByDifferentUser = computed(() => props.createdByUser.id !== props.updatedByUser.id)
const userDetailsIsUser = (user) => {
  if (!store.state.userDetailsIsVisible) { return }
  const userDetailsUser = store.state.userDetailsUser
  return user.id === userDetailsUser.id
}
</script>

<template lang="pug">
.row.collaboration-info(v-if="visible" @click.left.stop="closeDialogs")
  .badge.status.button-badge(@click.left.prevent.stop="toggleFilterShowAbsoluteDates" @touchend.prevent.stop="toggleFilterShowAbsoluteDates")
    img.icon.time(src="@/assets/time.svg")
    span.name {{dateUpdatedAt}}
  .users
    //- created by
    template(v-if="createdByUserIsNotEmpty")
      UserLabelInline(:user="createdByUser" :isClickable="true" :title="'Created by'" :isOnDarkBackground="true")
    //- updated by
    template(v-if="isUpdatedByDifferentUser")
      UserLabelInline(:user="updatedByUser" :isClickable="true" :title="'Updated by'" :isOnDarkBackground="true")
    //- created through api
    .badge.status.system-badge(v-if="card.isCreatedThroughPublicApi" title="Created via public API")
      img.icon.system(src="@/assets/system.svg")
  .badge.info(v-if="card.counterIsVisible")
    span {{card.counterValue || 0}}
</template>

<style lang="stylus">
.collaboration-info
  .users
    display flex
    flex-wrap wrap
  .system-badge
    margin-top 1px
  .name
    color var(--primary)
</style>
