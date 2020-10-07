<template lang="pug">
dialog.add-space.narrow(v-if="visible" :open="visible" @click.left.stop="closeDialogs" :class="{'child-dialog-is-visible': promptPickerIsVisible}" ref="dialog")
  //- 'narrow': !editQuestionsIsVisible
  section
    .row
      button(@click="addSpace")
        img.icon(src="@/assets/add.svg")
        span New Space
    .row
      .segmented-buttons
        button(@click="addJournalSpace")
          img.icon(src="@/assets/add.svg")
          span {{moonPhase.emoji}} Journal
        button(@click.left.stop="toggleEditQuestionsIsVisible" :class="{ active: editQuestionsIsVisible }")
          span Edit

  section(v-if="editQuestionsIsVisible")
    .row
      .button-wrap
        button(@click.left.stop="togglePromptPickerIsVisible" :class="{ active: promptPickerIsVisible }" ref="promptButton")
          //- .label-badge
          //-   span NEW
          img.icon(src="@/assets/add.svg")
          span Prompts
        JournalQuestionPromptPicker(:visible="promptPickerIsVisible" :position="promptPickerPosition" @closeDialog="closeDialogs" @select="togglePromptQuestion")
        //- TODO promptPickerPosition remove, currently unused,?
          //- remove closeDialog emit, currently unused
      button(@click.left="addQuestion")
        img.icon(src="@/assets/add.svg")
        span Custom

    //- Questions
    //- TODO display loader here if fetching user questions
    .journal-questions(v-if="editQuestionsIsVisible")
      JournalQuestion(v-for="question in userJournalQuestions" :question="question" :key="question.id")

    //- todo: Journal Url to help doc

    //- template(v-if="editQuestionsIsVisible")
    //-   .row
    //-     button(@click.left.stop="toggleDailyUrlIsVisible" :class="{ active: dailyUrlIsVisible }")
    //-       span Journal Url
    //- template(v-if="dailyUrlIsVisible")
    //-   .row
    //-     //- p find todays journal, creates a journal for the day if none exists
    //-     //- p this url will always take you to
    //-     p any day you go to this link , it'll take you that day's daily journal space
    //-     //- p Start Kinopio with a new journal space
    //-   .row
    //-     input.textarea(ref="url" v-model="url")
    //-   .row
    //-     button(@click.left="copyUrl")
    //-       span Copy Journal Url
    //-   .row(v-if="urlIsCopied")
    //-     .badge.success.success-message Url Copied

    //- todo help doc contains journal q sources, kawaiijournaling and Jour blog

    //- everyday is a default pack

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
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerJournalQuestionPromptIsVisibleWithCategory') {
        this.togglePromptPickerIsVisible()
      }
    })
  },
  data () {
    return {
      moonPhase: {},
      url: `${window.location.origin}/daily`,
      editQuestionsIsVisible: false,
      dailyUrlIsVisible: false,
      urlIsCopied: false,
      promptPickerIsVisible: false,
      promptPickerPosition: {
        left: 80,
        top: 5
      }
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

    // importSpace (space) {
    //   if (!this.isValidSpace(space)) { return }
    //   space.originSpaceId = space.id
    //   space.id = nanoid()
    //   space.name = space.name + ' import'
    //   const uniqueNewSpace = cache.updateIdsInSpace(space)
    //   cache.saveSpace(uniqueNewSpace)
    //   this.$store.commit('currentSpace/restoreSpace', uniqueNewSpace)
    //   this.$store.dispatch('currentSpace/saveNewSpace')
    //   this.$store.dispatch('currentUser/lastSpaceId', space.id)
    //   this.updateSpaces()
    //   this.$store.commit('triggerFocusSpaceDetailsName')
    // },
    addJournalSpace () {
      console.log('moonphase', this.moonPhase.emoji, this.moonPhase)
      this.$emit('closeDialog')
      window.scrollTo(0, 0)
      // create the space here
      // TODO make the space creation part work like import example ^
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
      // this.updatePromptPickerPosition() // tODO remove method?
    },
    // updatePromptPickerPosition () {
    //   if (!this.promptPickerIsVisible) { return }
    //   this.promptPickerPosition = {
    //     left: 80,
    //     top: 5
    //   }
    // },
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
    // updateCategoryFilter () {},
    addQuestion () {
      console.log('🐸 addQuestion')
      // add a new question field , scroll to, focus
    },
    togglePromptQuestion (prompt) {
      // add it if it doesn't already exist (prepend or append?)
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
  // .journal-questions
  //   margin-bottom 10px
  // .label-badge
  //   left -4px
  //   top -6px
</style>
