<template lang="pug">
dialog.prompt-pack-picker.narrow(v-if="visible" :open="visible" @click.left.stop)
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
      template(v-for="pack in packs")
        PromptPack(:pack="pack" @select="select")
          //- JournalPromptExample()

        //- template(v-for="(prompt in pack.prompts")
        //-   li(@click.left="select(prompt)" tabindex="0" v-on:keyup.enter="select(prompt)" :class="{ active: isActive(prompt) }")
        //-     .badge.pack-badge(:style="{background: pack.color}") {{pack.name}}
        //-     span {{prompt}}
</template>

<script>
// change name w promptpack
import promptPacks from '@/spaces/promptPacks.json'
import PromptPack from '@/components/PromptPack.vue'

export default {
  name: 'PromptPackPicker',
  components: {
    PromptPack
  },
  props: {
    visible: Boolean,
    position: Object
  },
  // mounted () {
  // this.$store.subscribe((mutation, state) => {
  // if (mutation.type === 'triggerJournalQuestionPromptIsVisibleWithCategory') {
  // TODO set category filter to payload
  //   console.log('🍂 set category to id', mutation.payload.id, mutation.payload.name)
  // }
  // })
  // },
  data () {
    return {
      selectedCategoryId: null
      // viewingPromptsInPack: []
    }
  },
  computed: {
    packs () { return promptPacks },
    userJournalQuestions () { return this.$store.state.currentUser.journalQuestions }
    // unreadCategories () {
    //   const lastReadId = 0 // user.lastReadJournalQuestionPromptsId || 0
    //   const unreadCategories = this.categories.filter(category => category.id > lastReadId)
    //   return unreadCategories.slice(0, 5)
    // }
  },
  methods: {
    // isViewing(pack) {
    //   if (this.viewingPromptsInPack.includes(pack.name)) {
    //     return true
    //   } else {
    //     return false
    //   }
    // },

    // toggleViewAllPrompts (pack) {
    //   console.log('🍄', pack.prompts)
    //   if (this.viewingPromptsInPack.includes(pack.name)) {
    //     this.viewingPromptsInPack = this.viewingPromptsInPack.filter(packName => {
    //       return packName !== pack.name
    //     })
    //   } else {
    //     this.viewingPromptsInPack.push(pack.name)
    //   }
    // },
    select (pack) {
      console.log('select ', pack)
      // cancel if pack is existing active pack
      this.$emit('select', pack)
      // this.$emit('closeDialog')
    }
    // isActive (pack) {
    //   return false // temp
    // },
    // isActive (prompt) {
    //   return Boolean(this.userJournalQuestions.find(question => {
    //     return question.name === prompt
    //   }))
    // },
  }
}
</script>

<style lang="stylus">
.prompt-pack-picker
  overflow scroll
  max-height calc(100vh - 330px)
  button
    .badge
      margin 0
  // .category
  //   margin-left 8px
  //   margin-bottom 5px
  // .category-row
  //   flex-wrap wrap
  //   .button-wrap
  //     margin-right 6px
  .results-section
    max-height initial
  .results-section
    border-top: 1px solid var(--primary);
    padding-top: 4px;

// .template-category-picker
//   top calc(100% - 8px) !important
//   bottom initial !important
//   .results-section
//     padding-top 4px
</style>
