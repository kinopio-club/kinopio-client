<template lang="pug">
dialog.links.narrow(v-if="visible" :open="visible" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p Links
</template>

<script>
// import ResultsFilter from '@/components/ResultsFilter.vue'
import utils from '@/utils.js'

// import uniq from 'lodash-es/uniq'

export default {
  name: 'Links',
  components: {
    // User: () => import('@/components/User.vue'),
    // ResultsFilter
  },
  props: {
    visible: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
        // this.updateResultsSectionHeight()
      }
    })
  },
  data () {
    return {
      // filter: '',
      // filteredItems: [],
      // resultsSectionHeight: null,
      dialogHeight: null
    }
  },
  computed: {
    currentUser () { return this.$store.state.currentUser }
  },
  methods: {
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeightFromHeader(element)
      })
    }
    // updateResultsSectionHeight () {
    //   if (!this.visible) { return }
    //   this.$nextTick(() => {
    //     let element = this.$refs.results
    //     this.resultsSectionHeight = utils.elementHeightFromHeader(element, true)
    //   })
    // },
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateDialogHeight()
        // this.updateResultsSectionHeight()
      }
    }
  }
}
</script>

<style lang="stylus">
.links
  @media(max-width 435px)
    left -100px
</style>
