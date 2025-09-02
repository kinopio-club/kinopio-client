<script setup>
import { reactive, computed, onMounted, onUnmounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'

import inboxSpace from '@/data/inbox.json'
import Loader from '@/components/Loader.vue'
import User from '@/components/User.vue'
import ResultsFilter from '@/components/ResultsFilter.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'
import consts from '@/consts.js'
import postMessage from '@/postMessage.js'

import { nanoid } from 'nanoid'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()

if (consts.isDevelopment()) {
  window.userStore = useUserStore()
}

const state = reactive({
  email: '',
  password: '',
  loading: {
    signIn: false
  },
  error: {
    unknownServerError: false,
    // sign in
    tooManyAttempts: false,
    signInCredentials: false,
    maxLength: false,
    isMissingInboxSpace: false
  },
  success: false,
  newName: '',
  keyboardShortcutTipIsVisible: false
})

const textareaElement = ref(null)

// init

window.addEventListener('message', (event) => {
  console.info('🛫 add page: received postmessage', event)
  restoreValue(event.data)
})

onMounted(async () => {
  await initUser()
  initCardTextarea()
  restoreValue()
  checkIsMissingInboxSpace()
})

onBeforeUnmount(() => {
  cache.clearPrevAddPageValue()
})

const isOffline = computed(() => !globalStore.isOnline)
const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)
const kinopioDomain = computed(() => consts.kinopioDomain())
const cardsCreatedIsOverLimit = computed(() => userStore.getUserCardsCreatedIsOverLimit)
const maxCardCharacterLimit = computed(() => consts.cardCharacterLimit)
const currentUser = computed(() => userStore.getUserAllState)
const isAddPage = computed(() => globalStore.isAddPage)
const inboxUrl = computed(() => `${consts.kinopioDomain()}/inbox`)
// const selectedSpaceUrl = computed(() => `${consts.kinopioDomain()}/${state.selectedSpaceId}`)
const textareaPlaceholder = computed(() => 'Add cards to Inbox by typing here, or paste a URL')
const name = computed({
  get () {
    return state.newName
  },
  set (newName) {
    state.newName = newName
    updateTextareaSize()
    clearErrorsAndSuccess()
    updateMaxLengthError()
  }
})
const initUser = async () => {
  await userStore.initializeUser()
}
const initCardTextarea = async () => {
  await nextTick()
  focusAndSelectName()
}
const focusName = () => {
  const element = textareaElement.value
  if (!element) { return }
  element.focus()
}
const focusAndSelectName = () => {
  if (utils.isMobile()) { return }
  const element = textareaElement.value
  if (!element) { return }
  const length = element.value.length
  focusName()
  if (length) {
    element.setSelectionRange(0, length)
  }
}
const checkIsMissingInboxSpace = async () => {
  if (!currentUserIsSignedIn.value) { return }
  try {
    await apiStore.getUserInboxSpace()
    state.error.isMissingInboxSpace = false
  } catch (error) {
    console.error('🚒 checkIsMissingInboxSpace', error)
    state.error.isMissingInboxSpace = true
  }
}

// postmesage

const restoreValue = async (value) => {
  await nextTick()
  value = value || await cache.prevAddPageValue()
  state.newName = value
  console.info('🏬 restored value', value)
  await nextTick()
  updateTextareaSize()
  focusAndSelectName()
  updateMaxLengthError()
}

// sign in

const isSuccess = (response) => {
  const success = [200, 201, 202, 204]
  return Boolean(success.includes(response.status))
}
const handleSignInErrors = (response) => {
  state.loading.signIn = false
  state.error.signInCredentials = false
  state.error.tooManyAttempts = false
  state.error.unknownServerError = false
  if (!response) {
    state.error.unknownServerError = true
    return
  }
  if (response.status === 401) {
    state.error.signInCredentials = true
  } else if (response.status === 429) {
    state.error.tooManyAttempts = true
  } else {
    state.error.unknownServerError = true
  }
}
const signIn = async (event) => {
  if (state.loading.signIn) { return }
  const email = event.target[0].value.toLowerCase()
  const password = event.target[1].value
  state.loading.signIn = true
  const response = await apiStore.signIn({ email, password })
  const result = await response.json()
  if (isSuccess(response)) {
    await userStore.updateUserState(result)
    await userStore.initializeUserState(result)
    checkIsMissingInboxSpace()
  } else {
    handleSignInErrors(result)
  }
  state.loading.signIn = false
}

// card

const addCard = async () => {
  clearErrorsAndSuccess()
  if (state.cardsCreatedIsOverLimit) { return }
  if (state.error.maxLength) { return }
  if (!state.newName) { return }
  try {
    const newName = state.newName
    state.success = true
    state.newName = ''
    textareaElement.value.style.height = 'initial'
    focusAndSelectName()
    // create card
    const user = userStore.getUserAllState
    const card = {
      id: nanoid(),
      name: newName,
      z: 1,
      userId: user.id
    }
    const url = utils.urlFromString(newName)
    if (url) {
      card.urlPreviewUrl = url
      card.shouldUpdateUrlPreview = true
    }
    // save card
    addCardToSpaceLocal(card)
    postMessage.send({ name: 'addCardFromAddPage', value: card })
    postMessage.send({ name: 'onAdded', value: true })
    console.info('🛫 create card in inbox space', card)
    await apiStore.createCardInInbox(card) // show completion immediately, assume success
  } catch (error) {
    console.error('🚒 addCard', error)
    state.error.unknownServerError = true
  }
}
const addCardToSpaceLocal = async (card) => {
  const space = await cache.getInboxSpace()
  if (!space) { return }
  if (!space.cards) { return }
  const cards = space.cards.push(card)
  cache.updateSpace('cards', cards, space.id)
}

// input handlers

const updateKeyboardShortcutTipIsVisible = (value) => {
  state.keyboardShortcutTipIsVisible = value
}
const clearErrors = () => {
  state.error.unknownServerError = false
  state.error.signInCredentials = false
  state.error.tooManyAttempts = false
}
const clearErrorsAndSuccess = () => {
  state.error.unknownServerError = false
  state.success = false
}
const updateMaxLengthError = () => {
  if (state.newName.length >= consts.cardCharacterLimit - 1) {
    state.error.maxLength = true
  } else {
    state.error.maxLength = false
  }
}

// textarea

const updateTextareaSize = () => {
  if (!textareaElement.value) { return }
  const modifier = 0
  textareaElement.value.style.height = textareaElement.value.scrollHeight + modifier + 'px'
}
const insertLineBreak = async (event) => {
  const position = textareaElement.value.selectionEnd
  const name = state.newName
  const newName = name.substring(0, position) + '\n' + name.substring(position)
  setTimeout(() => {
    textareaElement.value.setSelectionRange(position + 1, position + 1)
  })
  state.newName = newName
  await nextTick()
  updateTextareaSize()
}
</script>

<template lang="pug">
main.add-page
  .add-form(v-if="currentUserIsSignedIn")
    section
      .row(v-if="cardsCreatedIsOverLimit || state.error.unknownServerError || state.error.maxLength || state.error.isMissingInboxSpace")
        //- error: card limit
        template(v-if="cardsCreatedIsOverLimit")
          a(:href="kinopioDomain" v-if="isAddPage")
            .badge.danger.button-badge
              span Upgrade for more{{' '}}
              img.icon.visit(src="@/assets/visit.svg")
          .badge.danger(v-else)
            span Upgrade for more cards
        //- error: connection
        .badge.danger(v-if="state.error.unknownServerError || state.error.maxLength") (シ_ _)シ Server error
        .badge.danger(v-if="state.error.isMissingInboxSpace") Could not find space named Inbox
      //- textarea
      .row
        User(:user="currentUser" :isClickable="false" :hideYouLabel="true")
        .textarea-wrap
          textarea.name(
            name="cardName"
            ref="textareaElement"
            rows="1"
            :placeholder="textareaPlaceholder"
            v-model="name"
            :maxlength="maxCardCharacterLimit"
            @keydown.enter.exact.prevent="addCard"
            @focusin="updateKeyboardShortcutTipIsVisible(true)"
            @focusout="updateKeyboardShortcutTipIsVisible(false)"
            @keyup.alt.enter.exact.stop
            @keyup.ctrl.enter.exact.stop
            @keydown.alt.enter.exact.stop="insertLineBreak"
            @keydown.ctrl.enter.exact.stop="insertLineBreak"
            @touchend="focusName"
          )
      //- buttons
      .row
        .button-wrap
          a(:href="inboxUrl")
            button(:disabled="state.error.isMissingInboxSpace")
              img.icon.inbox-icon(src="@/assets/inbox.svg")
              span Inbox
        .button-wrap
          button.success(@pointerup="addCard" :disabled="state.error.maxLength || state.error.isMissingInboxSpace")
            img.icon.add-icon(src="@/assets/add.svg")
            span Add
          .badge.label-badge.enter-badge(v-if="state.keyboardShortcutTipIsVisible")
            span Enter
      Transition(name="fadeIn")
        .row(v-if="state.success")
          .badge.success
            span Added to space
      .row(v-if="isOffline")
        .badge.info
          img.icon.offline(src="@/assets/offline.svg")
          span Offline
        span New cards will be saved locally, and sync-ed up once you're back online

  //- sign in
  section(v-if="!currentUserIsSignedIn")
    .row
      p Sign In to Use Kinopio
    form(@submit.prevent="signIn")
      input(name="email" type="email" placeholder="Email" required v-model="state.email" @input="clearErrors")
      input(name="password" type="password" placeholder="Password" required v-model="state.password" @input="clearErrors")
      .row
        button(type="submit" :class="{active : state.loading.signIn}")
          span Sign In
          Loader(:visible="state.loading.signIn")
      .row
        .badge.danger(v-if="state.error.unknownServerError") (シ_ _)シ Server error
        .badge.danger(v-if="state.error.signInCredentials") Incorrect email or password
        .badge.danger(v-if="state.error.tooManyAttempts") Too many attempts, try again in 10 minutes
</template>

<style lang="stylus">
*
  font-size 16px

main.add-page
  padding 8px
  min-height 100vh
  height 100%
  margin-top 6px
  margin-bottom 2rem
  background var(--primary-background)
  section
    position relative
    display block
  .loader
    margin-left 5px
  a
    color var(--primary)
    text-decoration none

  // sign in

  .sign-in
    background var(--secondary-background)
    form
      margin-top 10px
    input
      margin-bottom 10px
    button
      margin 0

  .row
    margin-bottom 12px
    display flex
    > input
      margin-bottom 0

  .button-wrap + .button-wrap
    margin-left 6px

  // add card

  .add-form
    position relative
    display block
    section
      &.row
        justify-content space-between
    .title-row-flex
      .title
        color var(--primary)

    .enter-badge
      position absolute
      display inline-block
      vertical-align 0
      bottom -14px
      left 6px

    .textarea-wrap
      margin-top 3px
      margin-left 6px
      width 100%
      textarea
        margin 0
        min-height 18px

    .button-wrap + .button-wrap
      margin-left 6px

    .badge
      display inline-block

    .segmented-buttons
      width 100%
    select
      width calc(100% - 30px)

  .inbox-icon,
  .add-icon
    vertical-align 1px
    margin 0

.app
  overflow initial
.title-row-flex
  display flex
  justify-content space-between
  align-items center

</style>
