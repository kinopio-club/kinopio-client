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
          MoonPhase(:moonPhase="moonPhase.name")
          span Journal
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
import promptPacks from '@/data/promptPacks.json'
import Prompt from '@/components/Prompt.vue'
import PromptPackPicker from '@/components/dialogs/PromptPackPicker.vue'
import moonphase from '@/moonphase.js'
import MoonPhase from '@/components/MoonPhase.vue'
import utils from '@/utils.js'

import last from 'lodash-es/last'
import random from 'lodash-es/random'
import nanoid from 'nanoid'
import dayjs from 'dayjs'

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
    pack (prompt) {
      return promptPacks.find(promptPack => {
        return promptPack.name.includes(prompt.name)
      })
    },
    randomPrompt (pack) {
      let index = random(0, pack.prompts.length - 1)
      return pack.prompts[index]
    },
    tag (pack, cardId, space) {
      const spaceHasTag = space.tags.find(tag => tag.name === pack.name)
      if (spaceHasTag) { return }
      return utils.newTag({
        name: pack.name,
        defaultColor: pack.color,
        cardId: cardId,
        spaceId: space.id
      })
    },
    cardPosition (cards, newCardName) {
      const lastCard = last(cards)
      const lastCardY = lastCard.y
      let lastCardName = lastCard.name.replaceAll('[', '')
      lastCardName = lastCardName.replaceAll(']', '')
      const averageCharactersPerLine = 25
      const lines = Math.ceil(lastCardName.length / averageCharactersPerLine)
      const lineHeight = 14
      const padding = 16
      const lastCardHeight = (lines * lineHeight) + padding + lines
      let distanceBetween = 60
      let x = 100
      if (utils.checkboxFromString(newCardName)) {
        distanceBetween = 12
        x = 120
      }
      const y = lastCardY + lastCardHeight + distanceBetween
      return { x, y }
    },
    addJournalSpace () {
      this.$emit('closeDialog')
      window.scrollTo(0, 0)
      const date = `${dayjs(new Date()).format('dddd MMM D/YY')}` // Thursday Oct 8/20
      const day = `${this.moonPhase.emoji} ${dayjs(new Date()).format('dddd')}` // 🌘 Tuesday
      const spaceId = nanoid()
      let space = utils.emptySpace(spaceId)
      space.name = date
      space.privacy = 'private'
      space.moonPhase = this.moonPhase.name
      space.cards.push({ id: nanoid(), name: day, x: 60, y: 90, frameId: 0 })
      this.userPrompts.forEach(prompt => {
        if (!prompt.name) { return }
        let card = { id: nanoid() }
        if (prompt.isPack) {
          const pack = this.pack(prompt)
          const randomPrompt = this.randomPrompt(pack)
          const tag = this.tag(pack, card.id, space)
          if (tag) { space.tags.push(tag) }
          card.name = `[[${prompt.name}]] ${randomPrompt}`
        } else {
          card.name = prompt.name
        }
        const position = this.cardPosition(space.cards, card.name)
        card.x = position.x
        card.y = position.y
        card.spaceId = spaceId
        space.cards.push(card)
      })
      console.log('🌙 journal space', space)
      this.$store.commit('currentSpace/restoreSpace', space)
      this.$store.dispatch('currentSpace/saveNewSpace')
      this.$store.dispatch('currentUser/lastSpaceId', space.id)
      this.$emit('updateSpaces')
      this.$store.commit('triggerFocusSpaceDetailsName')
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
