<template lang="pug">
dialog.narrow.spaces-meta-options(v-if="visible" :open="visible" ref="dialog" :class="{'right-side': showOnRightSide}")
  section
    .row
      .segmented-buttons
        button.active Tags
        button Links

      .button-wrap
        button
          img.icon(src="@/assets/remove.svg")
          span Removed

    //- Removed

    //- .button-wrap
    //-   button(@click.left="toggleRemovedIsVisible" :class="{ active: removedIsVisible}")
    //-     img.refresh.icon(src="@/assets/remove.svg")
    //-     span Removed
    //-   Removed(:visible="removedIsVisible")
    //- //- Tags and Links
    //- .button-wrap
    //-   .segmented-buttons
    //-     button(@click.left="toggleTagsIsVisible" :class="{ active: tagsIsVisible}")
    //-       span Tags
    //-     button(@click.left="toggleLinksIsVisible" :class="{ active: linksIsVisible}")
    //-       span Links
    //-   Links(:visible="linksIsVisible")
    //-   Tags(:visible="tagsIsVisible")

</template>

<script>
// import cache from '@/cache.js'
import utils from '@/utils.js'

export default {
  name: 'SpacesMetaOptions',
  props: {
    visible: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.checkIfShouldBeOnRightSide()
      }
    })
  },
  data () {
    return {
      showOnRightSide: false
    }
  },
  computed: {
    // currentUserIsSignedIn () {
    //   return Boolean(this.$store.getters['currentUser/isSignedIn'])
    // }
  },
  methods: {
    checkIfShouldBeOnRightSide () {
      this.showOnRightSide = false
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.showOnRightSide = utils.elementShouldBeOnRightSide(element)
      })
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        // this.queue = cache.queue()
        this.checkIfShouldBeOnRightSide()
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
.offline
  &.right-side
    left initial
    right 8px
</style>
