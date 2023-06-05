<template lang="pug">
.journal-prompt
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
    .button-wrap.remove-button-wrap
      button.remove.small-button(@click.left="removePrompt")
        img.icon(src="@/assets/remove.svg")

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
.journal-prompt + .journal-prompt
  margin-top 10px
.journal-prompt
  button.remove
    margin-left 6px
    width 20px
  .row
    justify-content space-between
    align-items flex-start
  .random
    margin-right 5px
    vertical-align -1px
    color var(--primary)
  .remove-button-wrap
    height 20px
  .name
    color var(--primary-on-light-background)
</style>
