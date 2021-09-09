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
    visible: Boolean,
    currentSpaceFilter: String
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
    all () {
      return Boolean(!this.currentSpaceFilter)
    },
    journals () {
      return this.currentSpaceFilter === 'journals'
    },
    spaces () {
      return this.currentSpaceFilter === 'spaces'
    }
  },
  methods: {
    showJournalsOnly () {
      this.$emit('updateSpaceFilter', 'journals')
    },
    showSpacesOnly () {
      this.$emit('updateSpaceFilter', 'spaces')
    },
    showAllSpaces () {
      this.$emit('updateSpaceFilter', null)
    }
  }
}
</script>

<style lang="stylus" scoped>
</style>
