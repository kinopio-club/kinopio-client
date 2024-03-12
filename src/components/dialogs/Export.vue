<template lang="pug">
dialog.narrow.export(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p Export

</template>

<script>

</script>

<style lang="stylus" scoped>
  // top calc(100% - 8px)
  // left initial
  // right 8px
  // overflow scroll
  // max-height calc(100vh - 100px)

section.export
  textarea
    background-color var(--secondary-background)
    border 0
    border-radius var(--small-entity-radius)
    padding 4px
    margin-bottom 4px
    height 100px
  button
    display block
    margin-left 0
    white-space initial
  button + button
    margin-top 10px
  .badge.success
    margin-top 10px
  .hidden
    display none
  .info-container
    margin-top 10px
</style>
