<template lang="pug">
dialog.narrow.space-filters(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p Space Filters
  section
    .segmented-buttons
      button(@click="showAllSpaces" :class="{active: all}") All
      button(@click="showJournalsOnly" :class="{active: journals}")
        MoonPhase(:moonPhase="moonPhase.name")
        span Journals
      button(@click="showSpacesOnly" :class="{active: spaces}") Spaces

</template>

<script>
import MoonPhase from '@/components/MoonPhase.vue'
import moonphase from '@/moonphase.js'

export default {
  name: 'SpaceFilters',
  components: {
    MoonPhase
  },
  props: {
    visible: Boolean
  },
  mounted () {
    this.moonPhase = moonphase()
  },
  data () {
    return {
      moonPhase: {}
    }
  },
  computed: {
    dialogSpaceFilters () { return this.$store.state.currentUser.dialogSpaceFilters },
    all () {
      return Boolean(!this.dialogSpaceFilters)
    },
    journals () {
      return this.dialogSpaceFilters === 'journals'
    },
    spaces () {
      return this.dialogSpaceFilters === 'spaces'
    }
  },
  methods: {
    showJournalsOnly () {
      this.updateFilter('journals')
    },
    showSpacesOnly () {
      this.updateFilter('spaces')
    },
    showAllSpaces () {
      this.updateFilter(null)
    },
    updateFilter (value) {
      this.$store.dispatch('currentUser/update', { dialogSpaceFilters: value })
    }
  }
}
</script>

<style lang="stylus">
.space-filters
  @media(max-width 490px)
    left -40px
  @media(max-width 430px)
    left -70px
  @media(max-width 370px)
    left -110px
</style>
