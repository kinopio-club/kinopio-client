<template lang="pug">
dialog.narrow.journal-question-prompt-picker(
  v-if="visible"
  :open="visible"
  @click.left.stop
)
  //- :style="{ left: position.left + 'px', top: position.top + 'px'}"

  section
    p Prompts by&nbsp;
      a(href="http://kawaiijournaling.com") Kawaii Journaling
  section
    .row
      button
        .badge.info All
    template(v-for="category in categories")
      .row
        .badge(:style="{background: category.color}") {{category.name}}
      //- section.results-section
      //-   ul.results-list
      //-     template(v-for="(category in categories")
      //-       li(@click.left="select(category)" :key="category.id" tabindex="0" v-on:keyup.enter="select(category)" :class="{ active: isActive(category) }")
      //-         .badge.info {{category.name}}
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
    }
  },
  methods: {
  //   select (category) {
  //     this.$store.commit('triggerSelectTemplateCategory')
  //     this.$emit('selectCategory', category)
  //     this.$emit('closeDialog')
  //   },
  //   isActive (category) {
  //     return this.selectedCategoryId === category.id
  //   }
  // }
  }
}
</script>

<style lang="stylus">
.journal-question-prompt-picker
  overflow scroll
  max-height calc(100vh - 230px)
  a
    color var(--primary)
  button
    .badge
      margin 0
// .template-category-picker
//   top calc(100% - 8px) !important
//   bottom initial !important
//   .results-section
//     padding-top 4px
</style>
