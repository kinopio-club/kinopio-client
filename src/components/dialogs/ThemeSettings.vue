<template lang="pug">
dialog.narrow.theme-and-colors-settings(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialog")
  section
    p Theme
    .button-wrap
      label(:class="{active: themeIsSystem}" @click.left.prevent="toggleThemeIsSystem" @keydown.stop.enter="toggleThemeIsSystem")
        input(type="checkbox" v-model="themeIsSystem")
        span Use System Theme

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
    themeIsSystem () { return this.$store.state.currentUser.themeIsSystem }
  },
  methods: {
    toggleThemeIsSystem () {
      this.$store.dispatch('themes/toggleIsSystem')
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
