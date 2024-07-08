<script setup>
import { reactive, computed, onMounted, onUpdated, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore, mapState, mapGetters } from 'vuex'

import CardOrBoxActions from '@/components/subsections/CardOrBoxActions.vue'
import ImagePicker from '@/components/dialogs/ImagePicker.vue'
import CardTips from '@/components/dialogs/CardTips.vue'
import TagPicker from '@/components/dialogs/TagPicker.vue'
import Tag from '@/components/Tag.vue'
import SpacePicker from '@/components/dialogs/SpacePicker.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'
import Loader from '@/components/Loader.vue'
import UrlPreview from '@/components/UrlPreview.vue'
import MediaPreview from '@/components/MediaPreview.vue'
import CardCollaborationInfo from '@/components/CardCollaborationInfo.vue'
import ShareCard from '@/components/dialogs/ShareCard.vue'
import OtherCardPreview from '@/components/OtherCardPreview.vue'
import OtherSpacePreview from '@/components/OtherSpacePreview.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'

import debounce from 'lodash-es/debounce'
import qs from '@aguezz/qs-parse'
import { nanoid } from 'nanoid'

let prevCardId, prevCardName
let previousTags = []
let compositionEventEndTime = 0

const openingPreDuration = 250 // ms
const openingDuration = 250 // ms
let openingAnimationTimer, openingStartTime, shouldCancelOpening

const store = useStore()

const dialogElement = ref(null)
const nameElement = ref(null)

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerUnloadPage' && visible.value) {
      closeCard()
    } else if (mutation.type === 'triggerSplitCard' && visible.value) {
      const cardId = mutation.payload
      if (cardId !== card.value.id) { return }
      splitCards()
    } else if (mutation.type === 'cardDetailsIsVisibleForCardId') {
      const cardId = mutation.payload
      if (prevCardId) {
        updateDimensions(prevCardId)
      }
      if (!cardId) { return }
      prevCardId = cardId
      showCard(cardId)
    } else if (mutation.type === 'triggerUpdateCardDetailsCardName') {
      const { cardId, name } = mutation.payload
      if (cardId !== card.value.id) { return }
      cancelOpening()
      updateCardName(name)
    }
  })
})

const state = reactive({
  lastSelectionStartPosition: 0,
  imagePickerIsVisible: false,
  cardTipsIsVisible: false,
  initialSearch: '',
  pastedName: '',
  wasPasted: false,
  cursorPosition: 0,
  shouldCancelBracketRight: false,
  insertedLineBreak: false,
  error: {
    signUpToUpload: false,
    sizeLimit: false,
    unknownUploadError: false
  },
  tag: {
    pickerIsVisible: false,
    pickerPosition: {},
    pickerSearch: ''
  },
  space: {
    pickerIsVisible: false,
    pickerPosition: {},
    pickerSearch: ''
  },
  notifiedMembers: false,
  formats: {
    image: '',
    video: '',
    audio: '',
    link: '',
    file: ''
  },
  nameSplitIntoCardsCount: 0,
  isOpening: false,
  openingPercent: 0,
  openingAlpha: 0,
  previousSelectedTag: {},
  currentSearchTag: {},
  newTagColor: '',
  shareCardIsVisible: false
})

const card = computed(() => {
  const cardId = store.state.cardDetailsIsVisibleForCardId
  return store.getters['currentCards/byId'](cardId) || {}
})
const visible = computed(() => utils.objectHasKeys(card.value))
watch(() => visible.value, (value, prevValue) => {
  if (!value) {
    closeCard()
  }
})

const parentElement = computed(() => dialogElement.value)
const closeCardAndFocus = (event) => {
  const pickersIsVisible = state.tag.pickerIsVisible || state.space.pickerIsVisible
  if (pickersIsVisible) {
    hidePickers()
    return
  }
  store.dispatch('closeAllDialogs')
  document.querySelector(`.card[data-card-id="${prevCardId}"]`).focus()
}
const closeDialogs = (shouldSkipGlobalDialogs) => {
  store.commit('triggerCloseChildDialogs')
  state.imagePickerIsVisible = false
  state.cardTipsIsVisible = false
  state.shareCardIsVisible = false
  hidePickers()
  if (shouldSkipGlobalDialogs === true) { return }
  hideTagDetailsIsVisible()
  hideOtherItemDetailsIsVisible()
}
const triggerSignUpOrInIsVisible = () => {
  store.commit('triggerSignUpOrInIsVisible')
}
const triggerUpgradeUserIsVisible = () => {
  store.commit('triggerUpgradeUserIsVisible')
}
const clearErrors = () => {
  state.error.signUpToUpload = false
  state.error.sizeLimit = false
  state.error.unknownUploadError = false
}
const hideOtherItemDetailsIsVisible = () => {
  store.commit('otherCardDetailsIsVisible', false)
}
const showTagDetailsIsVisible = (event, tag) => {
  closeDialogs()
  const element = event.target.closest('.tag')
  const tagRect = element.getBoundingClientRect()
  store.commit('tagDetailsPosition', {
    x: window.scrollX + tagRect.x + 2,
    y: window.scrollY + tagRect.y + tagRect.height - 2,
    pageX: window.scrollX,
    pageY: window.scrollY
  })
  store.commit('currentSelectedTag', tag)
  store.commit('tagDetailsIsVisible', true)
}

// styles

const styles = computed(() => {
  let zoom = store.getters.spaceCounterZoomDecimal
  if (utils.isAndroid()) {
    zoom = utils.visualViewport().scale
  } else if (store.state.isTouchDevice) {
    // on iOS, keyboard focus zooms
    zoom = 1
  }
  const transform = `scale(${zoom})`
  const offset = 8
  const left = `${card.value.x + offset}px`
  const top = `${card.value.y + offset}px`
  return { transform, left, top }
})
const updateDialogHeight = async () => {
  if (!visible.value) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}
const shouldShowItemActions = computed(() => store.state.currentUser.shouldShowItemActions)
const rowIsBelowItemActions = computed(() => nameMetaRowIsVisible.value || badgesRowIsVisible.value || shouldShowItemActions.value || cardHasMedia.value || cardUrlPreviewIsVisible.value)
const nameMetaRowIsVisible = computed(() => state.nameSplitIntoCardsCount)
const badgesRowIsVisible = computed(() => tagsInCard.value.length || nameIsComment.value || isInSearchResultsCards.value)
const triggerUpdateHeaderAndFooterPosition = () => {
  store.commit('triggerUpdateHeaderAndFooterPosition')
}
const updateDimensions = async (cardId) => {
  cardId = cardId || card.value.id
  const item = { id: cardId }
  await nextTick()
  store.dispatch('currentCards/updateDimensions', { cards: [item] })
  await nextTick()
  await nextTick()
}
const updateDimensionsAndPathsDebounced = debounce(async () => {
  await updateDimensions()
  updatePaths()
}, 200)
const scrollIntoViewAndFocus = async () => {
  let behavior
  if (utils.isIPhone()) {
    behavior = 'auto'
  }
  await nextTick()
  scrollIntoView(behavior)
  focusName()
  triggerUpdateMagicPaintPositionOffset()
  triggerUpdateHeaderAndFooterPosition()
}
const triggerUpdateMagicPaintPositionOffset = () => {
  store.commit('triggerUpdateMagicPaintPositionOffset')
  triggerUpdateHeaderAndFooterPosition()
}

// space

const spacePrivacyIsOpen = computed(() => store.state.currentSpace.privacy === 'open')
const spacePrivacyIsClosed = computed(() => store.state.currentSpace.privacy === 'closed')
const isInSearchResultsCards = computed(() => {
  const results = store.state.searchResultsCards
  if (!results.length) { return }
  return Boolean(results.find(cardResult => card.value.id === cardResult.id))
})
const canEditSpace = computed(() => store.getters['currentUser/canEditSpace']())
const isInvitedButCannotEditSpace = computed(() => store.getters['currentUser/isInvitedButCannotEditSpace']())

// user

const isSpaceMember = computed(() => store.getters['currentUser/isSpaceMember']())
const cardIsCreatedByCurrentUser = computed(() => store.getters['currentUser/cardIsCreatedByCurrentUser'](card.value))
const isFavoriteSpace = computed(() => store.getters['currentSpace/isFavorite'])
const canEditCard = computed(() => {
  if (isSpaceMember.value) { return true }
  if (canEditSpace.value && cardIsCreatedByCurrentUser.value) { return true }
  return false
})
const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])
const createdByUser = computed(() => {
  const userId = card.value.userId
  let user = store.getters['currentSpace/userById'](userId)
  if (user) {
    return user
  } else {
    return {
      name: '',
      color: '#cdcdcd' // secondary-active-background
    }
  }
})
const updatedByUser = computed(() => {
  const userId = card.value.nameUpdatedByUserId || card.value.userId
  let user = store.getters['currentSpace/userById'](userId)
  if (user) {
    return user
  } else {
    return {
      name: '',
      color: '#cdcdcd' // secondary-active-background
    }
  }
})
const broadcastShowCardDetails = () => {
  const updates = {
    cardId: card.value.id,
    userId: store.state.currentUser.id
  }
  store.commit('broadcast/updateStore', { updates, type: 'updateRemoteCardDetailsVisible' })
}

// card

const updateCompositionEventEndTime = (event) => {
  // for non-latin input
  // https://stackoverflow.com/questions/51226598/what-is-javascripts-compositionevent-please-give-examples
  compositionEventEndTime = event.timeStamp
}
const handleEnterKey = (event) => {
  const isCompositionEvent = event.timeStamp && Math.abs(event.timeStamp - compositionEventEndTime) < 1000
  const pickersIsVisible = state.tag.pickerIsVisible || state.space.pickerIsVisible
  console.log('🎹 enter', {
    shouldPreventNextEnterKey: store.state.shouldPreventNextEnterKey,
    pickersIsVisible
  })
  if (store.state.shouldPreventNextEnterKey) {
    store.commit('shouldPreventNextEnterKey', false)
  } else if (pickersIsVisible) {
    triggerPickerSelectItem(event)
    hidePickers()
  } else if (state.insertedLineBreak) {
    state.insertedLineBreak = false
  } else if (isCompositionEvent) {

  } else {
    closeCard()
    store.dispatch('closeAllDialogs')
    store.commit('shouldPreventNextEnterKey', false)
    store.commit('triggerAddCard')
  }
}
const removeCard = () => {
  if (!canEditCard.value) { return }
  store.dispatch('history/resume')
  store.dispatch('currentCards/remove', card.value)
  store.commit('cardDetailsIsVisibleForCardId', '')
  triggerUpdateHeaderAndFooterPosition()
}
const toggleShouldShowItemActions = async () => {
  closeDialogs()
  const isVisible = !shouldShowItemActions.value
  store.dispatch('currentUser/shouldShowItemActions', isVisible)
  await nextTick()
  scrollIntoView()
}
const toggleShareCardIsVisible = () => {
  const isVisible = state.shareCardIsVisible
  closeDialogs()
  state.shareCardIsVisible = !isVisible
}
const scrollIntoView = async (behavior) => {
  // wait for element to be rendered before getting position
  await nextTick()
  await nextTick()
  await nextTick()
  const element = dialogElement.value
  store.commit('scrollElementIntoView', { element, behavior })
}
const showCard = async (cardId) => {
  await nextTick()
  broadcastShowCardDetails()
  clearErrors()
  updatePinchCounterZoomDecimal()
  scrollIntoViewAndFocus()
  updatePreviousTags()
  updateNameSplitIntoCardsCount()
  resetTextareaHeight()
  await nextTick()
  startOpening()
  const item = store.getters['currentCards/byId'](cardId)
  store.dispatch('checkIfItemShouldIncreasePageSize', item)
  state.previousSelectedTag = {}
  updateMediaUrls()
  const connections = store.getters['currentConnections/byCardId'](cardId)
  store.commit('updateCurrentCardConnections', connections)
  prevCardName = card.value.name
  store.dispatch('history/pause')
  textareaSizes()
}
const closeCard = async () => {
  store.commit('triggerHideTouchInterface')
  const cardId = prevCardId
  const item = store.getters['currentCards/byId'](cardId)
  nameElement.value.blur() // safari scroll fix
  closeDialogs(true)
  cancelOpening()
  store.dispatch('currentSpace/removeUnusedTagsFromCard', cardId)
  store.commit('updateCurrentCardConnections')
  store.commit('triggerUpdateHeaderAndFooterPosition')
  store.commit('shouldPreventNextEnterKey', false)
  if (!item) { return }
  const cardHasName = Boolean(item.name)
  const cardHasPendingUpload = store.getters['upload/hasPendingUploadForCardId'](cardId)
  if (!cardHasName && !cardHasPendingUpload) {
    store.dispatch('currentCards/remove', { id: cardId })
  }
  store.dispatch('updatePageSizes')
  updateDimensionsAndPathsDebounced()
  store.dispatch('checkIfItemShouldIncreasePageSize', item)
  store.dispatch('history/resume')
  if (item.name || prevCardName) {
    store.dispatch('history/add', { cards: [item], useSnapshot: true })
  }
}

// name

const textareaSizes = async () => {
  await nextTick()
  await nextTick()
  await nextTick()
  const element = nameElement.value
  if (!element) { return }
  let modifier = 0
  if (canEditCard.value) {
    modifier = 1
  }
  element.style.height = element.scrollHeight + modifier + 'px'
}
const resetTextareaHeight = () => {
  if (!visible.value) { return }
  nameElement.value.style.height = 'initial'
}
const focusName = async (position) => {
  if (store.state.shouldPreventNextFocusOnName) {
    triggerUpdateHeaderAndFooterPosition()
    store.commit('shouldPreventNextFocusOnName', false)
    return
  }
  await nextTick()
  const element = nameElement.value
  const length = name.value.length
  if (!element) { return }
  element.focus()
  if (position) {
    element.setSelectionRange(position, position)
  }
  if (length) {
    element.setSelectionRange(length, length)
  }
  triggerUpdateHeaderAndFooterPosition()
}
const name = computed({
  get () {
    return card.value.name || ''
  },
  set (newName) {
    if (store.state.shouldPreventNextEnterKey) {
      store.commit('shouldPreventNextEnterKey', false)
      updateCardName(newName.trim())
    } else {
      updateCardName(newName)
    }
    if (state.wasPasted) {
      state.wasPasted = false
    } else {
      state.pastedName = ''
    }
    updateNameSplitIntoCardsCount()
    textareaSizes()
  }
})
const updateCardName = async (newName) => {
  const cardId = store.state.cardDetailsIsVisibleForCardId
  if (card.value.id !== cardId) {
    return
  }
  const userId = store.state.currentUser.id
  const item = {
    name: newName,
    id: card.value.id,
    nameUpdatedAt: new Date(),
    nameUpdatedByUserId: userId
  }
  store.dispatch('currentCards/update', item)
  updateMediaUrls()
  updateTags()
  updateDimensionsAndPathsDebounced()
  if (createdByUser.value.id !== store.state.currentUser.id) { return }
  if (state.notifiedMembers) { return } // send card update notifications only once per card, per session
  if (item.name) {
    store.dispatch('userNotifications/addCardUpdated', { cardId: card.value.id, type: 'updateCard' })
    state.notifiedMembers = true
  }
}
const normalizedName = computed(() => {
  let newName = name.value
  if (url.value) {
    newName = newName.replace(url.value, '')
  }
  newName = newName.replace(utils.checkboxFromString(newName), '')
  return newName.trim()
})
const clickName = (event) => {
  triggerUpdateMagicPaintPositionOffset()
  store.commit('searchIsVisible', false)
  if (isCursorInsideTagBrackets()) {
    showTagPicker()
    event.stopPropagation()
  } else if (isCursorInsideSlashCommand()) {
    showSpacePicker()
    updateSpacePickerSearch()
    event.stopPropagation()
  }
}

// checkbox

const checkbox = computed(() => Boolean(utils.checkboxFromString(name.value)))
const checkboxIsChecked = computed({
  get () {
    return utils.nameIsChecked(name.value)
  },
  set (value) {
    if (utils.nameIsChecked(name.value)) {
      store.dispatch('currentCards/removeChecked', card.value.id)
    } else {
      store.dispatch('currentCards/toggleChecked', { cardId: card.value.id, value })
    }
  }
})
const addCheckbox = () => {
  const update = {
    id: card.value.id,
    name: `[] ${card.value.name}`
  }
  store.dispatch('currentCards/update', update)
}

// character limit

const maxCardCharacterLimit = computed(() => {
  let value = store.state.currentUser.cardSettingsDefaultCharacterLimit || consts.defaultCharacterLimit
  const isCodeblock = card.value.name?.includes('```')
  if (isCodeblock) {
    value = consts.highCharacterLimit
  }
  return value
})
const currentCardLength = computed(() => {
  if (!card.value.name) { return 0 }
  return card.value.name.length
})
const showCharacterCount = computed(() => {
  const threshold = 50
  if (errorMaxCharacterLimit.value) { return }
  return currentCardLength.value >= maxCardCharacterLimit.value - threshold
})
const errorMaxCharacterLimit = computed(() => {
  if (currentCardLength.value >= maxCardCharacterLimit.value) {
    return true
  } else {
    return false
  }
})

// opening animation

const openingFrameStyle = computed(() => {
  const initialPadding = 200
  const initialBorderRadius = 60
  const padding = initialPadding * state.openingPercent
  const userColor = store.state.currentUser.color
  const borderRadius = Math.max((state.openingPercent * initialBorderRadius), 5) + 'px'
  const size = `calc(100% + ${padding}px)`
  const position = -(padding / 2) + 'px'
  return {
    width: size,
    height: size,
    left: position,
    top: position,
    background: userColor,
    opacity: state.openingAlpha,
    borderRadius: borderRadius
  }
})
const cancelOpening = () => {
  shouldCancelOpening = true
}
const cancelOpeningAnimationFrame = () => {
  state.isOpening = false
  state.openingPercent = 0
  state.openingAlpha = 0
  shouldCancelOpening = false
}
const startOpening = () => {
  if (store.state.preventCardDetailsOpeningAnimation || !card.value.name) {
    store.commit('preventCardDetailsOpeningAnimation', false)
    return
  }
  shouldCancelOpening = false
  setTimeout(() => {
    if (!openingAnimationTimer) {
      state.isOpening = true
      openingAnimationTimer = window.requestAnimationFrame(openingAnimationFrame)
    }
  }, openingPreDuration)
}
const openingAnimationFrame = (timestamp) => {
  if (!openingStartTime) {
    openingStartTime = timestamp
  }
  const elaspedTime = timestamp - openingStartTime
  const percentComplete = (elaspedTime / openingDuration) // between 0 and 1
  if (shouldCancelOpening) {
    cancelOpeningAnimationFrame()
  }
  if (state.isOpening && percentComplete <= 1) {
    const percentRemaining = Math.abs(percentComplete - 1)
    state.openingPercent = percentRemaining
    const alpha = utils.easeOut(percentComplete, elaspedTime, openingDuration)
    state.openingAlpha = alpha
    window.requestAnimationFrame(openingAnimationFrame)
  } else if (state.isOpening && percentComplete > 1) {
    console.log('🐢 cardDetails openingAnimationFrame complete')
    openingAnimationTimer = undefined
    openingStartTime = undefined
    state.isOpening = false
  } else {
    window.cancelAnimationFrame(openingAnimationTimer)
    openingAnimationTimer = undefined
    openingStartTime = undefined
    cancelOpeningAnimationFrame()
  }
}

// tags

const currentSelectedTag = computed(() => store.state.currentSelectedTag)

const showTagPicker = () => {
  state.tag.pickerSearch = ''
  closeDialogs()
  const nameRect = nameElement.value.getBoundingClientRect()
  state.tag.pickerPosition = {
    top: nameRect.height - 2
  }
  state.tag.pickerIsVisible = true
  updateTagPickerSearch()
}
const tagStartText = () => {
  // ...[[abc
  const cursorStart = selectionStartPosition()
  const start = name.value.substring(0, cursorStart)
  let startPosition = start.lastIndexOf('[[')
  if (startPosition === -1) { return }
  startPosition = startPosition + 2
  return start.substring(startPosition)
}
const tagEndText = () => {
  // xyz]]...
  const cursorStart = selectionStartPosition()
  const end = name.value.substring(cursorStart)
  const endPosition = end.indexOf(']]')
  if (endPosition === -1) { return }
  return end.substring(0, endPosition)
}
const updateTagPickerSearch = () => {
  if (!state.tag.pickerIsVisible) { return }
  const start = tagStartText() || ''
  const end = tagEndText() || ''
  state.tag.pickerSearch = start + end
}
const isCursorInsideTagBrackets = () => {
  const cursorStart = selectionStartPosition() // for template
  const start = tagStartText()
  const end = tagEndText()
  if (start === undefined || end === undefined) { return }
  if (!start.includes(']]') && !end.includes('[[')) {
    return true
  }
}
const checkIfShouldShowTagPicker = () => {
  const tagPickerIsVisible = state.tag.pickerIsVisible
  const isInsideTagBrackets = isCursorInsideTagBrackets()
  if (isInsideTagBrackets && !tagPickerIsVisible) {
    showTagPicker()
  } else if (!isInsideTagBrackets && tagPickerIsVisible) {
    hideTagPicker()
  }
}
const checkIfShouldHideTagPicker = () => {
  const tagPickerIsVisible = state.tag.pickerIsVisible
  const isInsideTagBrackets = isCursorInsideTagBrackets()
  if (!isInsideTagBrackets && tagPickerIsVisible) {
    hideTagPicker()
  }
}
const addTagClosingBrackets = async () => {
  const cursorStart = selectionStartPosition()
  const newName = `${name.value.substring(0, cursorStart)}]]${name.value.substring(cursorStart)}`
  updateCardName(newName)
  await nextTick()
  setSelectionRange(cursorStart, cursorStart)
}
const moveCursorPastTagEnd = async () => {
  const cursorStart = selectionStartPosition()
  let endText = name.value.substring(cursorStart)
  let newCursorPosition = endText.indexOf(']]')
  newCursorPosition = cursorStart + newCursorPosition + 2
  setSelectionRange(newCursorPosition, newCursorPosition)
}
const updatePreviousTags = () => {
  if (!card.value.name) {
    previousTags = []
    return
  }
  previousTags = utils.tagsFromStringWithoutBrackets(card.value.name) || []
  previousTags = previousTags.map(tagName => {
    let tag
    if (state.previousSelectedTag.name === tagName) {
      tag = state.previousSelectedTag
    } else if (state.currentSearchTag.name === tagName) {
      tag = state.currentSearchTag
    } else {
      tag = store.getters['currentSpace/tagByName'](tagName)
      tag = utils.clone(tag)
      tag.color = state.previousSelectedTag.color || tag.color
    }
    return tag
  })
}
const updateNewTagColor = (color) => {
  state.newTagColor = color
}
const addNewTags = (newTagNames) => {
  const previousTagNames = previousTags.map(tag => tag.name)
  const addTagsNames = newTagNames.filter(newTagName => !previousTagNames.includes(newTagName))
  addTagsNames.forEach(tagName => {
    let tag
    tag = utils.newTag({
      name: tagName,
      defaultColor: state.newTagColor || store.state.currentUser.color,
      cardId: card.value.id,
      spaceId: store.state.currentSpace.id
    })
    if (state.previousSelectedTag.name === tagName) {
      tag.color = state.previousSelectedTag.color
    } else if (state.currentSearchTag.name === tagName) {
      tag.color = state.currentSearchTag.color
    }
    store.dispatch('currentSpace/addTag', tag)
  })
}
const updateTags = () => {
  if (!card.value.name) { return }
  const newTagNames = utils.tagsFromStringWithoutBrackets(card.value.name) || []
  addNewTags(newTagNames)
  updatePreviousTags()
}
const hideTagDetailsIsVisible = () => {
  store.commit('currentSelectedTag', {})
  store.commit('tagDetailsIsVisible', false)
}
const updateCurrentSearchTag = (tag) => {
  state.currentSearchTag = tag
  updatePreviousTags()
}
const updateTagBracketsWithTag = (tag) => {
  state.previousSelectedTag = tag
  updatePreviousTags()
  const cursorStart = selectionStartPosition()
  const text = tagStartText() + tagEndText()
  let newName
  if (text.length) {
    newName = name.value.replace(`[[${text}]]`, `[[${tag.name}]]`)
  } else {
    const startText = name.value.substring(0, cursorStart)
    const endText = name.value.substring(cursorStart)
    newName = startText + tag.name + endText
  }
  updateCardName(newName)
  moveCursorPastTagEnd()
  store.commit('shouldPreventNextEnterKey', false)
}

// pickers

const selectionStartPosition = () => {
  let startPosition = state.lastSelectionStartPosition
  if (nameElement.value) {
    const position = nameElement.value.selectionStart
    state.lastSelectionStartPosition = position
    startPosition = position
  }
  return startPosition
}
const setSelectionRange = (start, end) => {
  if (nameElement.value) {
    nameElement.value.setSelectionRange(start, end)
  }
}
const hidePickers = () => {
  hideTagPicker()
  hideSpacePicker()
}
const hideTagPicker = () => {
  state.tag.pickerIsVisible = false
  store.dispatch('currentSpace/removeUnusedTagsFromCard', card.value.id)
}
const hideSpacePicker = () => {
  state.space.pickerSearch = ''
  state.space.pickerIsVisible = false
}
const checkIfShouldShowPicker = () => {
  checkIfShouldShowTagPicker()
  checkIfShouldShowSpacePicker()
}
const checkIfShouldHidePicker = () => {
  checkIfShouldHideTagPicker()
  checkIfShouldHideSpacePicker()
}
const triggerPickerNavigation = (event) => {
  const modifierKey = event.altKey || event.shiftKey || event.ctrlKey || event.metaKey
  const pickerIsVisible = state.tag.pickerIsVisible || state.space.pickerIsVisible
  const shouldTrigger = pickerIsVisible && !modifierKey
  if (shouldTrigger) {
    store.commit('triggerPickerNavigationKey', event.key)
    event.preventDefault()
  }
}
const triggerPickerSelectItem = (event) => {
  const modifierKey = event.altKey || event.shiftKey || event.ctrlKey || event.metaKey
  const pickerIsVisible = state.tag.pickerIsVisible || state.space.pickerIsVisible
  const shouldTrigger = pickerIsVisible && !modifierKey
  if (shouldTrigger) {
    store.commit('triggerPickerSelect')
    event.preventDefault()
  }
  // prevent trailing ]
  if (event.key === ']' && state.tag.pickerIsVisible) {
    state.shouldCancelBracketRight = true
    setTimeout(() => {
      state.shouldCancelBracketRight = false
    }, 250)
  }
  if (event.key === ']' && state.shouldCancelBracketRight) {
    event.preventDefault()
  }
  // prevents Enter from creating new card
  if (event.key !== 'Enter') {
    hidePickers()
  }
}
const updatePickerSearch = () => {
  if (state.tag.pickerIsVisible) {
    updateTagPickerSearch()
  } else if (state.space.pickerIsVisible) {
    updateSpacePickerSearch()
  }
}

// card tips

const showCardTips = computed(() => {
  if (name.value) { return }
  return true
})
const toggleCardTipsIsVisible = () => {
  const isVisible = state.cardTipsIsVisible
  closeDialogs()
  state.cardTipsIsVisible = !isVisible
}

// comment

const nameIsComment = computed(() => utils.isNameComment(name.value))

const tagsInCard = computed(() => {
  const tagNames = utils.tagsFromStringWithoutBrackets(name.value)
  if (!tagNames) { return [] }
  let tags = []
  tagNames.forEach(name => {
    const tag = store.getters['currentSpace/tagByName'](name)
    tags.push(tag)
  })
  return tags
})

// other card

const otherCardIsVisible = computed(() => {
  const isCardLink = Boolean(card.value.linkToCardId)
  return isCardLink && hasUrls.value
})
const otherCard = computed(() => {
  const item = store.getters.otherCardById(card.value.linkToCardId)
  return item
})
const otherCardUrl = computed(() => utils.urlFromSpaceAndCard({ cardId: card.value.linkToCardId, spaceId: card.value.linkToSpaceId }))

// other space

const otherSpaceIsVisible = computed(() => {
  const isCardLink = Boolean(card.value.linkToSpaceId)
  return isCardLink && hasUrls.value
})
const otherSpace = computed(() => {
  const space = store.getters.otherSpaceById(card.value.linkToSpaceId)
  return space
})
const otherSpaceUrl = computed(() => {
  return utils.spaceUrl({
    spaceId: otherSpace.value?.id,
    spaceName: otherSpace.value?.name,
    collaboratorKey: card.value.linkToSpaceCollaboratorKey
  })
})

// url preview

const url = computed(() => utils.urlFromString(name.value))
const urls = computed(() => {
  const newName = utils.removeMarkdownCodeblocksFromString(name.value)
  const urls = utils.urlsFromString(newName)
  return urls
})
const validUrls = computed(() => {
  if (!urls.value) { return [] }
  return urls.value.filter(url => {
    const isLink = utils.urlType(url) === 'link'
    const isValidUrl = utils.urlIsValidTld(url) || utils.urlIsValidLocalhost(url)
    return isLink && isValidUrl
  })
})
const validWebUrls = computed(() => {
  const urls = validUrls.value.filter(url => {
    const urlHasProtocol = utils.urlHasProtocol(url)
    const isUpload = url.includes('us-east-1.linodeobjects.com') || url.includes('cdn.kinopio.club')
    const isSpace = utils.urlIsSpace(url)
    return urlHasProtocol && !isUpload && !isSpace
  })
  if (!urls.length && card.value.urlPreviewUrl) {
    removeUrlPreview()
  }
  return urls
})
const hasUrls = computed(() => {
  return Boolean(validUrls.value.length)
})
const urlsIsVisible = computed(() => {
  const urlsVisible = validUrls.value.filter(url => {
    const queryString = utils.queryString(url)
    if (queryString) {
      const queryObject = qs.decode(queryString)
      return queryObject.hidden || queryObject.kinopio
    } else {
      return false
    }
  })
  return urlsVisible.length === validUrls.value.length
})
const cardUrlPreviewIsVisible = computed(() => {
  const isErrorUrl = card.value.urlPreviewErrorUrl && card.value.urlPreviewUrl === card.value.urlPreviewErrorUrl
  const hasPreview = url.value && (isLoadingUrlPreview.value || card.value.urlPreviewUrl)
  return Boolean(card.value.urlPreviewIsVisible && hasPreview && !isErrorUrl)
})
const urlPreviewIsVisible = computed(() => {
  if (isLoadingUrlPreview.value) { return true }
  if (!card.value.urlPreviewUrl) { return }
  const urls = utils.urlsFromString(card.value.name) || []
  const value = urls.find((url) => {
    return url?.includes(card.value.urlPreviewUrl)
  })
  return Boolean(value)
})
const isLoadingUrlPreview = computed(() => {
  const isLoading = store.state.urlPreviewLoadingForCardIds.find(cardId => cardId === card.value.id)
  return Boolean(isLoading)
})
const toggleUrlsIsVisible = () => {
  const isVisible = !urlsIsVisible.value
  let newName
  if (isVisible) {
    newName = utils.addHiddenQueryStringToURLs(name.value)
  } else {
    newName = utils.removeHiddenQueryStringFromURLs(name.value)
  }
  updateCardName(newName)
}
const removeUrlPreview = async () => {
  const cardId = card.value.id || prevCardId
  const update = {
    id: cardId,
    urlPreviewUrl: '',
    urlPreviewImage: '',
    urlPreviewTitle: '',
    urlPreviewDescription: '',
    urlPreviewIframeUrl: ''
  }
  store.commit('removeUrlPreviewLoadingForCardIds', cardId)
  store.dispatch('currentCards/update', update)
  updateDimensionsAndPathsDebounced()
}

// media

const urlIsAudio = computed(() => utils.urlIsAudio(url.value))
const cardHasMedia = computed(() => Boolean(state.formats.image || state.formats.video || state.formats.audio))
const addImageOrFile = async (file) => {
  const cardId = card.value.id
  const spaceId = store.state.currentSpace.id
  // remove existing image url
  const prevImageOrFile = state.formats.image || state.formats.video || state.formats.file
  if (prevImageOrFile) {
    const newName = name.value.replace(prevImageOrFile, '')
    updateCardName(newName)
  }
  // add new image or file url
  store.commit('triggerUploadComplete', {
    cardId,
    spaceId,
    url: file.url
  })
  await nextTick()
  updateMediaUrls()
}
const updateMediaUrls = () => {
  const urls = utils.urlsFromString(card.value.name)
  state.formats.image = ''
  state.formats.video = ''
  state.formats.audio = ''
  state.formats.link = ''
  if (!urls) { return }
  if (!urls.length) { return }
  urls.forEach(url => {
    if (utils.urlIsImage(url)) {
      state.formats.image = url
    } else if (utils.urlIsVideo(url)) {
      state.formats.video = url
    } else if (utils.urlIsAudio(url)) {
      state.formats.audio = url
    } else if (utils.urlIsFile(url)) {
      state.formats.file = url
    } else {
      state.formats.link = url
    }
  })
}
const toggleImagePickerIsVisible = () => {
  const isVisible = state.imagePickerIsVisible
  closeDialogs()
  state.imagePickerIsVisible = !isVisible
  state.initialSearch = normalizedName.value
}

// upload

const cardPendingUpload = computed(() => {
  const pendingUploads = store.state.upload.pendingUploads
  return pendingUploads.find(upload => upload.cardId === card.value.id)
})
const uploadFile = async (file) => {
  if (!currentUserIsSignedIn.value) {
    state.error.signUpToUpload = true
    return
  }
  try {
    await store.dispatch('upload/uploadFile', { file, cardId: card.value.id })
  } catch (error) {
    console.warn('🚒', error)
    if (error.type === 'sizeLimit') {
      state.error.sizeLimit = true
    } else {
      state.error.unknownUploadError = true
    }
  }
}

// merge split

const updateNameSplitIntoCardsCount = () => {
  const isPreview = true
  const newCards = splitCards(null, isPreview)
  const count = newCards.length
  if (count > 1) {
    state.nameSplitIntoCardsCount = count
  } else {
    state.nameSplitIntoCardsCount = 0
  }
}
const splitCards = (event, isPreview) => {
  const prevName = (state.pastedName || name.value).trim()
  const cardNames = utils.splitCardNameByParagraphAndSentence(prevName)
  const user = store.state.currentUser
  // create new split cards
  let newCards = cardNames.map((cardName, index) => {
    const indentAmount = 50
    const indentLevel = utils.numberOfLeadingTabs(cardName) || utils.numberOfLeadingDoubleSpaces(cardName)
    const indentX = indentLevel * indentAmount
    let id = nanoid()
    if (index === 0) {
      id = card.value.id
    }
    const newCard = {
      id,
      name: cardName.trim(),
      x: card.value.x + indentX,
      y: card.value.y,
      frameId: card.value.frameId,
      backgroundColor: card.value.backgroundColor,
      maxWidth: user.cardSettingsMaxCardWidth
    }
    return newCard
  })
  if (isPreview) { return newCards }
  state.pastedName = ''
  updateCardName(newCards[0].name)
  store.dispatch('history/resume')
  store.dispatch('history/add', { cards: newCards, useSnapshot: true })
  store.dispatch('history/pause')
  newCards.shift()
  addSplitCards(newCards)
}
const addSplitCards = async (newCards) => {
  const spaceBetweenCards = 12
  let prevCard = utils.clone(card.value)
  store.dispatch('currentCards/addMultiple', { cards: newCards })
  store.dispatch('closeAllDialogs')
  // update y positions
  // wait for cards to be added to dom
  setTimeout(() => {
    for (let newCard of newCards) {
      const element = document.querySelector(`article [data-card-id="${prevCard.id}"]`)
      const prevCardRect = element.getBoundingClientRect()
      newCard.y = prevCard.y + (prevCardRect.height * store.getters.spaceCounterZoomDecimal) + spaceBetweenCards
      store.dispatch('currentCards/update', newCard)
      store.commit('triggerUpdateUrlPreview', newCard.id)
      prevCard = newCard
    }
    store.dispatch('updatePageSizes')
  }, 150)
}

// copy paste

const updatePastedName = (event) => {
  const files = event.clipboardData.files
  if (files.length) {
    uploadFile(files[0])
  } else {
    const text = event.clipboardData.getData('text')
    state.pastedName = text
  }
  state.wasPasted = true
  store.dispatch('currentCards/updateURLQueryStrings', { cardId: card.value.id })
}

// connections

const updatePaths = async () => {
  await nextTick()
  store.dispatch('currentConnections/updatePaths', { cardId: card.value.id })
}

// line break

const checkIfIsInsertLineBreak = (event) => {
  const lineBreakInserted = event.ctrlKey || event.altKey
  if (!lineBreakInserted) {
    state.insertedLineBreak = false
  }
}
const conditionalInsertLineBreak = (event) => {
  const shouldAddChildCard = store.state.currentUser.cardSettingsShiftEnterShouldAddChildCard
  if (shouldAddChildCard) { return }
  insertLineBreak(event)
}
const insertLineBreak = (event) => {
  const position = nameElement.value.selectionEnd
  let newName = card.value.name
  newName = newName.substring(0, position) + '\n' + name.value.substring(position)
  setTimeout(() => {
    setSelectionRange(position + 1, position + 1)
  })
  state.insertedLineBreak = true
  updateCardName(newName)
  textareaSizes()
}

// Comment

const addCommentClosingBrackets = async () => {
  const cursorStart = selectionStartPosition()
  const previousCharacter = name.value[cursorStart - 1]
  if (previousCharacter === '(') {
    const newName = `${name.value.substring(0, cursorStart)}))${name.value.substring(cursorStart)}`
    updateCardName(newName)
    await nextTick()
    setSelectionRange(cursorStart, cursorStart)
  }
}

// Pickers

const updatePicker = (event) => {
  const cursorStart = selectionStartPosition()
  const previousCharacter = name.value[cursorStart - 1]
  const previousCharacterIsBlank = utils.hasBlankCharacters(previousCharacter)
  const key = event.key
  const keyIsArrowUpOrDown = key === 'ArrowDown' || key === 'ArrowUp'
  const keyIsLettterOrNumber = key.length === 1
  const isInsideTagBrackets = isCursorInsideTagBrackets()
  const isInsideSlashCommand = isCursorInsideSlashCommand()
  if (keyIsArrowUpOrDown) { return }
  if (key === '(') {
    addCommentClosingBrackets()
  }
  if (utils.hasBlankCharacters(key)) {
    hideSpacePicker()
  } else if (key === '/' && previousCharacterIsBlank) {
    showSpacePicker()
  } else if (cursorStart === 0) {
    return
  } else if (keyIsLettterOrNumber && isInsideSlashCommand) {
    showSpacePicker()
  } else if (key === '[' && previousCharacter === '[') {
    showTagPicker()
    addTagClosingBrackets()
  } else if (keyIsLettterOrNumber && isInsideTagBrackets) {
    showTagPicker()
  }
  checkIfIsInsertLineBreak(event)
}
const isCursorInsideSlashCommand = () => {
  const text = slashTextToCursor()
  if (utils.hasBlankCharacters(text)) { return }
  const characterBeforeSlash = name.value.charAt(slashTextPosition() - 1)
  if (text && !characterBeforeSlash) { return true }
  const characterBeforeSlashIsBlank = utils.hasBlankCharacters(characterBeforeSlash)
  const textIsValid = !utils.hasBlankCharacters(text)
  return textIsValid && characterBeforeSlashIsBlank
}
const replaceSlashCommandWithSpaceUrl = async (space) => {
  let newName = card.value.name
  let position = slashTextPosition()
  const spaceUrl = consts.kinopioDomain() + '/' + space.url + ' '
  const start = newName.substring(0, position)
  const end = newName.substring(position + slashText().length, newName.length)
  newName = start + spaceUrl + end
  updateCardName(newName)
  position = position + spaceUrl.length + 1
  hideSpacePicker()
  await nextTick()
  focusName(position)
  store.commit('shouldPreventNextEnterKey', false)
  store.dispatch('currentCards/update', {
    id: card.value.id,
    shouldShowOtherSpacePreviewImage: true
  })
  textareaSizes()
}

// space picker

const showSpacePicker = () => {
  closeDialogs()
  const nameRect = nameElement.value.getBoundingClientRect()
  state.space.pickerPosition = {
    top: nameRect.height - 2
  }
  state.space.pickerIsVisible = true
}
const slashText = () => {
  const cursorStart = selectionStartPosition()
  const start = slashTextToCursor() // /txt|
  let end = name.value.substring(cursorStart, name.value.length) // |abc xyz
  end = utils.splitByBlankCharacters(end)[0]
  return start + end
}
const slashTextToCursor = () => {
  const cursorStart = selectionStartPosition()
  const textPosition = slashTextPosition()
  const text = name.value.substring(textPosition, cursorStart)
  return text
}
const slashTextPosition = () => {
  const cursorStart = selectionStartPosition()
  let text = name.value.substring(0, cursorStart)
  const textPosition = text.lastIndexOf('/')
  if (textPosition === -1) { return }
  return textPosition
}
const updateSpacePickerSearch = () => {
  if (!state.space.pickerIsVisible) { return }
  const text = slashText()
  state.space.pickerSearch = text.substring(1, text.length)
}
const checkIfShouldHideSpacePicker = () => {
  if (!state.space.pickerIsVisible) { return }
  if (!isCursorInsideSlashCommand()) {
    hideSpacePicker()
  }
}
const checkIfShouldShowSpacePicker = () => {
  if (isCursorInsideSlashCommand()) {
    showSpacePicker()
  } else {
    hideSpacePicker()
  }
}

// touch mobile

const resetPinchCounterZoomDecimal = () => {
  store.commit('pinchCounterZoomDecimal', 1)
}
const updatePinchCounterZoomDecimal = () => {
  store.commit('pinchCounterZoomDecimal', utils.pinchCounterZoomDecimal())
}
</script>

<template lang="pug">
dialog.card-details(v-if="visible" :open="visible" ref="dialogElement" @click.left="closeDialogs" @keyup.stop.backspace="removeCard" :style="styles" :data-card-id="card.id")
  .opening-frame(v-if="state.isOpening" :style="openingFrameStyle")
  section
    .textarea-wrap
      textarea.name(
        :disabled="!canEditCard"
        ref="nameElement"
        rows="1"
        placeholder="Type here, or paste a URL"
        v-model="name"
        @keydown.prevent.enter.exact

        @compositionend="updateCompositionEventEndTime"
        @keydown.enter.exact="handleEnterKey"
        @keyup.stop.esc
        @keydown.esc="closeCardAndFocus"

        @keyup.stop.backspace="checkIfShouldShowPicker"
        @keydown.stop.up="checkIfShouldHidePicker"
        @keydown.stop.down="checkIfShouldHidePicker"
        @keydown.stop.left="checkIfShouldHidePicker"
        @keydown.stop.right="checkIfShouldHidePicker"

        data-type="name"
        :maxlength="maxCardCharacterLimit"
        @click.left="clickName"
        @blur="triggerUpdateHeaderAndFooterPosition"
        @paste="updatePastedName"

        @keyup.alt.enter.exact.stop
        @keyup.ctrl.enter.exact.stop
        @keydown.alt.enter.exact.stop="insertLineBreak"
        @keydown.ctrl.enter.exact.stop="insertLineBreak"
        @keydown.shift.enter.exact="conditionalInsertLineBreak"

        @keyup="updatePickerSearch(null)"

        @keydown="updatePicker"
        @keydown.down.stop="triggerPickerNavigation"
        @keydown.up.stop="triggerPickerNavigation"

        @keydown.tab.exact="triggerPickerSelectItem"

        @focus="resetPinchCounterZoomDecimal"
      )

      TagPicker(
        :visible="state.tag.pickerIsVisible"
        :cursorPosition="state.cursorPosition"
        :position="state.tag.pickerPosition"
        :search="state.tag.pickerSearch"
        @closeDialog="hideTagPicker"
        @selectTag="updateTagBracketsWithTag"
        @currentTag="updateCurrentSearchTag"
        @newTagColor="updateNewTagColor"
      )
      SpacePicker(
        :visible="state.space.pickerIsVisible"
        :parentIsCardDetails="true"
        :cursorPosition="state.cursorPosition"
        :position="state.space.pickerPosition"
        :search="state.space.pickerSearch"
        :shouldExcludeCurrentSpace="true"
        :shouldShowNewSpace="true"
        @closeDialog="hideSpacePicker"
        @selectSpace="replaceSlashCommandWithSpaceUrl"
      )
      .inline-button-wrap(v-if="showCardTips" @click.left.stop="toggleCardTipsIsVisible" :class="{ active: state.cardTipsIsVisible }")
        button.inline-button(tabindex="-1" :class="{ active: state.cardTipsIsVisible }")
          span ?
      CardTips(:visible="state.cardTipsIsVisible")

    .row(v-if="cardPendingUpload")
      .badge.info
        Loader(:visible="true")
        span {{cardPendingUpload.percentComplete}}%

    .row
      template(v-if="canEditCard")
        //- Remove
        .button-wrap
          button.danger(@click.left="removeCard" title="Remove Card")
            img.icon.remove(src="@/assets/remove.svg")
            //- span Remove
        //- [·]
        .button-wrap.cards-checkboxes
          label.fixed-height(v-if="checkbox" :class="{active: checkboxIsChecked, disabled: !canEditCard}" tabindex="0" title="Checkbox")
            input(type="checkbox" v-model="checkboxIsChecked" tabindex="-1")
          label.fixed-height(v-else @click.left.prevent="addCheckbox" @keydown.stop.enter="addCheckbox" :class="{disabled: !canEditCard}" tabindex="0")
            input.add(type="checkbox" tabindex="-1")
        //- Image
        .button-wrap
          button(@click.left.stop="toggleImagePickerIsVisible" :class="{active : state.imagePickerIsVisible}" title="Image")
            img.icon.flower(src="@/assets/flower.svg")
          ImagePicker(:visible="state.imagePickerIsVisible" :initialSearch="state.initialSearch" :cardUrl="url" :cardId="card.id" @selectImage="addImageOrFile")
        //- Toggle Style Actions
        .button-wrap
          button(@click.left.stop="toggleShouldShowItemActions" :class="{active : shouldShowItemActions}" title="More Options")
            img.icon.down-arrow.button-down-arrow(src="@/assets/down-arrow.svg")
      //- Share
      .button-wrap.share-button-wrap(v-if="name" @click.left.stop="toggleShareCardIsVisible" )
        button(:class="{active: state.shareCardIsVisible}")
          span Share
        ShareCard(:visible="state.shareCardIsVisible" :card="card" :isReadOnly="!canEditCard")

    CardOrBoxActions(:visible="shouldShowItemActions && canEditCard" :cards="[card]" @closeDialogs="closeDialogs" :class="{ 'last-row': !rowIsBelowItemActions }" :tagsInCard="tagsInCard")
    CardCollaborationInfo(:visible="shouldShowItemActions" :createdByUser="createdByUser" :updatedByUser="updatedByUser" :card="card" :parentElement="parentElement" @closeDialogs="closeDialogs")

    .row(v-if="nameMetaRowIsVisible")
      //- Split by Line Breaks
      .button-wrap(v-if="state.nameSplitIntoCardsCount && canEditCard")
        button(:disabled="!canEditCard" @click.left.stop="splitCards")
          img.icon(src="@/assets/split.svg")
          span Split Card ({{state.nameSplitIntoCardsCount}})

    .row.badges-row(v-if="badgesRowIsVisible")
      //- Search result
      span.badge.search(v-if="isInSearchResultsCards")
        img.icon.search(src="@/assets/search.svg")
      //- Tags
      template(v-for="tag in tagsInCard")
        Tag(:tag="tag" :isClickable="true" :isActive="currentSelectedTag.name === tag.name" @clickTag="showTagDetailsIsVisible")
      //- ((Comment))
      .badge.info(v-if="nameIsComment")
        span ((comment))

    .row.badges-row.other-items-row(v-if="otherCardIsVisible")
      OtherCardPreview(:otherCard="otherCard" :url="otherCardUrl" :parentCardId="card.id" :shouldTruncateName="true")

    MediaPreview(:visible="cardHasMedia" :card="card" :formats="state.formats")
    UrlPreview(
      :visible="urlPreviewIsVisible"
      :loading="isLoadingUrlPreview"
      :card="card"
      :urlsIsVisibleInName="urlsIsVisible"
      @toggleUrlsIsVisible="toggleUrlsIsVisible"
    )
    //- other space
    template(v-if="otherSpaceIsVisible")
      OtherSpacePreview(
        :otherSpace="otherSpace"
        :url="otherSpaceUrl"
        :card="card"
      )

    //- Read Only
    template(v-if="!canEditCard")
      CardCollaborationInfo(:visible="!shouldShowItemActions" :createdByUser="createdByUser" :updatedByUser="updatedByUser" :card="card" :parentElement="parentElement" @closeDialogs="closeDialogs")
      .row.edit-message
        template(v-if="spacePrivacyIsOpen")
          span.badge.info
            img.icon.open(src="@/assets/open.svg")
            span In open spaces, you can only move and edit cards you created
        template(v-else-if="isInvitedButCannotEditSpace")
          span.badge.info
            img.icon(src="@/assets/unlock.svg")
            span To edit spaces you've been invited to, you'll need to sign up or in
          .row
            .button-wrap
              button(@click.left.stop="triggerSignUpOrInIsVisible") Sign Up or In
        template(v-else-if="spacePrivacyIsClosed")
          span.badge.info
            img.icon(src="@/assets/unlock.svg")
            span Read Only

    //- Info
    template(v-if="showCharacterCount")
      .row
        span.badge.secondary-on-dark-background
          span {{currentCardLength}} / {{maxCardCharacterLimit}}

    //- Errors
    template(v-if="errorMaxCharacterLimit")
      .row
        span.badge.danger
          img.icon.cancel(src="@/assets/add.svg")
          span Max Length
      p To fit small screens, cards can't be longer than {{maxCardCharacterLimit}} characters
    template(v-if="state.error.signUpToUpload")
      p
        span To upload files,
        span.badge.info you need to Sign Up or In
      button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
    template(v-if="state.error.sizeLimit")
      p
        span.badge.danger
          img.icon.cancel(src="@/assets/add.svg")
          span Too Big
      p
        span To upload files over 5mb,
        span.badge.info upgrade for unlimited
      button(@click.left="triggerUpgradeUserIsVisible") Upgrade for Unlimited
    template(v-if="state.error.unknownUploadError")
      .badge.danger (シ_ _)シ Something went wrong, Please try again or contact support
</template>

<style lang="stylus">
.card-details
  transform-origin top left
  > section
    background-color var(--secondary-background)
  .textarea-wrap
    position relative
    display flex
    align-items flex-start
    textarea
      max-height 250px
  .edit-message
    button
      margin-top 10px
  .cards-checkboxes
    label
      display flex
      align-items center
    input
      margin 0
      vertical-align -1px
  .badges-row
    display flex
    flex-wrap wrap
  .inline-button-wrap
    cursor pointer
    margin-right -8px
    margin-top -8px
    .inline-button
      cursor pointer
      padding 2px 6px
      padding-top 0
  .media-preview + .url-preview
    margin-top 10px
  .opening-frame
    position absolute
    z-index -1
    pointer-events none

  dialog.image-picker
    left -100px

</style>
