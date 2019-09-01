<template lang="pug">
dialog.narrow(v-if="visible" :open="visible" ref="dialog" @click.stop)
  section.results-section
    ul.results-list
      template(v-for="(frame in frames")
        li
          .name {{frame.name}}
        //li(:class="{ active: connectionTypeIsActive(type.id) }" @click="changeConnectionType(type)" :key="type.id")
        //  .badge(:style="{backgroundColor: type.color}" :class="{checked: connectionTypeIsDefault(type.id)}")
        //  .name {{type.name}}
</template>

<script>
import frames from '@/frames.js'

export default {
  props: {
    visible: Boolean,
    card: Object
  },
  computed: {
    frames () {
      return frames
    }
  }
}
</script>

<style lang="stylus" scoped>
section
  padding-top 4px
</style>
