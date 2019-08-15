<template lang="pug">
dialog.changelog(v-if="visible" :open="visible" @click.stop)
  section
    p changelogggg
</template>

<script>
export default {
  name: 'Changelog',
  props: {
    visible: Boolean,
    newStuff: Array
  },
  methods: {
  }
}
</script>

<style lang="stylus">
.changelog
  overflow auto
  max-height calc(100vh - 110px)
  // img
  //   border-radius 3px
  // ul
  //   margin 0
  //   margin-top 2px
  //   padding-left 15px
  //   list-style-type square
  //   li
  //     padding-top 10px
  //     margin-left 5px
  //     user-select text
  @media(max-width 340px)
    left calc(-100% + 16px)
    max-height calc(100vh - 200px)

</style>
