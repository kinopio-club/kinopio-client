<template lang="pug">
dialog.narrow.theme-and-colors-settings(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p Theme and Colors
    //- section
    //-   .row
    //-     p Theme | blah

  section
    .row
      p Color to use as the default for new cards
    .row
      .button-wrap
        .segmented-buttons
          button
            //- toggles color picker
            .icon.current-color(:style="{ 'background-color': defaultCardColor }")
            span Card Color
          button
            img.icon.cancel(src="@/assets/add.svg")

  section
    .row
      p Set current background as the default for new spaces
    .row
      //- label(:class="{active: currentBackgroundIsDefault}" @click.left.prevent="updateBackground" @keydown.stop.enter="updateBackground")
      //-   input(type="checkbox" v-model="currentBackgroundIsDefault")
      //-   template(v-if="userHasDefaults")
      //-     BackgroundPreview(:space="spaceDefaults")
      //-   span Default Background
      .button-wrap
        .segmented-buttons
          button
            //- sets background, doesn't remove it, active if current
            template(v-if="userHasDefaults")
              BackgroundPreview(:space="spaceDefaults")
            span Set Background
          button
            //- @click removeBackground
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
    defaultCardColor () {
      const color = utils.cssVariable('secondary-background')
      const userDefault = this.currentUser.defaultCardBackgroundColor
      return userDefault || color
    }
  },
  methods: {
    updateBackground () {
      const background = this.currentSpace.background
      const backgroundTint = this.currentSpace.backgroundTint
      this.$store.dispatch('currentUser/update', { defaultSpaceBackground: background, defaultSpaceBackgroundTint: backgroundTint })
    },
    removeBackground () {
      this.$store.dispatch('currentUser/update', { defaultSpaceBackground: null, defaultSpaceBackgroundTint: null })
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
