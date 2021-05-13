<template lang="pug">
dialog.narrow.mobile-tips(v-if="visible" :open="visible" @click.stop="closeDialogs" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p Mobile Tips
  section(
    @mouseup.stop
    @touchend.stop
  )
    p
      img.icon(src="@/assets/press-and-hold.svg")
      span Press and hold to drag cards
    video(autoplay loop muted playsinline src="https://kinopio-updates.us-east-1.linodeobjects.com/mobile-press-hold-drag.mp4" height="83")

    p
      img.icon(src="@/assets/press-and-hold.svg")
      span Press and hold to paint cards
    video(autoplay loop muted playsinline src="https://kinopio-updates.us-east-1.linodeobjects.com/mobile-press-hold-paint.mp4" height="83")

  section(
    v-if="isNotApp"
    @mouseup.stop
    @touchend.stop
  )
    .button-wrap
      button(@click.left.stop="toggleAppsIsVisible" :class="{active: appsIsVisible}")
        img.icon(src="@/assets/apple.svg")
        span Get Mobile Apps
      Apps(:visible="appsIsVisible")
</template>

<script>
import utils from '@/utils.js'
import Apps from '@/components/dialogs/Apps.vue'

export default {
  name: 'MobileTips',
  components: {
    Apps
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      appsIsVisible: false,
      dialogHeight: null
    }
  },
  computed: {
    isNotApp () {
      return !navigator.standalone
    },
    isIPhone () {
      return utils.isIPhone()
    }
  },
  methods: {
    toggleAppsIsVisible () {
      const value = !this.appsIsVisible
      this.closeDialogs()
      this.appsIsVisible = value
    },
    closeDialogs () {
      this.appsIsVisible = false
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.closeDialogs()
        this.updateDialogHeight()
      }
    }
  }
}
</script>

<style lang="stylus">
.mobile-tips
  @media(max-width 435px)
    left -100px
  &.narrow
    width 215px
  .apps
    top initial
    bottom 8px
  video
    margin-left -1px
    margin-top -1px
    border-radius 3px

</style>
