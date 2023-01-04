<template lang="pug">
dialog.narrow.theme-and-colors-settings(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialog")
  section
    p Theme Colors
    .segmented-buttons
      ThemeToggle

  section
    .row
      p Color to use as the default for new cards
    .row
      .button-wrap
        .segmented-buttons
          button(@click.left.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
            .icon.current-color(:style="{ 'background-color': defaultCardColor }")
            span Card Color
          button(@click.left.stop="removeDefaultCardColor")
            img.icon.cancel(src="@/assets/add.svg")
        ColorPicker(:currentColor="defaultCardColor" :visible="colorPickerIsVisible" @selectedColor="updateDefaultCardColor")

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
import ThemeToggle from '@/components/ThemeToggle.vue'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import utils from '@/utils.js'

export default {
  name: 'ColorsAndThemeSettings',
  components: {
    BackgroundPreview,
    ColorPicker,
    ThemeToggle
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      colorPickerIsVisible: false
    }
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
    defaultCardColor () {
      const color = utils.cssVariable('secondary-background')
      const userDefault = this.currentUser.defaultCardBackgroundColor
      return userDefault || color
    }
  },
  methods: {
    closeDialogs () {
      this.colorPickerIsVisible = false
    },
    updateBackground () {
      const background = this.currentSpace.background
      const backgroundTint = this.currentSpace.backgroundTint
      this.$store.dispatch('currentUser/update', { defaultSpaceBackground: background, defaultSpaceBackgroundTint: backgroundTint })
      this.closeDialogs()
    },
    removeBackground () {
      this.$store.dispatch('currentUser/update', { defaultSpaceBackground: null, defaultSpaceBackgroundTint: null })
      this.closeDialogs()
    },
    updateDefaultCardColor (color) {
      this.$store.dispatch('currentUser/update', { defaultCardBackgroundColor: color })
    },
    removeDefaultCardColor () {
      this.updateDefaultCardColor(null)
      this.closeDialogs()
    },
    toggleColorPicker () {
      const value = !this.colorPickerIsVisible
      this.closeDialogs()
      this.colorPickerIsVisible = value
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
  .current-color
    height 14px
    width 14px
    margin-bottom 1px
    border-radius 3px
    display inline-block
    vertical-align -3px
</style>
