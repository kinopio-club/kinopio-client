<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import UserLabelInline from '@/components/UserLabelInline.vue'
import UserSettingsCards from '@/components/dialogs/UserSettingsCards.vue'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

let dateIsUpdated
let updatedAbsoluteDate
let unsubscribes

onMounted(() => {
  dateIsUpdated = false
  updatedAbsoluteDate = ''

  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerCloseChildDialogs' && props.visible) {
        closeDialogsFromParent()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
})

const emit = defineEmits(['closeDialogs'])

const props = defineProps({
  visible: Boolean,
  createdByUser: Object,
  updatedByUser: Object,
  card: Object,
  parentElement: Object,
  isComment: Boolean
})

const state = reactive({
  cardsSettingsIsVisible: false
})

watch(() => props.visible, async (value, prevValue) => {
  await nextTick()
  if (value) {
    scrollParentIntoView()
  }
})

const shouldShowItemActions = computed(() => userStore.shouldShowItemActions)
const closeDialogsFromParent = () => {
  globalStore.userDetailsIsVisible = false
  state.cardsSettingsIsVisible = false
}
const closeDialogs = () => {
  globalStore.userDetailsIsVisible = false
  state.cardsSettingsIsVisible = false
  emit('closeDialogs')
}
const scrollParentIntoView = () => {
  const element = props.parentElement
  if (!element) { return }
  globalStore.scrollElementIntoView({ element })
}

// date

const dateUpdatedAt = computed(() => {
  const date = props.card.nameUpdatedAt || props.card.createdAt
  const showAbsoluteDate = userStore.filterShowAbsoluteDates
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
  const value = !userStore.filterShowAbsoluteDates
  userStore.updateUser({ filterShowAbsoluteDates: value })
}

// user

const createdByUserIsNotEmpty = computed(() => utils.objectHasKeys(props.createdByUser))
const isUpdatedByDifferentUser = computed(() => props.createdByUser.id !== props.updatedByUser.id)
const userDetailsIsUser = (user) => {
  if (!globalStore.userDetailsIsVisible) { return }
  const userDetailsUser = globalStore.userDetailsUser
  return user.id === userDetailsUser.id
}

// card settings

const cardSettingsTitle = computed(() => {
  let title = 'Card Settings'
  let shortcut = '( Shift-Enter: Line Break)'
  if (userStore.cardSettingsShiftEnterShouldAddChildCard) {
    shortcut = '(Shift-Enter: Child Card)'
  }
  title = `${title} ${shortcut}`
  return title
})
const toggleCardsSettingsIsVisible = () => {
  state.cardsSettingsIsVisible = !state.cardsSettingsIsVisible
}
</script>

<template lang="pug">
.row.card-collaboration-info(v-if="visible" @click.left.stop="closeDialogs")
  //- settings
  .button-wrap
    button.small-button.settings-button.inline-button(@click.stop="toggleCardsSettingsIsVisible" :title="cardSettingsTitle" :class="{active: state.cardsSettingsIsVisible}")
      img.settings.icon(src="@/assets/settings.svg")
    UserSettingsCards(:visible="state.cardsSettingsIsVisible")
  //- comment
  .badge.info.is-comment-badge(v-if="isComment")
    img.icon.comment(src="@/assets/comment.svg")
  //- date
  .badge.status.button-badge.time-badge(v-if="shouldShowItemActions" @click.left.prevent.stop="toggleFilterShowAbsoluteDates" @touchend.prevent.stop="toggleFilterShowAbsoluteDates")
    img.icon.time(src="@/assets/time.svg")
    span.name {{dateUpdatedAt}}
  .users(v-if="shouldShowItemActions")
    //- created by
    template(v-if="createdByUserIsNotEmpty")
      UserLabelInline(:user="createdByUser" :isClickable="true" :title="'Created by'" :isOnDarkBackground="true" :truncateNameToLength="15")
    //- updated by
    template(v-if="isUpdatedByDifferentUser")
      UserLabelInline(:user="updatedByUser" :isClickable="true" :title="'Updated by'" :isOnDarkBackground="true" :truncateNameToLength="15")
    //- created through api
    .badge.status.system-badge(v-if="card.isCreatedThroughPublicApi" title="Created via public API")
      img.icon.system(src="@/assets/system.svg")
  .badge.info(v-if="card.counterIsVisible")
    span {{card.counterValue || 0}}
</template>

<style lang="stylus">
.card-collaboration-info
  .users
    display flex
    flex-wrap wrap
  .system-badge
    margin-top 1px
  .name
    color var(--primary)
  .is-comment-badge
    flex-shrink 0
  .settings-button
    margin-right 5px
    cursor pointer
  .time-badge
    display flex
    align-items center
</style>
