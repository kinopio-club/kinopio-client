<template lang="pug">
.question
  .row.prompt-category
    //- category name and color
    .badge.info optional group

  textarea(
    ref="question"
    rows="1"
    v-model="name"
    placeholder="Ask yourself this every day"
    maxlength="250"

    @keyup.alt.enter.exact.stop
    @keyup.ctrl.enter.exact.stop
    @keydown.alt.enter.exact.stop="insertLineBreak"
    @keydown.ctrl.enter.exact.stop="insertLineBreak"
  )

  //- carddetails.insertLineBreak 👀

  .row
    .button-wrap
      button(@click.left="removeQuestion")
        img.icon(src="@/assets/remove.svg")
        span Remove
</template>

<script>

export default {
  name: 'JournalQuestion',
  props: {
    question: Object
  },
  computed: {
    name: {
      get () {
        // update height of textarea()
        return this.question.name
      },
      set (newName) {
        // this.$store.dispatch('currentSpace/updateSpace', { name: newName })
        // this.updateSpaces()
        // update height of textarea()
        console.log('🍆 update')
      }
    }

    // showInExploreLabel () {
    //   return 'Show Space in Explore'
    // }
  },
  methods: {
    insertLineBreak () {
      console.log('🍆 insertLineBreak')
    },
    removeQuestion () {
      console.log('🍆 removeQuestion')
    }

    // updateCurrentSpace () {
    //   this.$emit('updateCurrentSpace')
    // }
  }
}
</script>

<style lang="stylus">
.question + .question
  margin-top 10px
.question
  textarea
    margin-bottom 5px
  .prompt-category
    margin-bottom 5px

</style>
