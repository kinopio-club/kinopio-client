<template lang="pug">
dialog.add-space.narrow(v-if="visible" :open="visible" @click.left.stop="closeDialogs" :class="{'child-dialog-is-visible': promptPackPickerIsVisible}" ref="dialog")
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
        button(@click.left.stop="toggleEditPromptsIsVisible" :class="{ active: editPromptsIsVisible }")
          span Edit

  section(v-if="editPromptsIsVisible")
    .row
      .button-wrap
        button(@click.left.stop="togglePromptPackPickerIsVisible" :class="{ active: promptPackPickerIsVisible }" ref="promptButton")
          img.icon(src="@/assets/add.svg")
          span Prompts
        PromptPackPicker(:visible="promptPackPickerIsVisible" :position="promptPickerPosition" @closeDialog="closeDialogs" @select="togglePromptPack")
      button(@click.left="addCustomPrompt")
        img.icon(src="@/assets/add.svg")
        span Custom

    //- TODO display loader here if fetching user questions
    Prompt(v-if="editPromptsIsVisible" v-for="prompt in userPrompts" :prompt="prompt" :key="prompt.id" @showPicker="togglePromptPackPickerIsVisible")
</template>

<script>
import moonphase from '@/moonphase.js'
import Prompt from '@/components/Prompt.vue'
import PromptPackPicker from '@/components/dialogs/PromptPackPicker.vue'

import nanoid from 'nanoid'
import last from 'lodash-es/last'

export default {
  name: 'AddSpace',
  components: {
    Prompt,
    PromptPackPicker
  },
  props: {
    visible: Boolean
  },
  mounted () {
    this.moonPhase = moonphase()
  },
  data () {
    return {
      moonPhase: {},
      url: `${window.location.origin}/daily`,
      editPromptsIsVisible: false,
      dailyUrlIsVisible: false,
      urlIsCopied: false,
      promptPackPickerIsVisible: false,
      promptPickerPosition: {
        left: 80,
        top: 5
      }
    }
  },
  computed: {
    userPrompts () { return this.$store.state.currentUser.journalPrompts }
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
      this.$emit('closeDialog')
      window.scrollTo(0, 0)
      console.log('moonphase', this.moonPhase.emoji, this.moonPhase)
      // 🍄 create the space here
      // TODO make the space creation part work like import example ^
      this.$emit('updateSpaces')
    },

    toggleEditPromptsIsVisible () {
      this.editPromptsIsVisible = !this.editPromptsIsVisible
    },
    toggleDailyUrlIsVisible () {
      this.dailyUrlIsVisible = !this.dailyUrlIsVisible
    },
    togglePromptPackPickerIsVisible () {
      this.promptPackPickerIsVisible = !this.promptPackPickerIsVisible
    },
    closeAll () {
      this.editPromptsIsVisible = false
      this.dailyUrlIsVisible = false
      this.urlIsCopied = false
      this.promptPackPickerIsVisible = false
    },
    closeDialogs () {
      this.promptPackPickerIsVisible = false
    },
    copyUrl () {
      const element = this.$refs.url
      element.select()
      element.setSelectionRange(0, 99999) // for mobile
      document.execCommand('copy')
      this.urlIsCopied = true
    },
    addCustomPrompt () {
      const emptyPrompt = { id: nanoid(), name: '' }
      this.$store.dispatch('currentUser/addJournalPrompt', emptyPrompt)
      this.$nextTick(() => {
        const textareas = document.querySelectorAll('.add-space textarea')
        last(textareas).focus()
      })
    },
    addPromptPack (pack) {
      const promptPack = { id: nanoid(), isPack: true, name: pack.name }
      this.$store.dispatch('currentUser/addJournalPrompt', promptPack)
    },
    togglePromptPack (pack) {
      const userPack = this.userPrompts.find(prompt => {
        const isPack = prompt.isPack
        const isPackName = prompt.name === pack.name
        return isPack && isPackName
      })
      if (userPack) {
        this.$store.dispatch('currentUser/removeJournalPrompt', userPack)
      } else {
        this.addPromptPack(pack)
      }
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
</style>
