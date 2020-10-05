<template lang="pug">
dialog.narrow.add-space(v-if="visible" :open="visible" @click.left.stop="closeDialogs" :class="{'child-dialog-is-visible': promptPickerIsVisible}" ref="dialog")
  section
    .row
      button(@click="addSpace")
        img.icon(src="@/assets/add.svg")
        span New Space
    .row
      .segmented-buttons
        button
          img.icon(src="@/assets/add.svg")
          span Daily Journal
        button(@click.left.stop="toggleEditQuestionsIsVisible" :class="{ active: editQuestionsIsVisible }")
          span Edit

    template(v-if="editQuestionsIsVisible")
      .row
        button(@click.left="addQuestion")
          img.icon(src="@/assets/add.svg")
          span Add
        .button-wrap
          button(@click.left.stop="togglePromptPickerIsVisible" :class="{ active: promptPickerIsVisible }" ref="promptButton")
            .label-badge
              span NEW
            img.icon(src="@/assets/add.svg")
            span Prompts
          JournalQuestionPromptPicker(:visible="promptPickerIsVisible" :position="promptPickerPosition")
          //- TODO remove, currently unused, promptPickerPosition, or reuse for mobile?

    //- Questions
    //- TODO display loader here if fetching user questions
    .journal-questions(v-if="editQuestionsIsVisible")
      JournalQuestion(v-for="question in userJournalQuestions" :question="question" :key="question.id")

    //- Daily Url
    template(v-if="editQuestionsIsVisible")
      .row
        button(@click.left.stop="toggleDailyUrlIsVisible" :class="{ active: dailyUrlIsVisible }")
          span Daily Url
    template(v-if="dailyUrlIsVisible")
      .row
        p Start Kinopio with a new daily journal
      .row
        input.textarea(ref="url" v-model="url")
      .row
        button(@click.left="copyUrl")
          span Copy Daily Url
      .row(v-if="urlIsCopied")
        .badge.success.success-message Url Copied

</template>

<script>
import moonphase from '@/moonphase.js'
import JournalQuestion from '@/components/JournalQuestion.vue'
import JournalQuestionPromptPicker from '@/components/dialogs/JournalQuestionPromptPicker.vue'

export default {
  name: 'AddSpace',
  components: {
    JournalQuestion,
    JournalQuestionPromptPicker
  },
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
      urlIsCopied: false,
      promptPickerIsVisible: false,
      promptPickerPosition: {}
    }
  },
  computed: {
    userJournalQuestions () { return this.$store.state.currentUser.journalQuestions }
  },
  methods: {
    addSpace () {
      this.$emit('closeDialog')
      window.scrollTo(0, 0)
      this.$store.dispatch('currentSpace/addSpace')
      this.$emit('updateSpaces')
    },
    addDailyJournalSpace () {
      this.$emit('closeDialog')
      window.scrollTo(0, 0)
      this.$store.dispatch('currentSpace/addDailyJournalSpace')
      this.$emit('updateSpaces')
    },
    toggleEditQuestionsIsVisible () {
      this.editQuestionsIsVisible = !this.editQuestionsIsVisible
    },
    toggleDailyUrlIsVisible () {
      this.dailyUrlIsVisible = !this.dailyUrlIsVisible
    },
    togglePromptPickerIsVisible () {
      this.promptPickerIsVisible = !this.promptPickerIsVisible
      this.updatePromptPickerPosition() // tODO remove method?
    },
    updatePromptPickerPosition () {
      if (!this.promptPickerIsVisible) { return }
      this.promptPickerPosition = {
        left: 80,
        top: 5
      }
    },
    closeAll () {
      this.editQuestionsIsVisible = false
      this.dailyUrlIsVisible = false
      this.urlIsCopied = false
      this.promptPickerIsVisible = false
    },
    closeDialogs () {
      this.promptPickerIsVisible = false
    },
    copyUrl () {
      const element = this.$refs.url
      element.select()
      element.setSelectionRange(0, 99999) // for mobile
      document.execCommand('copy')
      this.urlIsCopied = true
    },
    addQuestion () {
      console.log('🐸 addQuestion')
      // add a new question field , scroll to, focus
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
  &.child-dialog-is-visible
    overflow initial !important
  .textarea
    background-color var(--secondary-background)
    border 0
    border-radius 3px
    padding 4px
  .journal-questions
    margin-bottom 10px
  .label-badge
    left -4px
    top -6px
</style>
