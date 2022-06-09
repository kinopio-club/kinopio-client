<template lang="pug">
.prompt-picker(v-if="visible" @click.left.stop ref="dialog")

  .row
    .button-wrap
      button(@click.left="addCustomPrompt")
        img.icon(src="@/assets/add.svg")
        span Add Daily Prompt

  button(@click="toggleRandomPromptsIsVisible" :class="{active: randomPromptsIsVisible}")
    img.icon(v-if="!randomPromptsIsVisible" src="@/assets/view.svg")
    img.icon(v-if="randomPromptsIsVisible" src="@/assets/view-hidden.svg")
    span More Prompts
  .results-section(v-if="randomPromptsIsVisible")
    ul.results-list
      template(v-for="pack in packs")
        PromptPack(:pack="pack" @select="select")
</template>

<script>
import promptPacks from '@/data/promptPacks.json'
import PromptPack from '@/components/PromptPack.vue'
import utils from '@/utils.js'

export default {
  name: 'PromptPicker',
  components: {
    PromptPack
  },
  props: {
    visible: Boolean,
    position: Object
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
      }
    })
  },
  data () {
    return {
      dialogHeight: null,
      randomPromptsIsVisible: false
    }
  },
  computed: {
    packs () { return promptPacks },
    userJournalQuestions () { return this.$store.state.currentUser.journalQuestions }
  },
  methods: {
    addCustomPrompt () {
      this.$emit('addCustomPrompt')
    },
    toggleRandomPromptsIsVisible () {
      this.randomPromptsIsVisible = !this.randomPromptsIsVisible
    },
    select (pack) {
      this.$emit('select', pack)
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateDialogHeight()
      }
    }
  }
}
</script>

<style lang="stylus">
.prompt-picker
  margin-top 10px
  button
    .badge
      margin 0
  .results-section
    max-height initial
  .results-section
    padding 0
    padding-top 4px

</style>
