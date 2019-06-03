<template lang="pug">
path(
  fill="none"
  stroke="#333333"
  stroke-width="3"
  :data-start-card="startCardId"
  :data-end-card="endCardId"
  :d="path"
  @click="showConnectionDetailsPop"
)
</template>

<script>
export default {
  props: {
    id: Number,
    connectionType: Number,
    startCardId: Number,
    endCardId: Number,
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
