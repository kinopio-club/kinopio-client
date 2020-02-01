<template lang="pug">
dialog.narrow.privacy-picker(v-if="visible" :open="visible" @click.stop)
  section.results-section
    ul.results-list
      li hello
      //- template(v-for="(space in spaces")
      //-   li(@click="select(space)" :class="{ active: spaceIsActive(space.id) }" :key="space.id" tabindex="0" v-on:keyup.enter="select(space)")
      //-     .name {{space.name}}
</template>

<script>
// import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfil

// import cache from '@/cache.js'

export default {
  name: 'SpacePicker',
  props: {
    visible: Boolean
  }
  // data () {
  //   return {
  //     spaces: []
  //   }
  // },
  // methods: {
  //   spaceIsActive (spaceId) {
  //     return Boolean(this.selectedSpace.id === spaceId)
  //   },
  //   select (space) {
  //     this.$emit('selectSpace', space)
  //     this.$emit('closeDialog')
  //   },
  //   updateSpaces () {
  //     const currentSpace = this.$store.state.currentSpace
  //     this.spaces = cache.getAllSpaces()
  //     if (this.excludeCurrentSpace) {
  //       this.spaces = this.spaces.filter(space => space.id !== currentSpace.id)
  //     }
  //   },
  //   scrollIntoView () {
  //     const element = this.$refs.dialog
  //     scrollIntoView(element, {
  //       behavior: 'smooth',
  //       scrollMode: 'if-needed'
  //     })
  //   }
  // },
  // watch: {
  //   visible (visible) {
  //     this.$nextTick(() => {
  //       if (visible) {
  //         this.scrollIntoView()
  //         this.updateSpaces()
  //       }
  //     })
  //   }
  // }
}
</script>

<style lang="stylus">
.privacy-picker
  left initial
  right 8px
  .results-section
    padding-top 4px
</style>
