<template lang="pug">
dialog.narrow.mobile-tips(v-if="visible" :open="visible" @click.stop="closeDialogs" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p Mobile Tips
      //- Apps
      .button-wrap(v-if="isNotApp" @mouseup.stop @touchend.stop)
        button.small-button(@click.left.stop="toggleAppsIsVisible" :class="{active: appsIsVisible}")
          img.icon(src="@/assets/apple.svg")
          span Get Apps
        Apps(:visible="appsIsVisible")

    .button-wrap(@click.left.prevent="shouldHideMobileTips" @keydown.stop.enter="shouldHideMobileTips")
      button
        img.icon.cancel(src="@/assets/add.svg")
        span Hide This

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
      span Press and hold to paint select cards
    video(autoplay loop muted playsinline src="https://kinopio-updates.us-east-1.linodeobjects.com/mobile-press-hold-paint.mp4" height="83")
    p
      img.icon(src="@/assets/press-and-hold.svg")
      span Drag selected cards
    video(autoplay loop muted playsinline src="https://kinopio-updates.us-east-1.linodeobjects.com/mobile-drag-painted.mp4" height="83")
    p
      img.icon(src="@/assets/undo.svg")
      span Two finger tap to undo, three finger tap to redo
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
        this.$nextTick(() => {
          let element = this.$refs.dialog
          this.dialogHeight = utils.elementHeightFromHeader(element)
        })
      })
    },
    shouldHideMobileTips () {
      this.$store.dispatch('closeAllDialogs', 'MobileTips')
      this.$store.dispatch('currentUser/update', { shouldHideMobileTips: true })
      this.$store.commit('addNotification', { message: 'Tips hidden. Toggle in User → Settings → Controls', type: 'info' })
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
    top 8px !important
  video
    margin-left -1px
    margin-top -1px
    border-radius 3px
  .small-button
    padding 0
    padding-left 6px
    padding-right 6px
    margin-left 6px

</style>
