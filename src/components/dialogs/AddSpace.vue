<template lang="pug">
dialog.narrow(v-if="visible" :open="visible" @click.left="closeDialogs")
  section
    button
      span New Space
    button
      span 🌒 Daily Journal
</template>

<script>
import moonphase from '@/moonphase.js'

export default {
  name: 'AddSpace',
  props: {
    visible: Boolean
  },
  mounted () {
    this.moonPhase = moonphase()
    console.log('🌙', this.moonPhase)
  },
  data () {
    return {
      moonPhase: {}
    }
  },
  // computed: {
  //   currentSpace () { return this.$store.state.currentSpace },
  // },
  methods: {
    addSpace () {
      window.scrollTo(0, 0)
      this.$store.dispatch('currentSpace/addSpace')
      this.$emit('updateSpaces')
    }
  }
}
</script>

<style lang="stylus">
</style>
