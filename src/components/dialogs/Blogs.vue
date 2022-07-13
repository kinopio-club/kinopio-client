<template lang="pug">
dialog.blogs.narrow(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p Blogs
  section
    p Product updates, bulletins, and guides
    p
      a(href="http://blog.kinopio.club")
        button Kinopio Blog →

  section
    p My personal blog about building software
    p
      a(href="https://pketh.org")
        button pketh.org →

</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'Blogs',
  props: {
    visible: Boolean
  },
  data () {
    return {
      dialogHeight: null
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
      }
    })
  },
  methods: {
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateDialogHeight()
      }
    }
  }
}
</script>

<style lang="stylus">
.blogs
  max-height calc(100vh - 260px)
  overflow auto
  @media(max-width 374px)
    left -50px
</style>
