<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
// import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
// import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'
import timezones from '@/data/timezones.json'
import ResultsFilter from '@/components/ResultsFilter.vue'

import createFuzzySearch from '@nozbe/microfuzz'
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
  window.addEventListener('pointermove', moveMapPointer)
  window.addEventListener('pointerup', endMapPointer)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDialogHeight)
  window.removeEventListener('pointermove', moveMapPointer)
  window.removeEventListener('pointerup', endMapPointer)
})

const emit = defineEmits(['updateCount'])

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  dialogHeight: null,
  isMapPointerDown: false,
  filter: '',
  filteredTimezones: []
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

// format

const absoluteTimeLabel = computed(() => {
  const date = dayjs().add(2, 'day')
  return utils.shortAbsoluteDate(date)
})
const userAtMentionDateIsRelative = computed(() => userStore.atMentionDateIsRelative)
const updateAtMentionDateIsRelative = (value) => {
  if (value === userAtMentionDateIsRelative.value) { return }
  userStore.updateUser({ atMentionDateIsRelative: value })
}

// timezones

const userTimezone = computed(() => userStore.timezone)
const updateDefaultTimezone = (event) => {
  const timezone = dayjs.tz.guess()
  userStore.updateUser({ timezone })
  const position = utils.cursorPositionInPage(event)
  position.x += -40
  globalStore.addNotificationWithPosition({ message: 'Updated', position, type: 'success', layer: 'app', icon: 'checkmark' })
}
const timezoneIsSelected = (timezone) => {
  return timezone.name === userTimezone.value
}
const selectTimezoneByGmt = (gmt) => {
  // find the timezone whose offset is closest to the clicked gmt hour
  let closest
  let smallestDelta = Infinity
  timezones.forEach(timezone => {
    const delta = Math.abs(parseGmtOffsetHours(timezone.gmtOffset) - gmt)
    if (delta < smallestDelta) {
      smallestDelta = delta
      closest = timezone
    }
  })
  if (closest) {
    selectTimezone(closest)
  }
}
const selectTimezone = (timezone) => {
  userStore.updateUser({ timezone: timezone.name })
}

// filter

const timezonesFiltered = computed(() => {
  let items
  if (state.filter) {
    items = state.filteredTimezones
  } else {
    items = timezones
  }
  return items
})
const updateFilter = (filter) => {
  state.filter = filter
}
const updateFilteredTimezones = (timezones) => {
  state.filteredTimezones = timezones
}
// aliases of a timezone that fuzzy match the current filter
const matchingAliases = (timezone) => {
  const aliases = timezone.aliases || []
  if (!state.filter || !aliases.length) { return [] }
  const fuzzySearch = createFuzzySearch(aliases)
  return fuzzySearch(state.filter).map(result => result.item)
}

// earth map highlight

// note: the data uses a unicode minus sign (−, U+2212), not an ascii hyphen
const parseGmtOffsetHours = (gmtOffset) => {
  const parsed = (gmtOffset || '').match(/GMT([+\-−])(\d+):(\d+)/)
  if (!parsed) { return 0 }
  const sign = (parsed[1] === '-' || parsed[1] === '−') ? -1 : 1
  const hours = parseInt(parsed[2], 10)
  const minutes = parseInt(parsed[3], 10)
  return sign * (hours + minutes / 60)
}
const userTimezoneOffsetHours = computed(() => {
  const match = timezones.find(timezone => timezone.name === userTimezone.value)
  return parseGmtOffsetHours(match?.gmtOffset || 'GMT+0:00')
})
// map width spans -180°..180° longitude,
// each timezone hour = 15° of longitude
const timezoneHighlightStyles = computed(() => {
  const widthDegrees = 15
  const longitude = userTimezoneOffsetHours.value * 15
  let left = ((180 + longitude - widthDegrees / 2) / 360) * 100
  left = Math.max(0, Math.min(100 - (widthDegrees / 360) * 100, left))
  return {
    left: left + '%',
    width: (widthDegrees / 360) * 100 + '%'
  }
})
// map pointer → nearest timezone offset → select
const mapElement = ref(null)
const updateTimezoneFromPointer = (event) => {
  const rect = mapElement.value.getBoundingClientRect()
  const fraction = (event.clientX - rect.left) / rect.width
  const longitude = fraction * 360 - 180
  const gmt = Math.round(longitude / 15)
  selectTimezoneByGmt(gmt)
}
const startMapPointer = (event) => {
  state.isMapPointerDown = true
  updateTimezoneFromPointer(event)
}
const moveMapPointer = (event) => {
  if (!state.isMapPointerDown) { return }
  updateTimezoneFromPointer(event)
}
const endMapPointer = () => {
  state.isMapPointerDown = false
}
</script>

<template lang="pug">
dialog.date-and-time-settings(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section.title-section
    p Date and Time Settings
  section
    p Date Format
    .segmented-buttons
      button(@click="updateAtMentionDateIsRelative(false)" :class="{active: !userAtMentionDateIsRelative}")
        span {{absoluteTimeLabel}}
      button(@click="updateAtMentionDateIsRelative(true)" :class="{active: userAtMentionDateIsRelative}")
        span 2 days left
  section
    .row.title-row
      span Timezone
      button.small-button(@click="updateDefaultTimezone")
        span Auto Detect
    .row
      .earth-map(ref="mapElement" @pointerdown.left="startMapPointer")
        .timezone-highlight(:style="timezoneHighlightStyles")
        .land
        .badge.info.timezone-label {{userTimezone}}

  section.timezone-picker.results-section
    ResultsFilter(
      :items="timezones"
      :searchByAliases="true"
      @updateFilter="updateFilter"
      @updateFilteredItems="updateFilteredTimezones"
      placeholder="Search by City"
    )
    ul.results-list.timezone-list
      template(v-for="timezone in timezonesFiltered" :key="timezone.name")
        li(@click.left="selectTimezone(timezone)" :class="{ active: timezoneIsSelected(timezone) }")
          span {{timezone.name}}
            template(v-if="matchingAliases(timezone).length")
              template(v-for="alias in matchingAliases(timezone)" :key="alias")
                br
                span.badge.search {{alias}}
          span.gmt-offset {{timezone.gmtOffset}}
</template>

<style lang="stylus">
dialog.date-and-time-settings
  overflow auto
  section.timezone-picker
    max-height 250px
  .earth-map
    position relative
    width 100%
    aspect-ratio 2.15
    border-radius var(--entity-radius)
    overflow hidden
    cursor pointer
    .timezone-label
      position absolute
      left 4px
      top 4px
      z-index 2
    .land
      position absolute
      top 0
      left 0
      width 100%
      height 100%
      background-image url('../../assets/world-map.png')
      background-repeat no-repeat
      background-position center
      background-size contain
      pointer-events none
    .timezone-highlight
      position absolute
      top 0
      height 100%
      background rgba(255,255,255,0.4)
      pointer-events none
      z-index 1
  li
    display flex
    width 100%
    justify-content space-between
    .gmt-offset
      flex-shrink 0
</style>
