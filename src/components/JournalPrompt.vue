<template lang="pug">
.prompt
  .row
    //- .badge.info.button-badge.category(v-if="currentCategory" @click.stop="triggerPromptCategory" :style="{'background-color': currentCategory.color}") {{currentCategory.name}}
    textarea(
      v-if="!isPack"
      ref="name"
      rows="1"
      v-model="name"
      placeholder="Ask yourself this"
      maxlength="250"

      @keyup.alt.enter.exact.stop
      @keyup.ctrl.enter.exact.stop
      @keydown.alt.enter.exact.stop="insertLineBreak"
      @keydown.ctrl.enter.exact.stop="insertLineBreak"
    )
    div(v-if="isPack")
      span.random Random
      span.badge.button-badge(:style="{background: pack.color}" @click.stop="showPicker")
        span {{name}}

    .button-wrap
      button.remove(@click.left="removePrompt")
        img.icon(src="@/assets/remove.svg")
        span
</template>

<script>
import journalPromptPacks from '@/spaces/journalPromptPacks.js'

export default {
  name: 'JournalPrompt',
  props: {
    prompt: Object
  },
  data () {
    return {
      currentCategory: null
    }
  },
  mounted () {
    // this.checkPromptCategory(this.prompt.name)
    this.updateTextareaSize()
  },
  computed: {
    // categories () {
    //   return journalPromptPrompts.categories()
    // },
    isPack () { return this.prompt.isPack },
    promptPacks () { return journalPromptPacks.packs() },
    pack () {
      if (!this.isPack) { return }
      const pack = this.promptPacks.find(pack => pack.name === this.prompt.name)
      return pack || {}
    },
    name: {
      get () {
        return this.prompt.name
      },
      set (newName) {
        // this.checkPromptCategory(newName)
        this.updateTextareaSize()
        this.$store.dispatch('currentUser/updateJournalPrompt', {
          promptId: this.prompt.id,
          name: newName
        })
      }
    }
  },
  methods: {
    // checkPromptCategory (name) {
    //   const currentCategory = this.categories.find(category => {
    //     return category.prompts.includes(name)
    //   })
    //   if (currentCategory) {
    //     this.currentCategory = currentCategory
    //     this.updateTextareaSize()
    //   } else {
    //     this.currentCategory = null
    //   }
    // },
    removePrompt () {
      console.log('🍆 removePrompt')
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
  .category
    margin-bottom 5px
    flex none
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
