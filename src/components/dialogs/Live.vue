<template lang="pug">
dialog.live(v-if="visible" :open="visible" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p
      img.icon.camera(src="@/assets/camera.svg")
      span Live Public Spaces
      Loader(:visible="loading")
  section.results-section(v-if="spaces.length" ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    SpaceList(
      :spaces="spaces"
      :showOtherUsers="true"
      :hideExploreBadge="true"
      @selectSpace="changeSpace"
      :resultsSectionHeight="resultsSectionHeight"
      :parentDialog="parentDialog"
      :previewImageIsWide="true"
      :hideFilter="true"
    )
  section.empty(v-if="!spaces.length")
    p No public spaces are currently being edited, check back soon
    img.placeholder(src="@/assets/cat-book.jpg")
</template>

<script>
import SpaceList from '@/components/SpaceList.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

export default {
  name: 'Live',
  components: {
    SpaceList,
    Loader
  },
  props: {
    visible: Boolean,
    spaces: Array,
    loading: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
        this.updateResultsSectionHeight()
      }
    })
  },
  data () {
    return {
      dialogHeight: null,
      resultsSectionHeight: null
    }
  },
  computed: {
    parentDialog () { return 'live' }
  },
  methods: {
    changeSpace (space) {
      this.$store.dispatch('currentSpace/changeSpace', space)
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    },
    updateResultsSectionHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.results
        this.resultsSectionHeight = utils.elementHeight(element, true)
      })
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateDialogHeight()
        this.updateResultsSectionHeight()
        this.$store.commit('shouldExplicitlyHideFooter', true)
      } else {
        this.$store.commit('shouldExplicitlyHideFooter', false)
      }
    }
  }
}
</script>

<style lang="stylus">
.live
  left initial
  right 8px
  max-height calc(100vh - 100px)
  .camera
    vertical-align baseline
  section.empty
    border-top 0
    padding-top 4px
  .placeholder
    border-radius var(--small-entity-radius)
    margin-top 10px
  .loader
    height 14px
    width 14px
    vertical-align -3px
    margin-left 3px
  .space-list
    .users
      max-width 56px
      flex-wrap wrap
      justify-content flex-start
    &.multiple-users
      width 100%

</style>
