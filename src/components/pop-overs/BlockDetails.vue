<template lang="pug">
dialog.pop-over(:open="blockDetailsVisible")
  p block details pop over is me
</template>

<script>
export default {
  name: 'BlockDetails',
  props: {
    block: Object
  },
  created () {
    console.log('hello!')
    // scroll teh window if required
  },
  // data () {
  //   return {
  //     color: undefined,
  //   }
  // },
  computed: {
    id () { return this.block.id },
    x () { return this.block.x },
    y () { return this.block.y },
    z () { return this.block.z },
    name () { return this.block.name },
    blockDetailsVisible () {
      console.log('blockDetailsVisible', this.block.blockDetailsVisible)
      return this.block.blockDetailsVisible
    }
  },
  methods: {
  }
}
</script>

<style lang="stylus">
</style>
