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
      @focus="checkOnFocus"
    )
    div.prompt-pack-name(v-if="isPack" :data-id="prompt.id")
      span.random Random
      span.badge.button-badge(:style="{background: pack.color}" @click.stop="showPicker")
        span {{name}}

    .button-wrap.remove-button-wrap
      button.remove.small-button(@click.left="removePrompt")
        img.icon(src="@/assets/remove.svg")
        span
</template>

<script>
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
    isPack () { return Boolean(this.prompt.packId) },
    pack () {
      if (!this.isPack) { return }
      return utils.promptPackById(this.prompt.packId)
    },
    name: {
      get () {
        if (this.pack) {
          return this.pack.name
        } else {
          return this.prompt.name
        }
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
    checkOnFocus () {
      const height = utils.visualViewport().height
      this.$nextTick(() => {
        if (height < 500) {
          this.$emit('showScreenIsShort', height)
        }
      })
    },
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
  margin-top 10px
.prompt
  .prompt-pack-name
    width 100%
  textarea
    margin-bottom 5px
  button.remove
    margin-left 6px
  .row
    justify-content space-between
    align-items flex-start
  .random
    margin-right 3px
    vertical-align -1px
  .remove-button-wrap
    height 20px
</style>
