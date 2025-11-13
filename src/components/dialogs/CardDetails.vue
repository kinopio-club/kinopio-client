<script setup>
import { reactive, computed, onMounted, onUpdated, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useUserNotificationStore } from '@/stores/useUserNotificationStore'
import { useUploadStore } from '@/stores/useUploadStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'
import { useApiStore } from '@/stores/useApiStore'

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
import CardDetailsMeta from '@/components/CardDetailsMeta.vue'
import ShareItem from '@/components/dialogs/ShareItem.vue'
import OtherCardPreview from '@/components/OtherCardPreview.vue'
import OtherSpacePreview from '@/components/OtherSpacePreview.vue'
import GroupInvitePreview from '@/components/GroupInvitePreview.vue'
import ItemDetailsCheckboxButton from '@/components/ItemDetailsCheckboxButton.vue'
import ItemDetailsDebug from '@/components/ItemDetailsDebug.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'

import debounce from 'lodash-es/debounce'
import qs from '@aguezz/qs-parse'
import { nanoid } from 'nanoid'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const connectionStore = useConnectionStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const userNotificationStore = useUserNotificationStore()
const uploadStore = useUploadStore()
const broadcastStore = useBroadcastStore()
const apiStore = useApiStore()

let prevCardId, prevCardName
let previousTags = []
let compositionEventEndTime = 0

const openingPreDuration = 5 // ms
const openingDuration = 400 // ms
let openingAnimationTimer, openingStartTime, shouldCancelOpening

const dialogElement = ref(null)
const nameElement = ref(null)

let unsubscribes

onMounted(() => {
  const globalActionUnsubscribe = globalStore.$onAction(
    async ({ name, args }) => {
      if (name === 'triggerUnloadPage' && visible.value) {
        closeCard()
      } else if (name === 'triggerSplitCard' && visible.value) {
        const cardId = args[0]
        if (cardId !== card.value.id) { return }
        splitCards()
      } else if (name === 'updateCardDetailsIsVisibleForCardId') {
        const cardId = args[0]
        if (prevCardId) {
          updateDimensions(prevCardId)
        }
        if (!cardId) { return }
        prevCardId = cardId
        showCard(cardId)
      } else if (name === 'triggerUpdateCardDetailsCardName') {
        const { cardId, name } = args[0]
        if (cardId !== card.value.id) { return }
        cancelOpening()
        updateCardName(name)
      } else if (name === 'triggerUpdateCardDimensionsAndPaths') {
        const cardId = args[0]
        if (cardId !== card.value.id) { return }
        await updateDimensionsAndPaths()
      }
    }
  )
  const cardActionUnsubscribe = cardStore.$onAction(
    async ({ name, args }) => {
      if (name === 'updateCardsState' && visible.value) {
        const updates = args[0]
        const isCurrentCard = updates.some(update => {
          const isId = update.id === card.value.id
          return update.name && isId
        })
        textareaSizes()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
    cardActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
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
  shareItemIsVisible: false
})

const cardId = computed(() => globalStore.cardDetailsIsVisibleForCardId)
const card = computed(() => {
  return cardStore.getCard(cardId.value) || {}
})
const visible = computed(() => utils.objectHasKeys(card.value))
const freeUploadSizeLimit = computed(() => consts.freeUploadSizeLimit)
watch(() => visible.value, (value, prevValue) => {
  if (value) {
    globalStore.preventMultipleSelectedActionsIsVisible = false
  } else {
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
  globalStore.closeAllDialogs()
  document.querySelector(`.card[data-card-id="${prevCardId}"]`).focus()
}
const closeDialogs = (shouldSkipGlobalDialogs) => {
  globalStore.triggerCloseChildDialogs()
  state.imagePickerIsVisible = false
  state.cardTipsIsVisible = false
  state.shareItemIsVisible = false
  hidePickers()
  if (shouldSkipGlobalDialogs === true) { return }
  hideTagDetailsIsVisible()
  hideOtherItemDetailsIsVisible()
}
const triggerSignUpOrInIsVisible = () => {
  globalStore.triggerSignUpOrInIsVisible()
}
const triggerUpgradeUserIsVisible = () => {
  globalStore.triggerUpgradeUserIsVisible()
}
const clearErrors = () => {
  state.error.signUpToUpload = false
  state.error.sizeLimit = false
  state.error.unknownUploadError = false
}
const hideOtherItemDetailsIsVisible = () => {
  globalStore.otherCardDetailsIsVisible = false
}
const showTagDetailsIsVisible = (event, tag) => {
  closeDialogs()
  const element = event.target.closest('.tag')
  const tagRect = element.getBoundingClientRect()
  globalStore.tagDetailsPosition = {
    x: window.scrollX + tagRect.x + 2,
    y: window.scrollY + tagRect.y + tagRect.height - 2,
    pageX: window.scrollX,
    pageY: window.scrollY
  }
  globalStore.currentSelectedTag = tag
  globalStore.tagDetailsIsVisible = true
}

// styles

const styles = computed(() => {
  let zoom = globalStore.getSpaceCounterZoomDecimal
  if (utils.isAndroid()) {
    zoom = utils.visualViewport().scale
  } else if (globalStore.isTouchDevice) {
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
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}
const shouldShowItemActions = computed(() => userStore.shouldShowItemActions)
const rowIsBelowItemActions = computed(() => nameMetaRowIsVisible.value || badgesRowIsVisible.value || shouldShowItemActions.value || cardHasMedia.value || cardUrlPreviewIsVisible.value)
const nameMetaRowIsVisible = computed(() => state.nameSplitIntoCardsCount)
const badgesRowIsVisible = computed(() => tagsInCard.value.length || isInSearchResultsCards.value)
const triggerUpdateHeaderAndFooterPosition = () => {
  globalStore.triggerUpdateHeaderAndFooterPosition()
}
const scrollIntoViewAndFocus = async () => {
  let behavior
  if (utils.isIPhone()) {
    behavior = 'auto'
  }
  await nextTick()
  scrollIntoView(behavior)
  focusName()
  triggerUpdatePaintSelectCanvasPositionOffset()
}
const triggerUpdatePaintSelectCanvasPositionOffset = () => {
  globalStore.triggerUpdatePaintSelectCanvasPositionOffset()
  triggerUpdateHeaderAndFooterPosition()
}

// dimensions and connection paths

const updateDimensions = async (cardId) => {
  await nextTick()
  cardStore.updateCardDimensions(cardId)
  await nextTick()
  await nextTick()
}
const updateDimensionsAndPathsDebounced = debounce(async () => {
  await updateDimensionsAndPaths()
}, 200)
const updateDimensionsAndPaths = async (cardId) => {
  cardId = cardId || card.value.id
  await updateDimensions(cardId)
  updatePaths(cardId)
}
const updatePaths = async (cardId) => {
  cardId = cardId || card.value.id
  await nextTick()
  connectionStore.updateConnectionPathByItemId(cardId)
}

// space

const spacePrivacyIsOpen = computed(() => spaceStore.privacy === 'open')
const spacePrivacyIsClosed = computed(() => spaceStore.privacy === 'closed')
const isInSearchResultsCards = computed(() => {
  const ids = globalStore.searchResultsCardIds
  if (!ids.length) { return }
  return Boolean(ids.find(id => card.value.id === id))
})
const canEditSpace = computed(() => userStore.getUserCanEditSpace)
const isInvitedButCannotEditSpace = computed(() => globalStore.currentUserIsInvitedButCannotEditCurrentSpace)

// user

const isSpaceMember = computed(() => userStore.getUserIsSpaceMember)
const isFavoriteSpace = computed(() => spaceStore.getSpaceIsFavorite())
const canEditCard = computed(() => userStore.getUserCanEditCard(card.value))
const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)
const createdByUser = computed(() => {
  const userId = card.value.userId
  const user = spaceStore.getSpaceUserById(userId)
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
  const user = spaceStore.getSpaceUserById(userId)
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
    userId: userStore.id
  }
  broadcastStore.update({ updates, action: 'updateRemoteCardDetailsVisible' })
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
  console.info('🎹 enter', {
    shouldPreventNextEnterKey: globalStore.shouldPreventNextEnterKey,
    pickersIsVisible
  })
  if (globalStore.shouldPreventNextEnterKey) {
    globalStore.shouldPreventNextEnterKey = false
  } else if (pickersIsVisible) {
    triggerPickerSelectItem(event)
    hidePickers()
  } else if (state.insertedLineBreak) {
    state.insertedLineBreak = false
  // eslint-disable-next-line no-empty
  } else if (isCompositionEvent) {
  } else {
    closeCard()
    globalStore.closeAllDialogs()
    globalStore.shouldPreventNextEnterKey = false
    globalStore.triggerAddCard()
  }
}
const removeCard = () => {
  if (!canEditCard.value) { return }
  cardStore.removeCards([cardId.value])
  globalStore.updateCardDetailsIsVisibleForCardId('')
  triggerUpdateHeaderAndFooterPosition()
}
const toggleShouldShowItemActions = async () => {
  closeDialogs()
  const isVisible = !shouldShowItemActions.value
  userStore.updateUser({ shouldShowItemActions: isVisible })
  await nextTick()
  scrollIntoView()
}
const toggleShareItemIsVisible = (event) => {
  const isVisible = state.shareItemIsVisible
  closeDialogs()
  state.shareItemIsVisible = !isVisible
  copyCardUrl(event)
}
const scrollIntoView = async (behavior) => {
  // wait for element to be rendered before getting position
  await nextTick()
  await nextTick()
  await nextTick()
  const element = dialogElement.value
  globalStore.scrollElementIntoView({ element, behavior })
}
const showCard = async (cardId) => {
  await nextTick()
  broadcastShowCardDetails()
  clearErrors()
  updatePinchCounterZoomDecimal()
  scrollIntoViewAndFocus()
  await updatePreviousTags()
  updateNameSplitIntoCardsCount()
  resetTextareaHeight()
  await nextTick()
  startOpening()
  const item = cardStore.getCard(cardId)
  globalStore.checkIfItemShouldIncreasePageSize(item)
  state.previousSelectedTag = {}
  updateMediaUrls()
  const connections = connectionStore.getConnectionsByItemId(cardId)
  globalStore.updateCurrentCardConnections(connections)
  prevCardName = card.value.name
  textareaSizes()
}
const closeCard = async () => {
  globalStore.triggerHideTouchInterface()
  const cardId = prevCardId
  const item = cardStore.getCard(cardId)
  nameElement.value.blur() // safari scroll fix
  closeDialogs(true)
  cancelOpening()
  spaceStore.removeUnusedTagsFromCard(cardId)
  globalStore.updateCurrentCardConnections()
  globalStore.triggerUpdateHeaderAndFooterPosition()
  globalStore.shouldPreventNextEnterKey = false
  if (!item) { return }
  const cardHasName = Boolean(item.name)
  const cardHasPendingUpload = uploadStore.hasPendingUploadForCardId(cardId)
  if (!cardHasName && !cardHasPendingUpload) {
    cardStore.removeCard(cardId)
  }
  globalStore.updatePageSizes()
  updateDimensionsAndPaths(cardId)
  globalStore.checkIfItemShouldIncreasePageSize(item)
  const tags = spaceStore.getSpaceTagsInCard(item)
  if (tags.length) {
    await apiStore.addToQueue({ name: 'updateTags', body: { tags } })
  }
}

// share url

const cardUrl = () => {
  const domain = consts.kinopioDomain()
  const url = `${domain}/${card.value.spaceId}/${card.value.id}`
  console.info('🍇 card url', url)
  return url
}
const copyCardUrl = async (event) => {
  if (!state.shareItemIsVisible) { return }
  const canShare = spaceStore.getSpaceIsRemote
  if (!canShare) { return }
  globalStore.clearNotificationsWithPosition()
  const position = utils.cursorPositionInPage(event)
  const url = cardUrl()
  try {
    await navigator.clipboard.writeText(url)
    globalStore.addNotificationWithPosition({ message: 'Copied Link', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyText', error)
    globalStore.addNotificationWithPosition({ message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}

// name

const textareaSizes = async () => {
  await nextTick()
  await nextTick()
  await nextTick()
  const element = nameElement.value
  if (!element) { return }
  element.style.height = 'auto'
  element.style.height = element.scrollHeight + 2 + 'px' // +2 for chromium scrollbar fix
}
const resetTextareaHeight = () => {
  if (!visible.value) { return }
  nameElement.value.style.height = 'initial'
}
const focusName = async (position) => {
  if (globalStore.shouldPreventNextFocusOnName) {
    triggerUpdateHeaderAndFooterPosition()
    globalStore.shouldPreventNextFocusOnName = false
    return
  }
  await nextTick()
  const element = nameElement.value
  const length = name.value.length
  utils.focusTextarea(element)
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
    if (globalStore.shouldPreventNextEnterKey) {
      globalStore.shouldPreventNextEnterKey = false
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
  }
})
const updateCardName = async (newName) => {
  const cardId = globalStore.cardDetailsIsVisibleForCardId
  if (card.value.id !== cardId) {
    return
  }
  const userId = userStore.id
  const update = {
    id: cardId,
    name: newName,
    nameUpdatedAt: new Date(),
    nameUpdatedByUserId: userId
  }
  cardStore.updateCard(update)
  cardStore.updateCardDimensions(cardId)
  updateMediaUrls()
  await updateTags()
  updateDimensionsAndPathsDebounced()
  if (createdByUser.value.id !== userStore.id) { return }
  if (state.notifiedMembers) { return } // send card update notifications only once per card, per session
  if (newName) {
    userNotificationStore.addCardUpdated({ cardId: card.value.id, type: 'updateCard' })
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
  triggerUpdatePaintSelectCanvasPositionOffset()
  globalStore.searchIsVisible = false
  if (isCursorInsideTagBrackets()) {
    showTagPicker()
    event.stopPropagation()
  } else if (isCursorInsideSlashCommand()) {
    showSpacePicker()
    updateSpacePickerSearch()
    event.stopPropagation()
  }
}

// character limit

const maxCardCharacterLimit = computed(() => consts.cardCharacterLimit)
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
  const userColor = userStore.color
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
    borderRadius
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
  if (globalStore.preventCardDetailsOpeningAnimation || !card.value.name) {
    globalStore.currentDraggingCardId = ''
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
    console.info('🐢 cardDetails openingAnimationFrame complete')
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

const currentSelectedTag = computed(() => globalStore.currentSelectedTag)

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
  const endText = name.value.substring(cursorStart)
  let newCursorPosition = endText.indexOf(']]')
  newCursorPosition = cursorStart + newCursorPosition + 2
  setSelectionRange(newCursorPosition, newCursorPosition)
}
const updatePreviousTags = async () => {
  if (!card.value.name) {
    previousTags = []
    return
  }
  previousTags = utils.tagsFromStringWithoutBrackets(card.value.name) || []
  previousTags = previousTags.map(async (tagName) => {
    let tag
    if (state.previousSelectedTag.name === tagName) {
      tag = state.previousSelectedTag
    } else if (state.currentSearchTag.name === tagName) {
      tag = state.currentSearchTag
    } else {
      tag = await spaceStore.getSpaceTagByName(tagName)
      tag = utils.clone(tag, state.previousSelectedTag, tagName)
      tag.color = state.previousSelectedTag.color || tag.color
    }
    return tag
  })
}
const updateNewTagColor = (color) => {
  state.newTagColor = color
}
const addNewTags = async (newTagNames) => {
  const previousTagNames = previousTags.map(tag => tag.name)
  const addTagsNames = newTagNames.filter(newTagName => !previousTagNames.includes(newTagName))
  for (const tagName of addTagsNames) {
    const tag = globalStore.getNewTag({
      name: tagName,
      defaultColor: state.newTagColor || userStore.color,
      cardId: card.value.id,
      spaceId: spaceStore.id
    })
    if (state.previousSelectedTag.name === tagName) {
      tag.color = state.previousSelectedTag.color
    } else if (state.currentSearchTag.name === tagName) {
      tag.color = state.currentSearchTag.color
    }
    await spaceStore.addTag(tag)
  }
}
const updateTags = async () => {
  if (!card.value.name) { return }
  const newTagNames = utils.tagsFromStringWithoutBrackets(card.value.name) || []
  await addNewTags(newTagNames)
  await updatePreviousTags()
}
const hideTagDetailsIsVisible = () => {
  globalStore.currentSelectedTag = {}
  globalStore.tagDetailsIsVisible = false
}
const updateCurrentSearchTag = async (tag) => {
  state.currentSearchTag = tag
  await updatePreviousTags()
}
const updateTagBracketsWithTag = async (tag) => {
  state.previousSelectedTag = tag
  await updatePreviousTags()
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
  globalStore.shouldPreventNextEnterKey = false
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
  spaceStore.removeUnusedTagsFromCard(card.value.id)
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
    globalStore.triggerPickerNavigationKey(event.key)
    event.preventDefault()
  }
}
const triggerPickerSelectItem = (event) => {
  const modifierKey = event.altKey || event.shiftKey || event.ctrlKey || event.metaKey
  const pickerIsVisible = state.tag.pickerIsVisible || state.space.pickerIsVisible
  const shouldTrigger = pickerIsVisible && !modifierKey
  if (shouldTrigger) {
    globalStore.triggerPickerSelect()
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

// text edit actions

const selectionEndPosition = () => {
  if (!nameElement.value) { return }
  const position = nameElement.value.selectionEnd
  const endPosition = position
  return endPosition
}
const toggleTextEditWrapAction = async (action) => {
  if (!visible.value) { return }
  const startPosition = selectionStartPosition()
  const endPosition = selectionEndPosition()
  const { newName, offset } = utils.nameTextEditAction({
    action,
    startPosition,
    endPosition,
    name: nameElement.value.value
  })
  updateCardName(newName)
  await nextTick()
  setSelectionRange(startPosition + offset, endPosition + offset)
}
const textEditLinkAction = async () => {
  // lol → [lol](url)
  if (!visible.value) { return }
  const startPosition = selectionStartPosition()
  const endPosition = selectionEndPosition()
  const name = nameElement.value.value
  let before = name.slice(0, startPosition)
  let selected = name.slice(startPosition, endPosition)
  const after = name.slice(endPosition)
  before = before + '['
  selected = selected + '](url)'
  const newName = before + selected + after
  const newStartPosition = endPosition + 3 // [](
  const newEndPosition = newStartPosition + 3 // url
  updateCardName(newName)
  await nextTick()
  setSelectionRange(newStartPosition, newEndPosition)
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
const isComment = computed(() => card.value.isComment || nameIsComment.value)

const tagsInCard = computed(() => {
  const tagNames = utils.tagsFromStringWithoutBrackets(name.value)
  if (!tagNames) { return [] }
  const tags = []
  tagNames.forEach(name => {
    const tag = spaceStore.getSpaceTagByName(name)
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
  const item = globalStore.getOtherCardById(card.value.linkToCardId)
  return item
})
const otherCardUrl = computed(() => utils.urlFromSpaceAndItem({ itemId: card.value.linkToCardId, spaceId: card.value.linkToSpaceId }))

// other space

const otherSpaceIsVisible = computed(() => {
  const isCardLink = Boolean(card.value.linkToSpaceId)
  return isCardLink && hasUrls.value
})
const otherSpace = computed(() => {
  const space = globalStore.getOtherSpaceById(card.value.linkToSpaceId)
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
  const isLoading = globalStore.urlPreviewLoadingForCardIds.find(cardId => cardId === card.value.id)
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
  globalStore.removeUrlPreviewLoadingForCardIds(cardId)
  cardStore.updateCard(update)
}

// group invite preview

const groupInviteUrl = computed(() => {
  const urls = validUrls.value
  return urls.find(url => utils.urlIsGroupInvite(url))
})

// media

const urlIsAudio = computed(() => utils.urlIsAudio(url.value))
const cardHasMedia = computed(() => Boolean(state.formats.image || state.formats.video || state.formats.audio))
const addImageOrFile = async (file) => {
  const cardId = card.value.id
  const spaceId = spaceStore.id
  // remove existing image url
  const prevImageOrFile = state.formats.image || state.formats.video || state.formats.file
  if (prevImageOrFile) {
    const newName = name.value.replace(prevImageOrFile, '')
    updateCardName(newName)
  }
  // add new image or file url
  globalStore.triggerUploadComplete({
    cardId,
    spaceId,
    url: file.url,
    filename: file.name
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
  const pendingUploads = uploadStore.pendingUploads
  return pendingUploads.find(upload => upload.cardId === card.value.id)
})
const uploadFile = async (file) => {
  if (!currentUserIsSignedIn.value) {
    state.error.signUpToUpload = true
    return
  }
  try {
    await uploadStore.uploadFile({ file, cardId: card.value.id })
    closeDialogs()
    textareaSizes()
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
  const user = userStore.getUserAllState
  // create new split cards
  const newCards = cardNames.map((cardName, index) => {
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
  newCards.shift()
  addSplitCards(newCards)
}
const addSplitCards = async (newCards) => {
  const spaceBetweenCards = 12
  let prevCard = utils.clone(card.value)
  globalStore.closeAllDialogs()
  cardStore.createCards(newCards)
  // update y positions
  // wait for cards to be added to dom
  setTimeout(() => {
    for (const newCard of newCards) {
      const element = document.querySelector(`.card-wrap [data-card-id="${prevCard.id}"]`)
      const prevCardRect = element.getBoundingClientRect()
      newCard.y = prevCard.y + (prevCardRect.height * globalStore.getSpaceCounterZoomDecimal) + spaceBetweenCards
      cardStore.updateCard(newCard)
      globalStore.triggerUpdateUrlPreview(newCard.id)
      prevCard = newCard
    }
    globalStore.updatePageSizes()
  }, 150)
}

// copy paste

const updatePastedName = (event) => {
  const files = event.clipboardData.files
  if (files.length) {
    const file = files[0]
    cardStore.insertCardUploadPlaceholder(file, card.value.id)
    uploadFile(file)
    return
  } else {
    const text = event.clipboardData.getData('text')
    state.pastedName = text
  }
  state.wasPasted = true
  cardStore.normalizeCardUrls(cardId.value)
}

// line break

const checkIfIsInsertLineBreak = (event) => {
  const lineBreakInserted = event.ctrlKey || event.altKey
  if (!lineBreakInserted) {
    state.insertedLineBreak = false
  }
}
const conditionalInsertLineBreak = (event) => {
  const shouldAddChildCard = userStore.cardSettingsShiftEnterShouldAddChildCard
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
  globalStore.shouldPreventNextEnterKey = false
  const update = {
    id: card.value.id,
    shouldShowOtherSpacePreviewImage: true
  }
  cardStore.updateCard(update)
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
  const text = name.value.substring(0, cursorStart)
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
  globalStore.pinchCounterZoomDecimal = 1
}
const updatePinchCounterZoomDecimal = () => {
  globalStore.pinchCounterZoomDecimal = utils.pinchCounterZoomDecimal()
}
</script>

<template lang="pug">
dialog.card-details(v-if="visible" :open="visible" ref="dialogElement" @click.left="closeDialogs" @keyup.stop.backspace="removeCard" :style="styles" :data-card-id="card.id")
  .opening-frame(v-if="state.isOpening" :style="openingFrameStyle")
  section
    .textarea-wrap
      textarea.name(
        data-1p-ignore
        autocomplete="off"

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

        @keydown.meta.b.exact.stop.prevent="toggleTextEditWrapAction('bold')"
        @keydown.ctrl.b.exact.stop.prevent="toggleTextEditWrapAction('bold')"
        @keydown.meta.i.exact.stop.prevent="toggleTextEditWrapAction('italic')"
        @keydown.ctrl.i.exact.stop.prevent="toggleTextEditWrapAction('italic')"
        @keydown.meta.k.exact.stop.prevent="textEditLinkAction"
        @keydown.ctrl.k.exact.stop.prevent="textEditLinkAction"

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
        :shouldShowNewSpace="currentUserIsSignedIn"
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
        ItemDetailsCheckboxButton(:cards="[card]" :isDisabled="!canEditCard")
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
      .button-wrap.share-button-wrap(v-if="name" @click.left.stop="toggleShareItemIsVisible" )
        button(:class="{active: state.shareItemIsVisible}")
          span Share
        ShareItem(:visible="state.shareItemIsVisible" :item="card" type="card" :isReadOnly="!canEditCard")

    CardOrBoxActions(:visible="shouldShowItemActions && canEditCard" :cards="[card]" @closeDialogs="closeDialogs" :class="{ 'last-row': !rowIsBelowItemActions }" :tagsInCard="tagsInCard" :backgroundColorIsFromTheme="true")
    CardDetailsMeta(:visible="shouldShowItemActions || isComment" :createdByUser="createdByUser" :updatedByUser="updatedByUser" :card="card" :parentElement="parentElement" @closeDialogs="closeDialogs" :isComment="isComment")

    .row(v-if="nameMetaRowIsVisible && canEditCard")
      //- Split by Line Breaks
      .button-wrap(v-if="state.nameSplitIntoCardsCount")
        button.small-button(:disabled="!canEditCard" @click.left.stop="splitCards")
          img.icon(src="@/assets/split.svg")
          span Split Card
          span.badge.secondary.badge-in-button.small-button-text.badge-split-card-count {{state.nameSplitIntoCardsCount}}

    .row.badges-row(v-if="badgesRowIsVisible")
      //- Search result
      span.badge.search(v-if="isInSearchResultsCards")
        img.icon.search(src="@/assets/search.svg")
      //- Tags
      template(v-for="tag in tagsInCard")
        Tag(:tag="tag" :isClickable="true" :isActive="currentSelectedTag.name === tag.name" @clickTag="showTagDetailsIsVisible")

    .row.badges-row.other-items-row(v-if="otherCardIsVisible")
      OtherCardPreview(:otherCard="otherCard" :url="otherCardUrl" :parentCardId="card.id" :shouldTruncateName="true")

    MediaPreview(:visible="cardHasMedia" :card="card" :formats="state.formats")

    template(v-if="groupInviteUrl")
      GroupInvitePreview(
        :card="card"
        :groupInviteUrl="groupInviteUrl"
        :parentIsCardDetails="true"
      )
    template(v-else-if="urlPreviewIsVisible")
      UrlPreview(
        :visible="true"
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
      CardDetailsMeta(:visible="!shouldShowItemActions" :createdByUser="createdByUser" :updatedByUser="updatedByUser" :card="card" :parentElement="parentElement" @closeDialogs="closeDialogs")
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
      p Cards can't be longer than {{maxCardCharacterLimit}} characters
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
        span To upload files over {{freeUploadSizeLimit}}mb,
        span.badge.info upgrade for unlimited
      button(@click.left="triggerUpgradeUserIsVisible") Upgrade for Unlimited
    template(v-if="state.error.unknownUploadError")
      .badge.danger (シ_ _)シ Something went wrong, Please try again or contact support
    ItemDetailsDebug(:item="card" :keys="['x', 'y', 'width', 'height']")
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

  .badge-split-card-count
    margin-right 0
    margin-left 5px
</style>
