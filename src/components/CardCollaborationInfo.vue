<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import UserLabelInline from '@/components/UserLabelInline.vue'
import DateLabel from '@/components/DateLabel.vue'
import UserSettingsCards from '@/components/dialogs/UserSettingsCards.vue'
import CardHistory from '@/components/dialogs/CardHistory.vue'
import utils from '@/utils.js'

import uniqBy from 'lodash-es/uniqBy'

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
  cardsSettingsIsVisible: false,
  cardHistoryIsVisible: false
})

watch(() => props.visible, async (value, prevValue) => {
  await nextTick()
  if (value) {
    scrollParentIntoView()
  }
})

const closeDialogsFromParent = () => {
  globalStore.userDetailsIsVisible = false
  state.cardsSettingsIsVisible = false
  state.cardHistoryIsVisible = false
}
const closeDialogs = () => {
  globalStore.userDetailsIsVisible = false
  state.cardsSettingsIsVisible = false
  state.cardHistoryIsVisible = false
  emit('closeDialogs')
}
const scrollParentIntoView = () => {
  const element = props.parentElement
  if (!element) { return }
  globalStore.scrollElementIntoView({ element })
}

// @user mentions

const atUsers = computed(() => userStore.getUsersByCardAtUserMentions(props.card))

// @date mentions

const atDates = computed(() => props.card.atDateMentions || [])

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
  const value = !state.cardsSettingsIsVisible
  closeDialogs()
  state.cardsSettingsIsVisible = value
}

// card history

const toggleCardHistoryIsVisible = () => {
  const value = !state.cardHistoryIsVisible
  closeDialogs()
  state.cardHistoryIsVisible = value
}
</script>

<template lang="pug">
.row.card-collaboration-info.title-row(v-if="visible" @click.left.stop="closeDialogs")
  .info-wrap
    //- comment
    .badge.info.is-comment-badge(v-if="isComment")
      img.icon.comment(src="@/assets/comment.svg")
    //- @users
    .at-user-mentions
      template(v-for="user in atUsers" :key="user.id")
        UserLabelInline(:user="user" :isClickable="true" :truncateNameToLength="15" :isAtMention="true")
    //- @dates
    .at-date-mentions
      template(v-for="mention in atDates" :key="mention.id")
        DateLabel(:date="mention.date")
    //- votes
    .badge.info(v-if="card.counterIsVisible")
      span {{card.counterValue || 0}}
  //- buttons
  .buttons-wrap
    //- card history
    .button-wrap
      button.small-button.history-button.inline-button(@click.stop="toggleCardHistoryIsVisible" title="Card History" :class="{active: state.cardHistoryIsVisible}")
        img.icon.time(src="@/assets/time.svg")
      CardHistory(:visible="state.cardHistoryIsVisible" :card="props.card" :createdByUser="props.createdByUser" :updatedByUser="props.updatedByUser")
    //- settings
    .button-wrap
      button.small-button.settings-button.inline-button(@click.stop="toggleCardsSettingsIsVisible" :title="cardSettingsTitle" :class="{active: state.cardsSettingsIsVisible}")
        img.settings.icon(src="@/assets/settings.svg")
      UserSettingsCards(:visible="state.cardsSettingsIsVisible")
</template>

<style lang="stylus">
.card-collaboration-info
  .is-comment-badge
    flex-shrink 0
    height fit-content
  .info-wrap
    width max-content
    display flex
  .buttons-wrap
    flex-wrap nowrap
    display flex
    > .button-wrap
      margin-left 0
    > .button-wrap + .button-wrap
      padding-left 6px
    .settings-button,
    .history-button
      cursor pointer
    .icon.time
      vertical-align -1.5px
</style>
