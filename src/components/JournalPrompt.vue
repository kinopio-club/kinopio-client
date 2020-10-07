<template lang="pug">
.prompt
  .row
    //- .badge.info.button-badge.category(v-if="currentCategory" @click.stop="triggerPromptCategory" :style="{'background-color': currentCategory.color}") {{currentCategory.name}}
    textarea(
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
    .button-wrap
      button.remove(@click.left="removePrompt")
        img.icon(src="@/assets/remove.svg")
        span
</template>

<script>
// import journalPromptPrompts from '@/spaces/journalPromptPrompts.js'

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
    triggerPromptCategory () {
      // temp
      this.$store.commit('triggerJournalPromptPromptIsVisibleWithCategory', this.currentCategory)
    },
    updateTextareaSize () {
      this.$nextTick(() => {
        const textarea = this.$refs.name
        textarea.style.height = textarea.scrollHeight + 1 + 'px'
      })
    }
  }
}
</script>

<style lang="stylus">
.prompt + .prompt
  margin-top 10px
.prompt
  textarea
    margin-bottom 5px
  .category
    margin-bottom 5px
    flex none
  button.remove
    margin-left 6px
    width 26px
    margin-top -5px
    vertical-align 8px
    flex none

</style>
