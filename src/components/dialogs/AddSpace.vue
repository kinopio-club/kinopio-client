<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import JournalPrompt from '@/components/JournalPrompt.vue'
import moonphase from '@/moonphase.js'
import MoonPhase from '@/components/MoonPhase.vue'
import Weather from '@/components/Weather.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'

import last from 'lodash-es/last'
import { nanoid } from 'nanoid'

const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    }
  })
})

const emit = defineEmits(['closeDialogs', 'addJournalSpace', 'addSpace'])

const props = defineProps({
  visible: Boolean,
  shouldAddSpaceDirectly: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  closeAll()
  shouldHideFooter(false)
  if (value) {
    state.moonPhase = moonphase()
    checkIfUserHasInboxSpace()
    store.commit('shouldExplicitlyHideFooter', true)
    updateDialogHeight()
  } else {
    store.commit('shouldExplicitlyHideFooter', false)
  }
})

const state = reactive({
  moonPhase: {},
  editPromptsIsVisible: false,
  urlIsCopied: false,
  screenIsShort: false,
  dialogHeight: null,
  hasInboxSpace: true
})

const currentUserId = computed(() => store.state.currentUser.id)
const closeAll = () => {
  state.editPromptsIsVisible = false
  state.urlIsCopied = false
}

// styles

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}
const showScreenIsShort = (value) => {
  state.screenIsShort = true
  shouldHideFooter(true)
  updateDialogHeight()
}
const shouldHideFooter = (value) => {
  store.commit('shouldExplicitlyHideFooter', value)
}

// space

const addSpace = () => {
  store.commit('isLoadingSpace', true)
  const noUserSpaces = !cache.getAllSpaces().length
  window.scrollTo(0, 0)
  if (noUserSpaces) {
    window.location.href = '/'
  } else {
    emit('closeDialogs')
    emit('addSpace')
  }
  if (props.shouldAddSpaceDirectly) {
    store.dispatch('closeAllDialogs')
    store.dispatch('currentSpace/addSpace')
    store.commit('triggerSpaceDetailsInfoIsVisible')
  }
}
const addInboxSpace = () => {
  store.commit('isLoadingSpace', true)
  store.dispatch('closeAllDialogs')
  window.scrollTo(0, 0)
  store.dispatch('currentSpace/addInboxSpace')
}

// journal

const addJournalSpace = () => {
  store.commit('isLoadingSpace', true)
  emit('closeDialogs')
  window.scrollTo(0, 0)
  emit('addJournalSpace')
  if (props.shouldAddSpaceDirectly) {
    store.dispatch('closeAllDialogs')
    store.dispatch('currentSpace/loadJournalSpace')
    store.commit('triggerSpaceDetailsInfoIsVisible')
  }
}
const shouldCreateJournalsWithDailyPrompt = computed(() => {
  return store.state.currentUser.shouldCreateJournalsWithDailyPrompt
})
const dailyPrompt = computed(() => {
  return store.state.currentUser.journalDailyPrompt
})

const toggleShouldCreateJournalsWithDailyPrompt = () => {
  const value = !shouldCreateJournalsWithDailyPrompt.value
  store.dispatch('currentUser/update', { shouldCreateJournalsWithDailyPrompt: value })
}
const toggleEditPromptsIsVisible = () => {
  const value = !state.editPromptsIsVisible
  closeAll()
  state.editPromptsIsVisible = value
  updateDialogHeight()
}
const userPrompts = computed(() => {
  let prompts = store.state.currentUser.journalPrompts
  return prompts
})
const addCustomPrompt = async () => {
  const emptyPrompt = { id: nanoid(), name: '', userId: currentUserId.value }
  store.dispatch('currentUser/addJournalPrompt', emptyPrompt)
  await nextTick()
  const textareas = document.querySelectorAll('.add-space textarea')
  last(textareas).focus()
}

// inbox space

const checkIfUserHasInboxSpace = async () => {
  const inboxSpace = await store.dispatch('currentUser/inboxSpace')
  state.hasInboxSpace = Boolean(inboxSpace)
}

// templates, import

const triggerTemplatesIsVisible = () => {
  closeAll()
  store.dispatch('closeAllDialogs')
  store.commit('triggerTemplatesIsVisible')
}
const triggerImportIsVisible = () => {
  closeAll()
  store.dispatch('closeAllDialogs')
  store.commit('triggerImportIsVisible')
}

</script>

<template lang="pug">
dialog.add-space.narrow(
  v-if="visible"
  :open="visible"
  @touchend.stop
  @click.left.stop
  :class="{'short': state.screenIsShort}"
  ref="dialog"
  :style="{'max-height': state.dialogHeight + 'px'}"
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
          MoonPhase(:moonPhase="state.moonPhase.name")
          span Journal
        button(@click.left.stop="toggleEditPromptsIsVisible" :class="{ active: state.editPromptsIsVisible }")
          img.icon.down-arrow.button-down-arrow(src="@/assets/down-arrow.svg")

    //- Journal Settings
    template(v-if="state.editPromptsIsVisible")
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
  section(v-if="!state.hasInboxSpace")
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
