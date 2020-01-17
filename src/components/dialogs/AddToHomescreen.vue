<template lang="pug">
dialog.add-to-homescreen(v-if="visible" :open="visible" @click.stop)
  section
    p AddToHomescreen

</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'AddToHomescreen',
  props: {
    visible: Boolean
  },
  data () {
    return {
      isIOS: false,
      isAndroid: false
    }
  },
  mounted () {
    this.isIOS = utils.isIOS()
    this.isAndroid = utils.isAndroid()
  }
  // computed: {
  // }
}
</script>

<style lang="stylus">
.add-to-homescreen
  overflow auto
  max-height calc(100vh - 175px)
  @media(max-width 340px)
    max-height calc(100vh - 200px)
</style>
