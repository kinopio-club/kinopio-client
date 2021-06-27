<template lang="pug">
.prompt-pack-picker(v-if="visible" @click.left.stop ref="dialog")
  p
    img.icon(src="@/assets/add.svg")
    span Add random daily prompts
  .results-section
    ul.results-list
      template(v-for="pack in packs")
        PromptPack(:pack="pack" @select="select")
</template>

<script>
import promptPacks from '@/data/promptPacks.json'
import PromptPack from '@/components/PromptPack.vue'
import utils from '@/utils.js'

export default {
  name: 'PromptPackPicker',
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
      dialogHeight: null
    }
  },
  computed: {
    packs () { return promptPacks },
    userJournalQuestions () { return this.$store.state.currentUser.journalQuestions }
  },
  methods: {
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
.prompt-pack-picker
  // margin-top 10px
  button
    .badge
      margin 0
  .results-section
    max-height initial
  .results-section
    padding 0
    padding-top 4px

</style>
