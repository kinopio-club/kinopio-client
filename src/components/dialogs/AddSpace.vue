<template lang="pug">
dialog.add-space.narrow(
  v-if="visible"
  :open="visible"
  @touchend.stop
  @click.left.stop="closeDialogs"
  :class="{'child-dialog-is-visible': promptPackPickerIsVisible, 'short': screenIsShort}"
  ref="dialog"
  :style="{'max-height': dialogHeight + 'px'}"
)
  section
    .row
      button(@click="addSpace")
        img.icon(src="@/assets/add.svg")
        span New Space
    .row
      .segmented-buttons
        button(@click="addJournalSpace")
          img.icon(src="@/assets/add.svg")
          MoonPhase(:moonPhase="moonPhase.name")
          span Journal
        button(@click.left.stop="toggleEditPromptsIsVisible" :class="{ active: editPromptsIsVisible }")
          span Edit

  section.edit-section(v-if="editPromptsIsVisible")
    .row
      .button-wrap
        button(@click.left.stop="togglePromptPackPickerIsVisible" :class="{ active: promptPackPickerIsVisible }" ref="promptButton")
          img.icon(src="@/assets/add.svg")
          span Prompts
        PromptPackPicker(:visible="promptPackPickerIsVisible" :position="promptPickerPosition" @closeDialog="closeDialogs" @select="togglePromptPack")
      button(@click.left="addCustomPrompt")
        img.icon(src="@/assets/add.svg")
        span Custom

    Prompt(v-if="editPromptsIsVisible" v-for="prompt in userPrompts" :prompt="prompt" :key="prompt.id" @showPicker="togglePromptPackPickerIsVisible" @showScreenIsShort="showScreenIsShort")

  //- section(v-if="editPromptsIsVisible")
  //-   .row
  //-     a(href="#")
  //-       button Help →
  //-  suggest prompts -> contact (👀 templates)
</template>

<script>
import Prompt from '@/components/Prompt.vue'
import PromptPackPicker from '@/components/dialogs/PromptPackPicker.vue'
import moonphase from '@/moonphase.js'
import MoonPhase from '@/components/MoonPhase.vue'
import utils from '@/utils.js'

import last from 'lodash-es/last'
import nanoid from 'nanoid'

export default {
  name: 'AddSpace',
  components: {
    Prompt,
    PromptPackPicker,
    MoonPhase
  },
  props: {
    visible: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
      }
    })
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
      },
      screenIsShort: false,
      dialogHeight: null
    }
  },
  computed: {
    userPrompts () { return this.$store.state.currentUser.journalPrompts },
    currentUserId () { return this.$store.state.currentUser.id }
  },
  methods: {
    showScreenIsShort (value) {
      this.screenIsShort = true
      this.shouldHideFooter(true)
    },
    shouldHideFooter (value) {
      this.$store.commit('shouldExplicitlyHideFooter', value)
    },
    addJournalSpace () {
      this.$emit('closeDialog')
      window.scrollTo(0, 0)
      this.$store.dispatch('currentSpace/addNewJournalSpace')
      this.$emit('updateSpaces')
      this.$store.dispatch('currentSpace/updateSpacePageSize')
      this.$store.commit('triggerFocusSpaceDetailsName')
    },
    addSpace () {
      this.$emit('closeDialog')
      window.scrollTo(0, 0)
      this.$store.dispatch('currentSpace/addSpace')
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
      this.screenIsShort = false
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
      const emptyPrompt = { id: nanoid(), name: '', userId: this.currentUserId }
      this.$store.dispatch('currentUser/addJournalPrompt', emptyPrompt)
      this.$nextTick(() => {
        const textareas = document.querySelectorAll('.add-space textarea')
        last(textareas).focus()
      })
    },
    addPromptPack (pack) {
      const promptPack = { id: nanoid(), name: pack.name, packId: pack.packId, userId: this.currentUserId }
      this.$store.dispatch('currentUser/addJournalPrompt', promptPack)
    },
    togglePromptPack (pack) {
      const userPack = this.userPrompts.find(userPrompt => {
        if (!userPrompt.packId) { return }
        return pack.packId === userPrompt.packId.toString()
      })
      if (userPack) {
        this.$store.dispatch('currentUser/removeJournalPrompt', userPack)
      } else {
        this.addPromptPack(pack)
      }
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
      this.closeAll()
      this.shouldHideFooter(false)
      this.updateDialogHeight()
    }
  }
}
</script>

<style lang="stylus">
.add-space
  &.short
    top -68px !important
    .edit-section
      max-height 205px
      overflow scroll

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
