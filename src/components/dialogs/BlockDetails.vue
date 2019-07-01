<template lang="pug">
dialog(v-if="blockDetailsVisible" :open="blockDetailsVisible")
  section
    input.name(placeholder="name" v-model="name" autofocus)
    p blockid {{id}}
    // div
      // button hihi
</template>

<script>
export default {
  name: 'BlockDetails',
  props: {
    block: Object
  },
  computed: {
    id () { return this.block.id },
    x () { return this.block.x },
    y () { return this.block.y },
    z () { return this.block.z },
    blockDetailsVisible () { return this.block.blockDetailsVisible },
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
    }
  },
  watch: {
    blockDetailsVisible (visible) {
      const isEmpty = !this.block.name // TODO: expand isEmpty to inlcude other metadata content (images etc)
      if (!visible && isEmpty) {
        this.$store.commit('currentSpace/deleteBlock', this.block.id)
      }
    }
  }
}
</script>

<style lang="stylus">
</style>
