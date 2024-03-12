<template lang="pug">
dialog.import.narrow(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialog")
  section
    p Import Space

</template>

<script>

</script>

<style lang="stylus">
  // .button-wrap
  //   dialog
  //     @media(max-height 500px)
  //       top initial
  //       bottom 8px

</style>
