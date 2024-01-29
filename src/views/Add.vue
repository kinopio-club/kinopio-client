<script setup>
import { reactive, computed, onMounted, onUnmounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import inboxSpace from '@/data/inbox.json'
import Loader from '@/components/Loader.vue'
import User from '@/components/User.vue'
import ResultsFilter from '@/components/ResultsFilter.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'
import consts from '@/consts.js'
import postMessage from '@/postMessage.js'

import { nanoid } from 'nanoid'
const store = useStore()

const state = reactive({
  email: '',
  password: '',
  loading: {
    signIn: false,
    updateSpaces: false
  },
  error: {
    unknownServerError: false,
    // sign in
    tooManyAttempts: false,
    signInCredentials: false,
    maxLength: false
  },
  success: false,
  newName: '',
  keyboardShortcutTipIsVisible: false,
  selectedSpaceId: 'inbox',
  spaces: [],
  filterIsVisible: false,
  filteredSpaces: []
})

const textareaElement = ref(null)

// init

window.addEventListener('message', (event) => {
  console.log('🛫 add page: received postmessage', event)
  restoreValue(event.data)
})

onMounted(() => {
  initUser()
  initCardTextarea()
  updateSpaces()
  restoreValue()
})

onBeforeUnmount(() => {
  cache.clearPrevAddPageValue()
})

const isOffline = computed(() => !store.state.isOnline)
const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])
const kinopioDomain = computed(() => consts.kinopioDomain())
const cardsCreatedIsOverLimit = computed(() => store.getters['currentUser/cardsCreatedIsOverLimit'])
const maxCardLength = computed(() => consts.maxCardLength)
const currentUser = computed(() => store.state.currentUser)
const isAddPage = computed(() => store.state.isAddPage)
const inboxUrl = computed(() => `${consts.kinopioDomain()}/inbox`)
const selectedSpaceUrl = computed(() => `${consts.kinopioDomain()}/${state.selectedSpaceId}`)
const textareaPlaceholder = computed(() => 'Add cards by typing here, or paste a URL')
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
  store.dispatch('currentUser/init')
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

// postmesage

const restoreValue = async (value) => {
  await nextTick()
  value = value || cache.prevAddPageValue()
  state.newName = value
  console.log('🏬 restored value', value)
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
  const response = await store.dispatch('api/signIn', { email, password })
  const result = await response.json()
  state.loading.signIn = false
  if (isSuccess(response)) {
    store.commit('currentUser/updateUser', result)
    initUser()
  } else {
    handleSignInErrors(result)
  }
}

// spaces

const updateSpaces = () => {
  try {
    state.loading.updateSpaces = true
    updateSpacesLocal()
    updateSpacesRemote()
  } catch (error) {
    console.error('🚒', error)
  }
  state.loading.updateSpaces = false
}
const updateSpacesLocal = () => {
  let spaces = cache.getAllSpaces()
  spaces = spaces.filter(space => space.name !== 'Inbox')
  state.spaces = spaces
}
const updateSpacesRemote = async () => {
  let spaces = await store.dispatch('api/getUserSpaces')
  if (!spaces) { return }
  spaces = spaces.filter(space => space.name !== 'Inbox')
  state.spaces = spaces
}
const filteredSpaces = computed(() => {
  if (state.filteredSpaces.length) {
    return state.filteredSpaces
  } else {
    return state.spaces
  }
})

// card

const addCard = async () => {
  clearErrorsAndSuccess()
  if (state.cardsCreatedIsOverLimit) { return }
  if (state.error.maxLength) { return }
  if (!state.newName) { return }
  // show completion immediately, assume success
  let newName = state.newName
  state.success = true
  state.newName = ''
  textareaElement.value.style.height = 'initial'
  focusAndSelectName()
  const url = utils.urlFromString(newName)
  // create card
  let card = {
    id: nanoid(),
    name: newName,
    z: 1
  }
  if (url) {
    card.urlPreviewUrl = url
    card.shouldUpdateUrlPreview = true
  }
  let space
  try {
    const user = store.state.currentUser
    card.userId = user.id
    let spaceId
    // save to inbox
    if (state.selectedSpaceId === 'inbox') {
      console.log('🛫 create card in inbox space', card)
      store.dispatch('api/addToQueue', { name: 'createCardInInbox', body: card })
    // save to space
    } else {
      spaceId = state.selectedSpaceId
      card.spaceId = spaceId
      console.log('🛫 create card in space', card, state.selectedSpaceId)
      store.dispatch('api/addToQueue', { name: 'createCard', body: card, spaceId })
    }
    space = { id: spaceId }
  } catch (error) {
    console.error('🚒 addCard', error)
    state.error.unknownServerError = true
  }
  addCardToSpaceLocal(card, space)
  postMessage.send({ name: 'addCardFromAddPage', value: card })
  postMessage.send({ name: 'onAdded', value: true })
}
const addCardToSpaceLocal = (card, space) => {
  space = cache.space(space.id)
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
  if (state.newName.length >= consts.maxCardLength - 1) {
    state.error.maxLength = true
  } else {
    state.error.maxLength = false
  }
}

// textarea

const updateTextareaSize = () => {
  if (!textareaElement.value) { return }
  let modifier = 0
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

// space filter

const filterPlaceholder = computed(() => 'Filter Spaces')
const toggleFilterIsVisible = async () => {
  const value = !state.filterIsVisible
  state.filterIsVisible = value
  if (value) {
    await nextTick()
    store.commit('triggerFocusResultsFilter')
  } else {
    clearFilter()
  }
}
const updateFilteredItems = (spaces) => {
  state.filteredSpaces = spaces
}
const clearFilter = () => {
  state.filteredSpaces = []
}
</script>

<template lang="pug">
main.add-page
  .add-form(v-if="currentUserIsSignedIn")
    section
      .row(v-if="cardsCreatedIsOverLimit || state.error.unknownServerError || state.error.maxLength")
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
            :maxlength="maxCardLength"
            @keydown.enter.exact.prevent="addCard"
            @focusin="updateKeyboardShortcutTipIsVisible(true)"
            @focusout="updateKeyboardShortcutTipIsVisible(false)"
            @keyup.alt.enter.exact.stop
            @keyup.ctrl.enter.exact.stop
            @keydown.alt.enter.exact.stop="insertLineBreak"
            @keydown.ctrl.enter.exact.stop="insertLineBreak"
            @touchend="focusName"
          )
      //- space picker
      ResultsFilter(
        v-if="state.filterIsVisible"
        :showFilter="state.filterIsVisible"
        :placeholder="filterPlaceholder"
        :isLoading="state.loading.updateSpaces"
        :items="state.spaces"
        @updateFilteredItems="updateFilteredItems"
        @clearFilter="clearFilter"
      )
      .row
        .segmented-buttons
          button(@click='toggleFilterIsVisible' :class="{ active: state.filterIsVisible }")
            img.icon.search(src="@/assets/search.svg")
          select(name="spaces" v-model="state.selectedSpaceId")
            option(value="inbox" default) Inbox
            template(v-for="space in filteredSpaces")
              option(:value="space.id") {{space.name}}
        Loader(:visible="state.loading.updateSpaces")
      //- submit
      .row
        .button-wrap
          button.success(@pointerup="addCard" :class="{disabled: state.error.maxLength}")
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
