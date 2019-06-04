<template lang="pug">
path(
  fill="none"
  stroke="#333333"
  stroke-width="3"
  :data-start-block="startBlockId"
  :data-end-block="endBlockId"
  :d="path"
  @click="showConnectionDetailsPop"
)
</template>

<script>
export default {
  props: {
    id: String,
    connectionType: String,
    startBlockId: String,
    endBlockId: String,
    path: String
  },
  methods: {
    showConnectionDetailsPop () {
      console.log('path is clicked') // which path?
    }
  }
}
</script>

<style lang="stylus">
</style>
