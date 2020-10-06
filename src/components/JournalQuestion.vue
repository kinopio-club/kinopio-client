<template lang="pug">
.question
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
      button.remove(@click.left="removeQuestion")
        img.icon(src="@/assets/remove.svg")
        span
</template>

<script>
// import journalQuestionPrompts from '@/spaces/journalQuestionPrompts.js'

export default {
  name: 'JournalQuestion',
  props: {
    question: Object
  },
  data () {
    return {
      currentCategory: null
    }
  },
  mounted () {
    // this.checkQuestionCategory(this.question.name)
    this.updateTextareaSize()
  },
  computed: {
    // categories () {
    //   return journalQuestionPrompts.categories()
    // },
    name: {
      get () {
        return this.question.name
      },
      set (newName) {
        // this.checkQuestionCategory(newName)
        this.updateTextareaSize()
        this.$store.dispatch('currentUser/updateJournalQuestion', {
          questionId: this.question.id,
          name: newName
        })
      }
    }
  },
  methods: {
    // checkQuestionCategory (name) {
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
    removeQuestion () {
      console.log('🍆 removeQuestion')
    },
    triggerPromptCategory () {
      this.$store.commit('triggerJournalQuestionPromptIsVisibleWithCategory', this.currentCategory)
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
.question + .question
  margin-top 10px
.question
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
