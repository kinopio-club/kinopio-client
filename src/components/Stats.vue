<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

import dayjs from 'dayjs'

const store = useStore()

const props = defineProps({
  visible: Boolean
})

const currentSpace = computed(() => store.state.currentSpace)
const isLoadingSpace = computed(() => store.state.isLoadingSpace)

// visits

const visits = computed(() => store.state.currentSpace.visits + 1)

// dates

const showAbsoluteDate = computed(() => store.state.currentUser.filterShowAbsoluteDates)
const date = (date) => {
  if (showAbsoluteDate.value) {
    return dayjs(date).format('YYYY-MM-DD')
  } else {
    date = utils.shortRelativeTime(date)
    if (date === 'now') {
      return date
    } else {
      return date + ' ago'
    }
  }
}
const toggleFilterShowAbsoluteDates = () => {
  const value = !store.state.currentUser.filterShowAbsoluteDates
  store.dispatch('currentUser/toggleFilterShowAbsoluteDates', value)
}

// items

const tags = computed(() => store.getters['currentSpace/spaceTags'])
const cards = computed(() => store.getters['currentCards/all'])
const connections = computed(() => store.getters['currentConnections/all'])
const boxes = computed(() => store.getters['currentBoxes/all'])

// word count

const wordCount = computed(() => {
  let words = ''
  cards.value.forEach(card => {
    words = words + ' ' + card.name
  })
  const wordCount = words.split(' ').length
  return wordCount
})
</script>

<template lang="pug">
section.stats(v-if="visible")
  p Stats for {{currentSpace.name}}
  p(v-if="isLoadingSpace")
    Loader(:visible="true")
  template(v-if="!isLoadingSpace")
    table
      tbody
        tr.table-header
          td Visits
        tr
          td {{visits}}
    table
      tbody
        tr.table-header
          td Cards
          td Lines
          td Boxes
          td Tags
        tr
          td {{cards.length}}
          td {{connections.length}}
          td {{boxes.length}}
          td {{tags.length}}
    table
      tbody
        tr.table-header
          td Created
          td(v-if="currentSpace.editedAt")
            span Last Edited
        tr
          td
            .badge.button-badge.secondary(@click.stop="toggleFilterShowAbsoluteDates")
              span {{date(currentSpace.createdAt)}}
          td(v-if="currentSpace.editedAt")
            .badge.button-badge.secondary(@click.stop="toggleFilterShowAbsoluteDates")
              span {{date(currentSpace.editedAt)}}
    table
      tbody
        tr.table-header
          td Word Count
        tr
          td {{wordCount}}
</template>

<style lang="stylus">
// .stats
//   overflow auto
//   table
//     margin-top 10px
//     border-collapse collapse
//     td
//       border 1px solid var(--secondary-active-background)
//       padding 5px
//       user-select text
</style>
