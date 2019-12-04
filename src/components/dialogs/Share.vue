<template lang="pug">
dialog.narrow.share(v-if="visible" :open="visible" @click.stop ref="dialog")
  section
    p Share
  section
    p Everyone can view this space, but only you can edit it
    //- Everyone can view this space but only you and your [collaborators || group] , can edit it
    textarea(ref="url") {{url()}}
    button.success(v-if="urlIsCopied" @click="copyUrl") Copied
    button(v-else @click="copyUrl") Copy

</template>

<script>

// import utils from '@/utils.js'

export default {
  name: 'Share',
  props: {
    visible: Boolean
  },
  data () {
    return {
      urlIsCopied: false
    }
  },
  computed: {
    // spaceName () {
    //   return this.$store.state.currentSpace.name
    // },
    // userCanEditCurrentSpace () {
    //   return this.$store.getters['currentUser/CanEditCurrentSpace']
    // },
  },
  methods: {
    url () {
      return 'https://kinopio.club/space-name-id123xyz456popo'
    },
    copyUrl () {
      const element = this.$refs.url
      element.select()
      element.setSelectionRange(0, 99999) // for mobile
      document.execCommand('copy')
      this.urlIsCopied = true
    }
  },
  watch: {
    visible (visible) {
      this.urlIsCopied = false
    }
  }
}
</script>

<style lang="stylus">
.share
  top calc(100% - 8px)
  left initial
  right 8px
  textarea
    background-color var(--secondary-background)
    border 0
    border-radius 3px
    padding 4px
    margin-bottom 4px
    margin-top 10px
    // height 40px
</style>
