<template lang="pug">
dialog.narrow.add-space(v-if="visible" :open="visible" @click.stop)
  section
    .row
      button
        img.icon(src="@/assets/add.svg")
        span New Space
    .row
      .segmented-buttons
        button
          img.icon(src="@/assets/add.svg")
          span Daily Journal
        button(@click.left.stop="toggleEditQuestionsIsVisible" :class="{ active: editQuestionsIsVisible }")
          span Edit

    //- todo display loader here if fetching user questions

    .journal-questions(v-if="editQuestionsIsVisible")
      //- .row
      //-   p Questions

      .question
        //- to component Questions(questions=currentUser.questions, fetched from cache, etc. on load)
        textarea(
          ref="question"
          rows="1"
          v-model="question"
          placeholder="Ask yourself this every day"
          maxlength="250"

          @keyup.alt.enter.exact.stop
          @keyup.ctrl.enter.exact.stop
          @keydown.alt.enter.exact.stop="insertLineBreak"
          @keydown.ctrl.enter.exact.stop="insertLineBreak"

          @paste="updateQuestion"
          @keyup="updateQuestion"
        )
        //- carddetails.insertLineBreak 👀
        //- paste = updatequestion, keyup=updatequestion
        //- Remove
        .row
          .button-wrap
            button(@click.left="removeQuestion")
              img.icon(src="@/assets/remove.svg")
              span Remove
          .button-wrap
            button
              img.icon(src="@/assets/add.svg")
              span Add

      //- .button-wrap
      //-   button
      //-     img.icon(src="@/assets/add.svg")
      //-     span Add Question

  section(v-if="editQuestionsIsVisible")
    .row
      button(@click.left.stop="toggleDailyUrlIsVisible" :class="{ active: dailyUrlIsVisible }")
        span Daily Url
    template(v-if="dailyUrlIsVisible")
      .row
        p Automatically start with a new daily journal
      .row
        input.textarea(ref="url" v-model="url")
      .row
        button(@click.left="copyUrl")
          span Copy Daily Url
      .row(v-if="urlIsCopied")
        .badge.success.success-message Url Copied

    //- p Use&nbsp;
    //-   a(href="#") kinopio.club/daily

    //-   span &nbsp;to automatically start with daily journals
</template>

<script>
import moonphase from '@/moonphase.js'

export default {
  name: 'AddSpace',
  props: {
    visible: Boolean
  },
  mounted () {
    this.moonPhase = moonphase()
    console.log('🌙 moonphase', this.moonPhase)
  },
  data () {
    return {
      moonPhase: {},
      url: `${window.location.origin}/daily`,
      editQuestionsIsVisible: false,
      dailyUrlIsVisible: false,
      urlIsCopied: false
    }
  },
  computed: {
    userJournalQuestions () { return this.$store.state.currentUser.journalQuestions }
  },
  methods: {
    addSpace () {
      window.scrollTo(0, 0)
      this.$store.dispatch('currentSpace/addSpace')
      this.$emit('updateSpaces')
    },
    toggleEditQuestionsIsVisible () {
      this.editQuestionsIsVisible = !this.editQuestionsIsVisible
    },
    toggleDailyUrlIsVisible () {
      this.dailyUrlIsVisible = !this.dailyUrlIsVisible
    },
    closeAll () {
      this.editQuestionsIsVisible = false
      this.dailyUrlIsVisible = false
      this.urlIsCopied = false
    },
    copyUrl () {
      const element = this.$refs.url
      element.select()
      element.setSelectionRange(0, 99999) // for mobile
      document.execCommand('copy')
      this.urlIsCopied = true
    },

    // 🍆 methods for question component
    insertLineBreak () {
      console.log('🍆 insertLineBreak')
    },
    updateQuestion () {
      console.log('🍆 updateQuestion')
    },
    removeQuestion () {
      console.log('🍆 removeQuestion')
    }
  },
  watch: {
    visible (visible) {
      this.closeAll()
    }
  }
}
</script>

<style lang="stylus">
.add-space
  overflow scroll
  max-height calc(100vh - 230px)
  .textarea
    background-color var(--secondary-background)
    border 0
    border-radius 3px
    padding 4px

  // todo move to JournalQuestions component
  .question + .question
    margin-top 10px
  .question
    // margin-bottom 10px
    textarea
      margin-bottom 5px
</style>
