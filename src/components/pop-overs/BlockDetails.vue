<template lang="pug">
dialog.pop-over(:open="blockDetailsVisible")
  section
    input(placeholder="name" v-model="name")
    div
      button hihi
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
  //     name: this.block.name
  //   }
  // },
  computed: {
    id () { return this.block.id },
    x () { return this.block.x },
    y () { return this.block.y },
    z () { return this.block.z },
    name: {
      get () {
        return this.block.name
      },
      set (newValue) {
        const options = {
          type: 'name',
          value: newValue,
          blockId: this.id
        }
        this.$store.commit('currentSpace/updateBlockDetails', options)
      }
    },
    blockDetailsVisible () {
      console.log('blockDetailsVisible', this.block.blockDetailsVisible)
      return this.block.blockDetailsVisible
    }
  },
  methods: {
    // update(event) {
    //   console.log('update',event,this)
    // }
    // name() {
    //   console.log ('🚒', this, this.block)
    //   return this.block.name
    // }
  }
}
</script>

<style lang="stylus">
</style>
