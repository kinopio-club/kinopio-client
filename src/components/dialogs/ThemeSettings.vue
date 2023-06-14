<template lang="pug">
dialog.narrow.theme-and-colors-settings(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialog")
  section
    p Theme
    .button-wrap
      label(:class="{active: themeIsSystem}" @click.left.prevent="toggleThemeIsSystem" @keydown.stop.enter="toggleThemeIsSystem")
        input(type="checkbox" v-model="themeIsSystem")
        span Use System Theme
  section
    .row
      p Set current background as the default for new spaces
    .row
      .button-wrap
        .segmented-buttons
          button(:class="{active: currentBackgroundIsDefault}" @click.left.stop="updateBackground")
            template(v-if="userHasDefaults")
              BackgroundPreview(:space="spaceDefaults")
            span Set Background
          button(@click.left.stop="removeBackground")
            img.icon.cancel(src="@/assets/add.svg")

</template>

<script>
import BackgroundPreview from '@/components/BackgroundPreview.vue'
import utils from '@/utils.js'

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
    currentBackgroundIsDefault () {
      const backgroundIsDefault = this.defaultSpaceBackground === this.currentSpace.background
      const backgroundTintIsDefault = this.currentUser.defaultSpaceBackgroundTint === this.currentSpace.backgroundTint
      return backgroundIsDefault && backgroundTintIsDefault
    },
    themeIsSystem () { return this.$store.state.currentUser.themeIsSystem }
  },
  methods: {
    toggleThemeIsSystem () {
      this.$store.dispatch('themes/toggleIsSystem')
    },
    updateBackground () {
      const background = this.currentSpace.background
      const backgroundTint = this.currentSpace.backgroundTint
      this.$store.dispatch('currentUser/update', { defaultSpaceBackground: background, defaultSpaceBackgroundTint: backgroundTint })
    },
    removeBackground () {
      this.$store.dispatch('currentUser/update', { defaultSpaceBackground: null, defaultSpaceBackgroundTint: null })
    },
    updateTheme (themeName) {
      this.$store.dispatch('themes/update', themeName)
    }
  }
}
</script>

<style lang="stylus">
dialog.theme-and-colors-settings
  .background-preview
    margin-right 6px
</style>
