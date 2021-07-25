<template lang="pug">
dialog.live(v-if="visible" :open="visible" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
      p
        //- img.icon.sunglasses(src="@/assets/sunglasses.svg")
        span ablkjsadlkjfsadf
  section.results-section(ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    SpaceList(:spaces="spaces" :showUser="true" :hideExploreBadge="true" @selectSpace="changeSpace")

  //- Community(:visible="!templatesIsVisible" :loading="loading" :spaces="spaces" @updateCurrentSpace="updateCurrentSpace")
  //- Templates(:visible="templatesIsVisible")
</template>

<script>
import utils from '@/utils.js'
import SpaceList from '@/components/SpaceList.vue'

export default {
  name: 'Live',
  components: {
    SpaceList
  },
  props: {
    visible: Boolean,
    spaces: Array
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
  methods: {
    changeSpace (space) {
      this.$store.dispatch('currentSpace/changeSpace', { space, isRemote: true })
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeightFromHeader(element)
      })
    },
    updateResultsSectionHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.results
        this.resultsSectionHeight = utils.elementHeightFromHeader(element, true)
      })
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateDialogHeight()
        this.updateResultsSectionHeight()
      }
    }
  }
}
</script>

<style lang="stylus">
.live
  max-height calc(100vh - 100px)
// .header
//   border-bottom 1px solid var(--primary)
//   border-bottom-left-radius 0
//   border-bottom-right-radius 0
</style>
