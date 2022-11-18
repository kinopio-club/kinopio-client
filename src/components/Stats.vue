<template lang="pug">

section.stats(v-if="visible" @click.stop="clear")
  p Stats for {{currentSpace.name}}
  //- TODO current space doesn't update, switch to watcher?, or prop, or Forceupdates w this.$forceUpdate() on visible?
  //- TODO Loader :visible space is loading

  //- TODO if not loading
  table
    tbody
      tr.table-header
        td Cards
        td Connections
        td Boxes
        td Tags
      tr
        td {{currentSpace.cards.length}}
        td {{currentSpace.connections.length}}
        td {{currentSpace.boxes.length}}
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
        td 12

</template>

<script>
import utils from '@/utils.js'

import dayjs from 'dayjs'

export default {
  name: 'Stats',
  components: {
  },
  props: {
    visible: Boolean
  },
  // data () {
  //   return {
  //     displayDateIsRelative: true
  //   }
  // },
  computed: {
    currentSpace () {
      // console.log(this.$store.state.currentSpace)
      return this.$store.state.currentSpace
    },
    showAbsoluteDate () { return this.$store.state.currentUser.filterShowAbsoluteDates },
    tags () { return this.$store.getters['currentSpace/spaceTags'] }

    // pluralizedBoxes () {
    //   const count = this.currentSpace.boxes.length
    //   if (count === 1) { return 'box' }
    //   return 'boxes'
    // }
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

    // pluralize (word, count) {
    //   let condition
    //   if (count > 1) {
    //     condition = true
    //   }
    //   return utils.pluralize(word, condition)
    // }
  },
  watch: {
    visible (visible) {
      if (visible) {
        console.log('💖')
      }
    }
  }
}
</script>

<style lang="stylus">
.stats
  table
    margin-top 10px
    border-collapse collapse
    td
      border 1px solid var(--secondary-active-background)
      padding 5px
      user-select text

  // .table-header
  //   td
  //     padding-right 5px
//   article
//     position static
//     margin-bottom 10px
//     padding-bottom 10px
//     border-bottom 1px solid var(--primary)
//     &:last-child
//       margin-bottom 0
//       padding-bottom 0
//       border-bottom 0

</style>
