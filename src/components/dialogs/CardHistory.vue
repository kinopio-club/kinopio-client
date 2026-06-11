<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'

import UserLabelInline from '@/components/UserLabelInline.vue'
import utils from '@/utils.js'
import Loader from '@/components/Loader.vue'
import OfflineBadge from '@/components/OfflineBadge.vue'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()

let unsubscribes

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
  updateCardHistory()
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'clearDraggingItems') {
        console.log('clearDraggingItems')
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
  window.removeEventListener('resize', updateDialogHeight)
})

// const emit = defineEmits(['closeDialogs'])

const props = defineProps({
  visible: Boolean,
  card: Object,
  createdByUser: Object,
  updatedByUser: Object
})
const state = reactive({
  dialogHeight: null,
  isLoading: false,
  unknownServerError: false
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
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
  const value = !userStore.filterShowAbsoluteDates
  userStore.updateUser({ filterShowAbsoluteDates: value })
}

// user

const createdByUserIsNotEmpty = computed(() => utils.objectHasKeys(props.createdByUser))
const isUpdatedByDifferentUser = computed(() => props.createdByUser.id !== props.updatedByUser.id)

// history

const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)
const updateCardHistory = async () => {
  state.unknownServerError = false
  if (!currentUserIsSignedIn.value) { return }
  try {
    state.isLoading = true
    const data = await apiStore.getCardHistory(props.card)
    console.log(data)
    // state.history = []
  } catch (error) {
    console.error('🚒 updateCardHistory', error, props.card.id)
    state.unknownServerError = true
  }
  state.isLoading = false
}

</script>

<template lang="pug">
dialog.narrow.card-history(v-if="props.visible" :open="props.visible" @click.left.stop= ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section.title-section
    .row.title-row
      div
        span Card History
        Loader(:visible="state.isLoading" :isSmall="true")

  section.summary
    //- date
    .row
      .badge.status.button-badge.time-badge(@click.left.prevent.stop="toggleFilterShowAbsoluteDates" @touchend.prevent.stop="toggleFilterShowAbsoluteDates" title="Date Updated At")
        img.icon.time(src="@/assets/time.svg")
        span.name {{dateUpdatedAt}}

      .users(@click.left.stop)
        //- created through api
        .badge.status.system-badge(v-if="props.card.isCreatedThroughPublicApi" title="Created via public API")
          img.icon.system(src="@/assets/system.svg")
        //- created by
        template(v-if="createdByUserIsNotEmpty")
          UserLabelInline(:user="createdByUser" :title="'Created by'" :truncateNameToLength="15")
        //- updated by
        template(v-if="isUpdatedByDifferentUser")
          UserLabelInline(:user="updatedByUser" :title="'Updated by'" :truncateNameToLength="15")

  section.history
    .row
      .badge.info While card history is in Beta, it is mainly for debug purposes
    .row(v-if="!currentUserIsSignedIn")
      .badge.info Sign in to access card history
    .row(v-if="state.unknownServerError")
      .badge.error-badge.danger (シ_ _)シ Something went wrong, Please try again or contact support
    OfflineBadge

</template>

<style lang="stylus">
dialog.card-history
  left initial
  right 8px
  top 20px
  .row
    flex-wrap wrap
    row-gap 10px
  .time-badge
    width fit-content
  .system-badge
    margin-top 1px
  .users
    display flex
    flex-wrap wrap
  .name
    color var(--primary)
  section.history
    .row
      > .badge
        margin-right 0
</style>
