<template lang="pug">
dialog.narrow.theme-and-colors-settings(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p Theme and Colors
  section
    .row
      p Colors
    .row
      button
        img.icon.cancel(src="@/assets/add.svg")
        span Clear All
    .row
      label(:class="{active: currentIsUserDefaults}" @click.left.prevent="updateUserDefaults" @keydown.stop.enter="updateUserDefaults")
        input(type="checkbox" v-model="currentIsUserDefaults")
        template(v-if="userHasDefaults")
          BackgroundPreview(:space="spaceDefaults")
        span Default Background

    p [default card color]

</template>

<script>
import BackgroundPreview from '@/components/BackgroundPreview.vue'

export default {
  name: 'ColorsAndThemeSettings',
  components: {
    BackgroundPreview
  },
  props: {
    visible: Boolean
  },
  computed: {
    currentUser () { return this.$store.state.currentUser },
    currentSpace () { return this.$store.state.currentSpace },
    defaultSpaceBackground () { return this.currentUser.defaultSpaceBackground },
    defaultSpaceBackgroundTint () { return this.currentUser.defaultSpaceBackgroundTint },
    spaceDefaults () {
      return {
        background: this.defaultSpaceBackground,
        backgroundTint: this.defaultSpaceBackgroundTint
      }
    },

    userHasDefaults () {
      return Boolean(this.defaultSpaceBackground || this.defaultSpaceBackgroundTint)
    },
    currentIsUserDefaults () {
      const backgroundIsDefault = this.defaultSpaceBackground === this.currentSpace.background
      const backgroundTintIsDefault = this.currentUser.defaultSpaceBackgroundTint === this.currentSpace.backgroundTint
      return backgroundIsDefault && backgroundTintIsDefault
    }

  },
  methods: {
    updateUserDefaults () {
      const background = this.currentSpace.background
      const backgroundTint = this.currentSpace.backgroundTint
      const isUnchanged = background === this.defaultSpaceBackground && backgroundTint === this.defaultSpaceBackgroundTint
      if (isUnchanged) {
        this.removeUserDefaults()
        return
      }
      this.$store.dispatch('currentUser/update', { defaultSpaceBackground: background, defaultSpaceBackgroundTint: backgroundTint })
      this.success.userDefaultsIsUpdated = true
    },
    removeUserDefaults () {
      this.$store.dispatch('currentUser/update', { defaultSpaceBackground: null, defaultSpaceBackgroundTint: null })
      this.clearSuccesses()
    }

  }
}
</script>

<style lang="stylus">
dialog.theme-and-colors-settings
  .background-preview
    margin-right 6px
</style>
