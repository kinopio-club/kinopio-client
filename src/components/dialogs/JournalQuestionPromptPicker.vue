<template lang="pug">
dialog.journal-question-prompt-picker.narrow(v-if="visible" :open="visible" @click.left.stop)
  //- :style="{ left: position.left + 'px', top: position.top + 'px'}"

  section
    p Prompt packs add random prompts to your journals
    //- by&nbsp;
    //-   a(href="http://kawaiijournaling.com") Kawaii Journaling

  //- section
  //-   .row
  //-     .button-wrap
  //-       button
  //-         .badge.info All Prompts

    //- .row.category-row
    //-   template(v-for="(unreadCategory in unreadCategories")
    //-     //- todo click on one of these to set the cateogory
    //-     .badge.category-badge.button-badge(:style="{background: unreadCategory.color}")
    //-       span {{unreadCategory.name}}
    //-       img.icon(src="@/assets/new.gif")

  //- ResultsFilter(:hideFilter="hideFilter" :items="spaces" @updateFilter="updateFilter" @updateFilteredItems="updateFilteredSpaces")

  section.results-section
    ul.results-list
        li(v-for="pack in promptPacks" @click.left="select(pack)" tabindex="0" v-on:keyup.enter="select(pack)" :class="{ active: isActive(pack) }")
          .name-wrap
            .badge.button-badge(:style="{background: pack.color}")
              img.icon(src="@/assets/add.svg")
              span {{pack.name}}
            button(@click.stop) View All
          p
            .label-badge
              span ex
            span {{randomPrompt(pack)}}

        //- template(v-for="(prompt in pack.prompts")
        //-   li(@click.left="select(prompt)" tabindex="0" v-on:keyup.enter="select(prompt)" :class="{ active: isActive(prompt) }")
        //-     .badge.pack-badge(:style="{background: pack.color}") {{pack.name}}
        //-     span {{prompt}}
</template>

<script>
// change name w promptpack
import journalQuestionPrompts from '@/spaces/journalQuestionPrompts.js'
import random from 'lodash-es/random'

export default {
  name: 'JournalQuestionPromptPicker',
  props: {
    visible: Boolean,
    position: Object
  },
  mounted () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerJournalQuestionPromptIsVisibleWithCategory') {
        // TODO set category filter to payload
        console.log('🍂 set category to id', mutation.payload.id, mutation.payload.name)
      }
    })
  },
  data () {
    return {
      selectedCategoryId: null
    }
  },
  computed: {
    promptPacks () {
      return journalQuestionPrompts.packs()
    },
    userJournalQuestions () {
      return this.$store.state.currentUser.journalQuestions
    }
    // unreadCategories () {
    //   const lastReadId = 0 // user.lastReadJournalQuestionPromptsId || 0
    //   const unreadCategories = this.categories.filter(category => category.id > lastReadId)
    //   return unreadCategories.slice(0, 5)
    // }
  },
  methods: {
    select (pack) {
      console.log('select ', pack)
      // cancel if pack is existing active pack
      this.$emit('addPromptPack', pack)
      // this.$emit('closeDialog')
    },
    isActive (pack) {
      return false // temp
    },
    // isActive (prompt) {
    //   return Boolean(this.userJournalQuestions.find(question => {
    //     return question.name === prompt
    //   }))
    // },
    randomPrompt (pack) {
      let prompt = random(0, pack.prompts.length)
      console.log(pack.prompts, prompt)
      return pack.prompts[prompt]
    }
  }
}
</script>

<style lang="stylus">
.journal-question-prompt-picker
  overflow scroll
  max-height calc(100vh - 330px)
  a
    color var(--primary)
  button
    .badge
      margin 0
  article
    position static
    margin-bottom 10px
    padding-bottom 10px
    border-bottom 1px solid var(--primary)
  .category
    margin-left 8px
    margin-bottom 5px
  // .category-row
  //   flex-wrap wrap
  //   .button-wrap
  //     margin-right 6px
  .category-badge
    flex none
  .results-section
    max-height initial
  .results-section
    border-top: 1px solid var(--primary);
    padding-top: 4px;
  ul.results-list
    li
      display block
      .name-wrap
        display flex
        justify-content space-between
        > .badge
          height 19px
          margin-top 2px
      p
        margin-top 2px
      .label-badge
        position static
        display inline
        margin-right 3px
        background-color var(--secondary-background)
        span
          color var(--primary)
          vertical-align 1px

// .template-category-picker
//   top calc(100% - 8px) !important
//   bottom initial !important
//   .results-section
//     padding-top 4px
</style>
