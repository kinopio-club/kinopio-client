<template lang="pug">
dialog.narrow.stats(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p Stats for {{currentSpace.name}}
  section
    //- TODO current space doesn't update, switch to watcher?, or prop, or Forceupdates w this.$forceUpdate() on visible?
    //- Loader :visible space is loading
    //- if not loading
    table
      tbody
        tr.table-header
          td Cards
          td Connections
          td Boxes
        tr
          td {{currentSpace.cards.length}}
          td {{currentSpace.connections.length}}
          td {{currentSpace.boxes.length}}

    // created
    p
      img.icon.time(src="@/assets/time.svg")
      span Created
    .row
      .badge.button-badge.secondary(@click.stop="toggleFilterShowAbsoluteDates")
        span {{date(currentSpace.createdAt)}}

    // last edited
    template(v-if="currentSpace.editedAt")
      p
        img.icon.time(src="@/assets/time.svg")
        span Last Edited
      .row
        .badge.button-badge.secondary(@click.stop="toggleFilterShowAbsoluteDates")
          span {{date(currentSpace.editedAt)}}

</template>

<script>
import utils from '@/utils.js'

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
      console.log(this.$store.state.currentSpace)
      return this.$store.state.currentSpace
    },
    showAbsoluteDate () { return this.$store.state.currentUser.filterShowAbsoluteDates }
    // pluralizedBoxes () {
    //   const count = this.currentSpace.boxes.length
    //   if (count === 1) { return 'box' }
    //   return 'boxes'
    // }
  },
  methods: {
    date (date) {
      if (this.showAbsoluteDate) {
        return new Date(date).toLocaleString()
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
  }
}
</script>

<style lang="stylus">
.stats
  table
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
