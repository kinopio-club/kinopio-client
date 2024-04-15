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

<script>
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

import dayjs from 'dayjs'

export default {
  name: 'Stats',
  components: {
    Loader
  },
  props: {
    visible: Boolean
  },
  computed: {
    currentSpace () { return this.$store.state.currentSpace },
    showAbsoluteDate () { return this.$store.state.currentUser.filterShowAbsoluteDates },
    tags () { return this.$store.getters['currentSpace/spaceTags'] },
    cards () { return this.$store.getters['currentCards/all'] },
    connections () { return this.$store.getters['currentConnections/all'] },
    boxes () { return this.$store.getters['currentBoxes/all'] },
    visits () { return this.$store.state.currentSpace.visits + 1 },
    wordCount () {
      let words = ''
      this.cards.forEach(card => {
        words = words + ' ' + card.name
      })
      const wordCount = words.split(' ').length
      return wordCount
    },
    isLoadingSpace () { return this.$store.state.isLoadingSpace }
  },
  methods: {
    date (date) {
      if (this.showAbsoluteDate) {
        return dayjs(date).format('YYYY-MM-DD')
      } else {
        date = utils.shortRelativeTime(date)
        if (date === 'now') {
          return date
        } else {
          return date + ' ago'
        }
      }
    },
    toggleFilterShowAbsoluteDates () {
      const value = !this.$store.state.currentUser.filterShowAbsoluteDates
      this.$store.dispatch('currentUser/toggleFilterShowAbsoluteDates', value)
    }
  }
}
</script>

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
