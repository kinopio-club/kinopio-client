<template lang="pug">
.prompt
  .row
    textarea(
      v-if="!isPack"
      ref="name"
      rows="1"
      v-model="name"
      placeholder="Ask yourself this"
      maxlength="250"
      :data-id="prompt.id"

      @keyup.alt.enter.exact.stop
      @keyup.ctrl.enter.exact.stop
      @keydown.alt.enter.exact.stop="insertLineBreak"
      @keydown.ctrl.enter.exact.stop="insertLineBreak"
    )
    div(v-if="isPack" :data-id="prompt.id")
      span.random Random
      span.badge.button-badge(:style="{background: pack.color}" @click.stop="showPicker")
        span {{name}}

    .button-wrap
      button.remove(@click.left="removePrompt")
        img.icon(src="@/assets/remove.svg")
        span
</template>

<script>
import promptPacks from '@/data/promptPacks.json'

import utils from '@/utils.js'

export default {
  name: 'JournalPrompt',
  props: {
    prompt: Object
  },
  mounted () {
    this.updateTextareaSize()
  },
  computed: {
    isPack () { return this.prompt.isPack },
    pack () {
      if (!this.isPack) { return }
      const pack = promptPacks.find(pack => pack.name === this.prompt.name)
      return pack || {}
    },
    name: {
      get () {
        return this.prompt.name
      },
      set (newName) {
        this.updateTextareaSize()
        let updatedPrompt = utils.clone(this.prompt)
        updatedPrompt.name = newName
        this.$store.dispatch('currentUser/updateJournalPrompt', updatedPrompt)
      }
    }
  },
  methods: {
    removePrompt () {
      this.$store.dispatch('currentUser/removeJournalPrompt', this.prompt)
    },
    updateTextareaSize () {
      this.$nextTick(() => {
        const textarea = this.$refs.name
        if (!textarea) { return }
        textarea.style.height = textarea.scrollHeight + 1 + 'px'
      })
    },
    showPicker () {
      this.$emit('showPicker')
    }
  }
}
</script>

<style lang="stylus">
.prompt + .prompt
  margin-top 4px
.prompt
  textarea
    margin-bottom 5px
  button.remove
    margin-left 6px
    width 26px
    vertical-align 8px
    flex none
  .row
    justify-content space-between
  .random
    margin-right 3px
    vertical-align -1px
</style>
