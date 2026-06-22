<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
// import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
// import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'
import timezones from '@/data/timezones.json'

import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
dayjs.extend(timezone)

const globalStore = useGlobalStore()
// const cardStore = useCardStore()
const userStore = useUserStore()
// const spaceStore = useSpaceStore()

let unsubscribes

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
  console.log('🫐🫐🫐🫐🫐🫐', timezones)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['updateCount'])

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  dialogHeight: null
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

const userTimezone = computed(() => userStore.timezone)
const absoluteTimeLabel = computed(() => {
  const date = dayjs().add(2, 'day')
  return utils.shortAbsoluteDate(date)
})

const updateDefaultTimezone = (event) => {
  const timezone = dayjs.tz.guess()
  userStore.updateUser({ timezone })
  const position = utils.cursorPositionInPage(event)
  position.x += -40
  globalStore.addNotificationWithPosition({ message: 'Updated', position, type: 'success', layer: 'app', icon: 'checkmark' })
}
const selectTimezone = (timezone) => {
  console.log('🫐', timezone)
}

</script>

<template lang="pug">
dialog.date-and-time-settings(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section.title-section
    p Date and Time Settings
  section
    p Due Date Format
    .segmented-buttons
      button.active
        span {{absoluteTimeLabel}}
      button
        span 2 days left
  section
    .row.title-row
      span Timezone
      button.small-button(@click="updateDefaultTimezone")
        span Auto Detect

    .row
      span.badge.info {{userTimezone}}
  section.timezone-picker.results-section
    ul.results-list.timezone-list
      template(v-for="timezone in timezones" :key="timezone.iana")
        li(@click.left="selectTimezone(timezone)")

          span {{timezone.iana}}
          span.gmt-offset {{timezone.gmtOffset}}
        //- li(:class="{ active: timezoneIsSelected(timezone) }" @click.stop="selecttimezone(timezone)")
          //- timezoneLabel(:timezone="timezone" :showName="true")
          //- timezoneDetails(:visible="timezoneDetailsIsVisible(timezone)" :timezone="timezone")

    //- results list
    //- list use default + timezones
</template>

<style lang="stylus">
dialog.date-and-time-settings
  overflow auto
  section.timezone-picker
    max-height 250px
  li
    display flex
    width 100%
    justify-content space-between
    .gmt-offset
      flex-shrink 0
</style>
