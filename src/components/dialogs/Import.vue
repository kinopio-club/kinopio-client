<template lang="pug">
dialog.import.narrow(v-if="visible" :open="visible" @click.stop ref="dialog")
  section
    p Import Space
  section
    p Upload an exported Kinopio space file
    button(@click="selectFile")
      span.badge json
      span Select file
    Loader(:visible="loading")
    input.hidden(type="file" ref="input" accept=".json" @change="readFile")
</template>

<script>
import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfil

import Loader from '@/components/Loader.vue'

export default {
  name: 'Import',
  components: {
    Loader
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      loading: false
      // spaceParsingErrors: []
    }
  },
  methods: {
    selectFile () {
      if (this.loading) { return }
      const input = this.$refs.input
      input.click()
    },
    readFile () {
      this.loading = true
      const input = this.$refs.input
      const file = input.files[0]
      const reader = new FileReader()
      reader.readAsText(file)
      reader.onload = event => {
        this.loading = false
        const space = JSON.parse(event.target.result)
        this.importSpace(space)
      }
    },
    importSpace (space) {
      // if (this.isValidSpace(space)) {} else (show user err)
      console.log(space) // randomize id
    },
    isValidSpace (space) {

      // check the space and return true if space has all core fields / types req'd
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      scrollIntoView(element, {
        behavior: 'smooth',
        scrollMode: 'if-needed'
      })
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.scrollIntoView()
        }
      })
    }
  }
}
</script>

<style lang="stylus">
.import
  .hidden
    display none
  .loader
    margin-left 6px
</style>
