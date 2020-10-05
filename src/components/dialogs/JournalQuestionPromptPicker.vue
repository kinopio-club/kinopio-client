<template lang="pug">
dialog.journal-question-prompt-picker(
  v-if="visible"
  :open="visible"
  @click.left.stop
)
  //- :style="{ left: position.left + 'px', top: position.top + 'px'}"

  section
    p Prompts by&nbsp;
      a(href="http://kawaiijournaling.com") Kawaii Journaling
  section
    .row.category-row
      button.category-button
        .badge.info All
      template(v-for="(unreadCategory in unreadCategories")
        //- todo click on one of these to set the cateogory
        .badge.category-badge.button-badge(:style="{background: unreadCategory.color}")
          span {{unreadCategory.name}}
          img.icon(src="@/assets/new.gif")
  template(v-for="category in categories")
    section.results-section
      ul.results-list
        template(v-for="(prompt in category.prompts")
          li(@click.left="select(prompt)" tabindex="0" v-on:keyup.enter="select(prompt)" :class="{ active: isActive(prompt) }")
            .badge.category-badge(:style="{background: category.color}") {{category.name}}
            span {{prompt}}
</template>

<script>
import journalQuestionPrompts from '@/spaces/journalQuestionPrompts.js'

export default {
  name: 'JournalQuestionPromptPicker',
  props: {
    visible: Boolean,
    position: Object
  },
  data () {
    return {
      selectedCategoryId: null
    }
  },
  computed: {
    categories () {
      return journalQuestionPrompts.categories()
    },
    unreadCategories () {
      const lastReadId = 0 // user.lastReadJournalQuestionPromptsId || 0
      const unreadCategories = this.categories.filter(category => category.id > lastReadId)
      return unreadCategories.slice(0, 5)
    }
    // isActive (prompt) {
    //   return false
    // return this.selectedCategoryId === category.id
    // }
  },
  methods: {
    select (prompt) {
      // cancel if prompt is existing active prompt
      this.$emit('addPrompt', prompt)
      // this.$emit('closeDialog')
    },
    isActive (prompt) {
      return false
      // return this.selectedCategoryId === category.id
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
  .category-button
    margin-right 6px
  .category
    margin-left 8px
    margin-bottom 5px
  .category-row
    flex-wrap wrap
  .category-badge
    flex none
  .results-section
    max-height initial

// .template-category-picker
//   top calc(100% - 8px) !important
//   bottom initial !important
//   .results-section
//     padding-top 4px
</style>
