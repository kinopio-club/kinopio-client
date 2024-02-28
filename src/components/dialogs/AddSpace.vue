<template lang="pug">
dialog.add-space.narrow(
  v-if="visible"
  :open="visible"
  @touchend.stop
  @click.left.stop
  :class="{'short': screenIsShort}"
  ref="dialog"
  :style="{'max-height': dialogHeight + 'px'}"
)
  section
    .row
      //- Add Space
      .segmented-buttons
        button.success(@click="addSpace")
          img.icon(src="@/assets/add.svg")
          span New Space

    //- Add Journal
    .row
      .segmented-buttons
        button(@click="addJournalSpace")
          img.icon(src="@/assets/add.svg")
          MoonPhase(:moonPhase="moonPhase.name")
          span Journal
        button(@click.left.stop="toggleEditPromptsIsVisible" :class="{ active: editPromptsIsVisible }")
          img.icon.down-arrow.button-down-arrow(src="@/assets/down-arrow.svg")

    //- Journal Settings
    template(v-if="editPromptsIsVisible")
      //- weather
      section.subsection
        Weather
      //- daily prompt
      section.subsection
        .row.daily-prompt-row
          .button-wrap
            button(@click.left.prevent="toggleShouldCreateJournalsWithDailyPrompt" @keydown.stop.enter="toggleShouldCreateJournalsWithDailyPrompt" :class="{ active: shouldCreateJournalsWithDailyPrompt }")
              img.icon.today(src="@/assets/today.svg")
              span Prompt of the Day
        .row(v-if="shouldCreateJournalsWithDailyPrompt")
          p {{dailyPrompt}}
      //- prompts
      section.subsection
        JournalPrompt(v-for="prompt in userPrompts" :prompt="prompt" :key="prompt.id" @showScreenIsShort="showScreenIsShort")
        //- add prompt
        .row
          button(@click.left="addCustomPrompt")
            img.icon(src="@/assets/add.svg")
            span Prompt

  //- Inbox
  section(v-if="!hasInboxSpace")
    button(@click="addInboxSpace")
      img.icon(src="@/assets/add.svg")
      img.icon.inbox-icon(src="@/assets/inbox.svg")
      span Inbox
    p For collecting ideas to figure out later

  //- Templates
  section
    .row
      .button-wrap
        button(@click="triggerTemplatesIsVisible")
          img.icon.templates(src="@/assets/templates.svg")
          span Templates
      .button-wrap
        button(@click="triggerImportIsVisible") Import
</template>

<script>
import JournalPrompt from '@/components/JournalPrompt.vue'
import moonphase from '@/moonphase.js'
import MoonPhase from '@/components/MoonPhase.vue'
import Weather from '@/components/Weather.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'

import last from 'lodash-es/last'
import { nanoid } from 'nanoid'

export default {
  name: 'AddSpace',
  components: {
    JournalPrompt,
    MoonPhase,
    Weather
  },
  props: {
    visible: Boolean,
    shouldAddSpaceDirectly: Boolean
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
      editPromptsIsVisible: false,
      urlIsCopied: false,
      screenIsShort: false,
      dialogHeight: null,
      hasInboxSpace: true
    }
  },
  computed: {
    userPrompts () {
      let prompts = this.$store.state.currentUser.journalPrompts
      return prompts
    },
    currentUserId () { return this.$store.state.currentUser.id },
    shouldCreateJournalsWithDailyPrompt () {
      return this.$store.state.currentUser.shouldCreateJournalsWithDailyPrompt
    },
    dailyPrompt () {
      return this.$store.state.currentUser.journalDailyPrompt
    }
  },
  methods: {
    toggleShouldCreateJournalsWithDailyPrompt () {
      const value = !this.shouldCreateJournalsWithDailyPrompt
      this.$store.dispatch('currentUser/update', { shouldCreateJournalsWithDailyPrompt: value })
    },
    showScreenIsShort (value) {
      this.screenIsShort = true
      this.shouldHideFooter(true)
      this.updateDialogHeight()
    },
    shouldHideFooter (value) {
      this.$store.commit('shouldExplicitlyHideFooter', value)
    },
    addJournalSpace () {
      this.$store.commit('isLoadingSpace', true)
      this.$emit('closeDialogs')
      window.scrollTo(0, 0)
      this.$emit('addJournalSpace')
      if (this.shouldAddSpaceDirectly) {
        this.$store.dispatch('closeAllDialogs')
        this.$store.dispatch('currentSpace/loadJournalSpace')
        this.$store.commit('triggerSpaceDetailsInfoIsVisible')
      }
    },
    addSpace () {
      this.$store.commit('isLoadingSpace', true)
      const noUserSpaces = !cache.getAllSpaces().length
      window.scrollTo(0, 0)
      if (noUserSpaces) {
        window.location.href = '/'
      } else {
        this.$emit('closeDialogs')
        this.$emit('addSpace')
      }
      if (this.shouldAddSpaceDirectly) {
        this.$store.dispatch('closeAllDialogs')
        this.$store.dispatch('currentSpace/addSpace')
        this.$store.commit('triggerSpaceDetailsInfoIsVisible')
      }
    },
    addInboxSpace () {
      this.$store.commit('isLoadingSpace', true)
      this.$store.dispatch('closeAllDialogs')
      window.scrollTo(0, 0)
      this.$store.dispatch('currentSpace/addInboxSpace')
    },
    toggleEditPromptsIsVisible () {
      const value = !this.editPromptsIsVisible
      this.closeAll()
      this.editPromptsIsVisible = value
      this.updateDialogHeight()
    },
    closeAll () {
      this.editPromptsIsVisible = false
      this.urlIsCopied = false
    },
    addCustomPrompt () {
      const emptyPrompt = { id: nanoid(), name: '', userId: this.currentUserId }
      this.$store.dispatch('currentUser/addJournalPrompt', emptyPrompt)
      this.$nextTick(() => {
        const textareas = document.querySelectorAll('.add-space textarea')
        last(textareas).focus()
      })
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    },
    triggerTemplatesIsVisible () {
      this.closeAll()
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('triggerTemplatesIsVisible')
    },
    triggerImportIsVisible () {
      this.closeAll()
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('triggerImportIsVisible')
    },
    async checkIfUserHasInboxSpace () {
      const inboxSpace = await this.$store.dispatch('currentUser/inboxSpace')
      this.hasInboxSpace = Boolean(inboxSpace)
    }
  },
  watch: {
    visible (visible) {
      this.closeAll()
      this.shouldHideFooter(false)
      this.updateDialogHeight()
      if (visible) {
        this.checkIfUserHasInboxSpace()
        this.$store.commit('shouldExplicitlyHideFooter', true)
      } else {
        this.$store.commit('shouldExplicitlyHideFooter', false)
      }
    }
  }
}
</script>

<style lang="stylus">
.add-space
  overflow auto
  max-height calc(100vh - 230px)
  &.short
    top -68px !important
  .inbox-icon
    margin 0
    margin-left 5px
  .daily-prompt-row
    justify-content space-between
</style>
