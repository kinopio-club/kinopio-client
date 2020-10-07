<template lang="pug">
dialog.prompt-pack-picker.narrow(v-if="visible" :open="visible" @click.left.stop)
  section
    p Prompt packs add random prompts to your journals
  section.results-section
    ul.results-list
      template(v-for="pack in packs")
        PromptPack(:pack="pack" @select="select")
</template>

<script>
import promptPacks from '@/data/promptPacks.json'
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
  data () {
    return {
      selectedCategoryId: null
    }
  },
  computed: {
    packs () { return promptPacks },
    userJournalQuestions () { return this.$store.state.currentUser.journalQuestions }
  },
  methods: {
    select (pack) {
      this.$emit('select', pack)
    }
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
  .results-section
    max-height initial
  .results-section
    border-top: 1px solid var(--primary);
    padding-top: 4px;
</style>
