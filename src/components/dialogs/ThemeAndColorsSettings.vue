<template lang="pug">
dialog.narrow.theme-and-colors-settings(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialog")
  section
    p Theme
    .button-wrap
      label(:class="{active: themeIsSystem}" @click.left.prevent="toggleThemeIsSystem" @keydown.stop.enter="toggleThemeIsSystem")
        input(type="checkbox" v-model="themeIsSystem")
        span Use System Theme
  //- card color
  section
    .row
      p Color to use as the default for new cards
    .row
      .button-wrap
        .segmented-buttons
          button(@click.left.stop="toggleColorPicker" :class="{active: colorPickerIsVisible || userHasDefaultCardColor}")
            .current-color(:style="{ 'background-color': defaultCardColor }")
            span New Card Color
          button(@click.left.stop="removeDefaultCardColor")
            img.icon.cancel(src="@/assets/add.svg")
        ColorPicker(:currentColor="defaultCardColor" :visible="colorPickerIsVisible" @selectedColor="updateDefaultCardColor")
  //- space background
  section
    .row
      p Set current background as the default for new spaces
    .row
      .button-wrap
        .segmented-buttons
          button(:class="{active: userHasDefaultBackground}" @click.left.stop="updateBackground")
            template(v-if="userHasDefaultBackground")
              BackgroundPreview(:space="spaceDefaults")
            span Set Background
          button(@click.left.stop="removeBackground")
            img.icon.cancel(src="@/assets/add.svg")

</template>

<script>
import BackgroundPreview from '@/components/BackgroundPreview.vue'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import utils from '@/utils.js'

export default {
  name: 'ColorsAndThemeSettings',
  components: {
    BackgroundPreview,
    ColorPicker
  },
  props: {
    visible: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      const { type, payload } = mutation
      if (type === 'triggerUpdateTheme') {
        this.defaultColor = utils.cssVariable('secondary-background')
      }
    })
  },
  mounted () {
    this.defaultColor = utils.cssVariable('secondary-background')
  },
  data () {
    return {
      colorPickerIsVisible: false,
      defaultColor: '#e3e3e3'
    }
  },
  computed: {
    currentUser () { return this.$store.state.currentUser },
    currentSpace () { return this.$store.state.currentSpace },
    defaultSpaceBackground () { return this.currentUser.defaultSpaceBackground },
    defaultSpaceBackgroundTint () { return this.currentUser.defaultSpaceBackgroundTint },
    defaultSpaceBackgroundGradient () { return this.currentUser.defaultSpaceBackgroundGradient },
    spaceDefaults () {
      const backgroundIsGradient = Boolean(this.defaultSpaceBackgroundGradient)
      return {
        background: this.defaultSpaceBackground,
        backgroundTint: this.defaultSpaceBackgroundTint,
        backgroundGradient: this.defaultSpaceBackgroundGradient,
        backgroundIsGradient
      }
    },
    userHasDefaultBackground () {
      return Boolean(this.defaultSpaceBackground || this.defaultSpaceBackgroundTint || this.defaultSpaceBackgroundGradient)
    },
    defaultCardColor () {
      const userDefault = this.currentUser.defaultCardBackgroundColor
      return userDefault || this.defaultColor
    },
    themeIsSystem () { return this.$store.state.currentUser.themeIsSystem },
    userHasDefaultCardColor () {
      const systemDefaultColor = utils.cssVariable('secondary-background')
      const userDefaultColor = this.currentUser.defaultCardBackgroundColor
      const defaultColorIsNotSystem = userDefaultColor !== systemDefaultColor
      return userDefaultColor && defaultColorIsNotSystem
    }
  },
  methods: {
    toggleThemeIsSystem () {
      this.$store.dispatch('themes/toggleIsSystem')
    },
    closeDialogs () {
      this.colorPickerIsVisible = false
    },
    updateBackground () {
      let updates
      if (this.currentSpace.backgroundIsGradient) {
        updates = {
          defaultSpaceBackgroundGradient: this.currentSpace.backgroundGradient,
          defaultSpaceBackground: null
        }
      } else {
        updates = {
          defaultSpaceBackgroundGradient: null,
          defaultSpaceBackground: this.currentSpace.backgroundGradient
        }
      }
      updates.defaultSpaceBackgroundTint = this.currentSpace.backgroundTint
      this.$store.dispatch('currentUser/update', updates)
      this.closeDialogs()
    },
    removeBackground () {
      this.$store.dispatch('currentUser/update', { defaultSpaceBackground: null, defaultSpaceBackgroundTint: null, defaultSpaceBackgroundGradient: null })
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
    border-radius var(--small-entity-radius)
    display inline-block
    vertical-align -3px
    margin-right 5px
  .preview-wrap
    height 16px
    width 16px
    border-radius var(--small-entity-radius)
</style>
