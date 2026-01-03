<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useCardStore } from '@/stores/useCardStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useUploadStore } from '@/stores/useUploadStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'
import { useThemeStore } from '@/stores/useThemeStore'

import utils from '@/utils.js'
import Frames from '@/components/Frames.vue'
import Loader from '@/components/Loader.vue'
import Audio from '@/components/Audio.vue'
import NameSegment from '@/components/NameSegment.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'
import OtherCardPreview from '@/components/OtherCardPreview.vue'
import GroupInvitePreview from '@/components/GroupInvitePreview.vue'
import ItemConnectorButton from '@/components/ItemConnectorButton.vue'
import ItemCheckboxButton from '@/components/ItemCheckboxButton.vue'
import consts from '@/consts.js'
import postMessage from '@/postMessage.js'

// Card only child components
import OtherSpacePreviewCard from '@/components/OtherSpacePreviewCard.vue'
import CardVote from '@/components/CardVote.vue'
import TiltResize from '@/components/TiltResize.vue'
import UrlPreviewCard from '@/components/UrlPreviewCard.vue'
import ImageOrVideo from '@/components/ImageOrVideo.vue'

import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday'
import qs from '@aguezz/qs-parse'
import randomColor from 'randomcolor'
import { nanoid } from 'nanoid'
import { colord, extend } from 'colord'
import namesPlugin from 'colord/plugins/names'

dayjs.extend(isToday)
extend([namesPlugin])

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const connectionStore = useConnectionStore()
const boxStore = useBoxStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()
const groupStore = useGroupStore()
const broadcastStore = useBroadcastStore()
const uploadStore = useUploadStore()
const themeStore = useThemeStore()

const cardElement = ref(null)

let isMultiTouch
let initialTouchEvent = {}
let touchPosition = {}
let currentTouchPosition = {}
const defaultCardPosition = 100

// locking
// long press to touch drag card
const lockingPreDuration = 100 // ms
const lockingDuration = 100 // ms
let lockingAnimationTimer, lockingStartTime, shouldCancelLocking

// sticky
const stickyTimerDuration = 250
let preventSticking = false
let stickyTimerComplete = false
let stickyTimer
let stickyMap

let prevIsLoadingUrlPreview

let observer

let unsubscribes

onMounted(async () => {
  updateDefaultBackgroundColor(utils.cssVariable('secondary-background'))
  const shouldFocus = globalStore.loadSpaceFocusOnCardId === props.card.id
  if (shouldFocus) {
    globalStore.updateFocusOnCardId(props.card.id)
  }
  await updateUrlPreviewOnload()
  updateUrls()
  checkIfShouldUpdateIframeUrl()
  initViewportObserver()

  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'updateRemoteCurrentConnection' || name === 'removeRemoteCurrentConnection') {
        updateRemoteConnections()
      } else if (name === 'triggerScrollCardIntoView') {
        if (args[0] === props.card.id) {
          const element = cardElement.value
          globalStore.scrollElementIntoView({ element, positionIsCenter: true })
        }
      } else if (name === 'triggerUploadComplete') {
        const { cardId, url } = args[0] // cardId, spaceId, url, fileName
        if (cardId !== props.card.id) { return }
        addCompletedUpload(args[0])
      } else if (name === 'triggerUpdateUrlPreview') {
        if (args[0] === props.card.id) {
          updateMediaUrls()
          updateUrlPreview()
        }
      } else if (name === 'triggerUpdateTheme') {
        updateDefaultBackgroundColor(utils.cssVariable('secondary-background'))
      } else if (name === 'triggerCancelLocking') {
        cancelLocking()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  removeViewportObserver()
  unsubscribes()
})

const props = defineProps({
  card: Object
})

const state = reactive({
  sessionStartDate: new Date(),
  isRemoteConnecting: false,
  remoteConnectionColor: '',
  uploadIsDraggedOver: false,
  isPlayingAudio: false,
  preventDraggedButtonBadgeFromShowingDetails: false,
  error: {
    sizeLimit: false,
    unknownUploadError: false,
    signUpToUpload: false,
    spaceIsReadOnly: false
  },
  formats: {
    image: '',
    video: '',
    audio: '',
    link: '',
    file: ''
  },
  linkToPreview: '',
  prevNameLineMinWidth: 0,
  isLocking: true,
  lockingPercent: 0,
  lockingAlpha: 0,
  stickyTranslateX: 0,
  stickyTranslateY: 0,
  isAnimationUnsticking: false,
  stickyStretchResistance: 6,
  defaultBackgroundColor: '#e3e3e3',
  pathIsUpdated: false,
  isVisibleInViewport: false,
  shouldRenderParent: false,
  safeColors: {},
  urls: []
})
watch(() => props.card.name, (value, prevValue) => {
  updateUrls()
})
watch(() => state.linkToPreview, (value, prevValue) => {
  updateUrlData()
})
const updateUrlData = () => {
  updateOtherItems()
  updateUrlPreview()
}

const canEditCard = computed(() => userStore.getUserCanEditCard(props.card))
const isSelectedOrDragging = computed(() => {
  return Boolean(
    isSelected.value ||
    isRemoteSelected.value ||
    isRemoteCardDetailsVisible.value ||
    isRemoteCardDragging.value ||
    state.uploadIsDraggedOver ||
    remoteUploadDraggedOverCardColor.value ||
    remoteUserResizingCardsColor.value ||
    remoteUserTiltingCardsColor.value
  )
})
const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)
const currentUserColor = computed(() => userStore.color)

// current space

const canEditSpace = computed(() => userStore.getUserCanEditSpace)
const changeSpace = async (url) => {
  const { spaceId, spaceUrl, cardId } = utils.spaceAndCardIdFromUrl(url)
  if (cardId) {
    changeSpaceAndCard(spaceId, cardId)
  } else {
    const space = { id: spaceId }
    spaceStore.changeSpace(space)
  }
  globalStore.closeAllDialogs()
}
const changeSpaceAndCard = async (spaceId, cardId) => {
  const currentSpaceId = spaceStore.id
  // space and card
  if (currentSpaceId !== spaceId) {
    globalStore.loadSpaceFocusOnCardId = cardId
    const space = { id: spaceId }
    spaceStore.changeSpace(space)
  // card in current space
  } else {
    await nextTick()
    cardStore.showCardDetails(cardId)
  }
}

// user theme

const isThemeDark = computed(() => userStore.theme === 'dark')
const isDarkInLightTheme = computed(() => backgroundColorIsDark.value && !isThemeDark.value)
const isLightInDarkTheme = computed(() => !backgroundColorIsDark.value && isThemeDark.value)

// background color

const updateDefaultBackgroundColor = (color) => {
  state.defaultBackgroundColor = color
}
const currentBackgroundColor = computed(() => {
  return selectedColor.value || remoteSelectedColor.value || props.card.backgroundColor
})
const backgroundColor = computed(() => {
  let nameColor
  if (nameIsColor.value) {
    nameColor = props.card.name.trim()
  }
  const color = selectedColor.value || remoteCardDetailsVisibleColor.value || remoteSelectedColor.value || selectedColorUpload.value || remoteCardDraggingColor.value || remoteUploadDraggedOverCardColor.value || remoteUserResizingCardsColor.value || remoteUserTiltingCardsColor.value || nameColor || props.card.backgroundColor
  return color
})
const backgroundColorIsDark = computed(() => {
  const color = props.card.backgroundColor || state.defaultBackgroundColor
  return utils.colorIsDark(color)
})
const nameIsColor = computed(() => {
  const name = props.card.name.trim()
  return colord(name).isValid()
})
const currentBackgroundColorIsDark = computed(() => {
  const color = backgroundColor.value || props.card.backgroundColor || state.defaultBackgroundColor
  return utils.colorIsDark(color)
})

// comment

const isComment = computed(() => cardStore.getIsCommentCard(props.card))

const removeCommentBrackets = (name) => {
  if (!isComment.value) { return name }
  if (props.card.isComment) { return name }
  const commentPattern = utils.commentPattern()
  const comments = name.match(commentPattern)
  comments.forEach(comment => {
    const content = comment.substring(2, comment.length - 2)
    name = name.replace(comment, content)
  })
  return name
}

// checkbox

const isChecked = computed(() => utils.nameIsChecked(props.card.name))
const hasCheckbox = computed(() => {
  return Boolean(utils.checkboxFromString(props.card.name))
})

// media

const isImageCard = computed(() => Boolean(state.formats.image || state.formats.video))
const iframeIsVisible = computed(() => {
  // youtube, spotify etc.
  const iframeIsVisibleForCardId = globalStore.iframeIsVisibleForCardId
  return props.card.id === iframeIsVisibleForCardId
})
const isVisualCard = computed(() => {
  if (isComment.value) { return }
  return state.formats.image || state.formats.video
})
const isAudioCard = computed(() => {
  if (isComment.value) { return }
  return state.formats.audio
})
const cardHasMedia = computed(() => state.formats.image || state.formats.video || state.formats.audio)
const updateMediaUrls = (urls) => {
  urls = urls || state.urls
  state.formats.image = ''
  state.formats.video = ''
  state.formats.audio = ''
  state.formats.link = ''
  state.formats.file = ''
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
      state.linkToPreview = url
    }
  })
}
const updateIsPlayingAudio = (value) => {
  state.isPlayingAudio = value
  cancelLocking()
}

// group invite

const groupInviteUrl = computed(() => {
  const urls = state.urls || []
  return urls.find(url => utils.urlIsGroupInvite(url))
})

// other card

const otherCardUrl = computed(() => utils.urlFromSpaceAndItem({ itemId: props.card.linkToCardId, spaceId: props.card.linkToSpaceId }))
const otherCard = computed(() => {
  const card = globalStore.getOtherCardById(props.card.linkToCardId)
  return card
})
const otherCardIsVisible = computed(() => {
  if (!props.card.linkToCardId) { return }
  const urls = state.urls || []
  const value = urls.find((url) => {
    return url?.includes(props.card.linkToCardId)
  })
  return Boolean(value)
})

// other space

const otherSpaceSegment = computed(() => nameSegments.value.find(segment => segment.otherSpace))
const otherSpace = computed(() => {
  const nameSegment = otherSpaceSegment.value
  return nameSegment?.otherSpace
})
const otherSpaceUrl = computed(() => {
  const nameSegment = otherSpaceSegment.value
  return nameSegment?.name
})
const spaceOrInviteUrl = computed(() => {
  const link = state.formats.link
  if (utils.urlIsSpace(link) || utils.urlIsSpaceInvite(link)) {
    return link
  } else {
    return null
  }
})
const otherSpaceIsVisible = computed(() => {
  if (!props.card.linkToSpaceId) { return }
  const name = props.card.name
  const urls = utils.urlsFromString(name) || []
  const value = urls.find((url) => {
    return url?.includes(props.card.linkToSpaceId)
  })
  return Boolean(value)
})

// space search

const isInSearchResultsCards = computed(() => {
  const ids = globalStore.searchResultsCardIds
  if (!ids.length) { return }
  return Boolean(ids.find(id => props.card.id === id))
})
const filterShowUsers = computed(() => userStore.filterShowUsers)
const filterShowDateUpdated = computed(() => userStore.filterShowDateUpdated)
const safeColor = (color) => {
  let newColor = state.safeColors[color]
  if (newColor) {
    return newColor
  } else {
    newColor = utils.safeColor(color)
    state.safeColors[color] = newColor
    return newColor
  }
}

// styles

const cardWrapStyle = computed(() => {
  let z = props.card.z
  let pointerEvents = 'auto'
  if (currentCardDetailsIsVisible.value || currentCardIsBeingDragged.value) {
    z = 2147483646 // max z
  } else if (isLocked.value) {
    pointerEvents = 'none'
  }
  let styles = {
    left: `${x.value}px`,
    top: `${y.value}px`,
    zIndex: z,
    pointerEvents
  }
  if (props.card.isLocked) {
    delete styles.zIndex
  }
  if (!globalStore.currentUserIsDraggingCard) {
    styles.transform = `translate(${state.stickyTranslateX}, ${state.stickyTranslateY})`
  }
  styles = updateStylesWithWidth(styles)
  return styles
})
const cardStyle = computed(() => {
  let nameColor
  const backgroundColor = props.card.backgroundColor
  if (nameIsColor.value) {
    nameColor = props.card.name
  }
  let color = focusColor.value || selectedColor.value || remoteCardDetailsVisibleColor.value || remoteSelectedColor.value || selectedColorUpload.value || remoteCardDraggingColor.value || remoteUploadDraggedOverCardColor.value || remoteUserResizingCardsColor.value || remoteUserTiltingCardsColor.value || nameColor || backgroundColor
  let styles = {
    background: color
  }
  if (isComment.value && !isSelected.value) {
    color = color || state.defaultBackgroundColor
    styles.background = color
  }
  if (props.card.tilt) {
    styles.transform = `rotate(${props.card.tilt}deg)`
  }
  if (isImageCard.value) {
    styles.background = 'transparent'
  }
  if (isImageCard.value && isSelectedOrDragging.value) {
    color = safeColor(color)
    styles.background = color
  }
  styles = updateStylesWithWidth(styles)
  return styles
})
const cardContentStyles = computed(() => {
  let styles = {}
  if (isLocked.value) {
    styles = { marginRight: '2px' }
  }
  if (isAudioCard.value) {
    styles.width = '100%'
  }
  return styles
})
const cardContentWrapStyles = computed(() => {
  const styles = {}
  return updateStylesWithWidth(styles)
})
const addSizeClasses = (classes) => {
  const height = props.card.height
  const sizes = {
    m: 100,
    l: 150
  }
  classes['s-width'] = width.value < sizes.m
  classes['m-width'] = utils.isBetween({ value: width.value, min: sizes.m, max: sizes.l })
  classes['l-width'] = width.value > sizes.l
  classes['s-height'] = height < sizes.m
  classes['m-height'] = utils.isBetween({ value: height, min: sizes.m, max: sizes.l })
  classes['l-height'] = height > sizes.l
  return classes
}
const cardWrapClasses = computed(() => {
  let classes = {
    'is-resizing': globalStore.currentUserIsResizingCard,
    'is-tilting': globalStore.currentUserIsTiltingCard,
    'is-hidden-by-opacity': isHiddenByCommentFilter.value,
    jiggle: shouldJiggle.value
  }
  classes = addSizeClasses(classes)
  return classes
})
const cardClasses = computed(() => {
  let classes = {
    active: isConnectingTo.value || isConnectingFrom.value || state.isRemoteConnecting || currentCardIsBeingDragged.value || state.uploadIsDraggedOver,
    filtered: isFiltered.value,
    'media-card': isVisualCard.value || pendingUploadDataUrl.value,
    'audio-card': isAudioCard.value,
    'is-playing-audio': state.isPlayingAudio,
    'is-locked': isLocked.value,
    'has-url-preview': cardUrlPreviewIsVisible.value,
    'is-dark': backgroundColorIsDark.value,
    'child-is-hovered': currentUserIsHoveringOverUrlButton.value && !currentCardIsBeingDragged.value,
    'is-in-checked-box': isInCheckedBox.value,
    'is-checked': isChecked.value,
    'is-comment': isComment.value
  }
  classes = addSizeClasses(classes)
  return classes
})
const shouldJiggle = computed(() => {
  const max = 500
  const cardIsTooBig = width.value > max || props.card.height > max
  if (cardIsTooBig) { return }
  const isMultipleItemsSelected = globalStore.getIsMultipleItemsSelected
  const isShiftKeyDown = globalStore.currentUserIsBoxSelecting
  if (isMultipleItemsSelected || isShiftKeyDown) { return }
  return isConnectingTo.value || isConnectingFrom.value || state.isRemoteConnecting || currentCardIsBeingDragged.value || isRemoteCardDragging.value
})
const updateStylesWithWidth = (styles) => {
  const cardHasExtendedContent = cardUrlPreviewIsVisible.value || otherCardIsVisible.value || isVisualCard.value || isAudioCard.value
  const cardHasUrlsOrMedia = cardHasMedia.value || Boolean(state.urls.length)
  let cardMaxWidth = resizeWidth.value || props.card.maxWidth || consts.normalCardMaxWidth
  let cardWidth = resizeWidth.value
  if (globalStore.shouldSnapToGrid && currentCardIsBeingResized.value && cardWidth) {
    cardMaxWidth = utils.roundToNearest(cardMaxWidth)
    cardWidth = utils.roundToNearest(cardWidth)
  }
  if (isComment.value) { return styles }
  styles.maxWidth = cardMaxWidth + 'px'
  styles.width = cardWidth + 'px'
  return styles
}
const updatePreviousResultItem = () => {
  const search = globalStore.search
  const ids = globalStore.searchResultsCardIds
  if (!search) { return }
  if (!ids.length) { return }
  if (ids.find(id => id === props.card.id)) {
    globalStore.previousResultItem = props.card
  }
}
const nameSegmentsStyles = computed(() => {
  if (!isImageCard.value) { return }
  return { background: currentBackgroundColor.value }
})

// position and dimensions

const updateDimensionsAndPaths = () => {
  if (globalStore.isLoadingSpace) { return }
  globalStore.triggerUpdateCardDimensionsAndPaths(props.card.id)
}
const checkIfShouldUpdateDimensions = () => {
  if (utils.isMissingDimensions(props.card)) {
    cardStore.updateCardsDimensions([props.card.id])
  }
}
const width = computed(() => {
  if (isComment.value) { return }
  if (currentCardDetailsIsVisible.value) { return }
  const width = props.card.resizeWidth || props.card.width
  if (!width) { return }
  return width
})
const resizeWidth = computed(() => {
  if (isComment.value) { return }
  let resizeWidth = props.card.resizeWidth
  if (iframeIsVisible.value) {
    resizeWidth = resizeWidth || consts.minCardIframeWidth
    resizeWidth = Math.max(resizeWidth, consts.minCardIframeWidth)
  }
  if (!resizeWidth) { return }
  return resizeWidth
})
const tiltDegres = computed(() => props.card.tilt)
const isLocked = computed(() => {
  if (!props.card) { return }
  const isLocked = props.card.isLocked
  return isLocked
})
const tiltResizeIsVisible = computed(() => {
  if (!state.isVisibleInViewport) { return }
  if (isLocked.value) { return }
  if (!canEditSpace.value) { return }
  if (!canEditCard.value) { return }
  if (cardPendingUpload.value || remoteCardPendingUpload.value) { return }
  // on mobile, resize handlers get in the way of touching when zoomed out
  if (globalStore.isTouchDevice || utils.isMobile()) {
    if (globalStore.spaceZoomPercent < 50 || globalStore.pinchCounterZoomDecimal < 0.5) { return }
  }
  return true
})
const x = computed(() => {
  const x = props.card.x
  if (x === undefined || x === null) {
    return defaultCardPosition
  } else {
    return Math.round(x)
  }
})
const y = computed(() => {
  const y = props.card.y
  if (y === undefined || y === null) {
    return defaultCardPosition
  } else {
    return Math.round(y)
  }
})
const remoteUserResizingCardsColor = computed(() => {
  if (!globalStore.remoteUserResizingCards.length) { return }
  let user = globalStore.remoteUserResizingCards.find(user => user.cardIds.includes(props.card.id))
  if (user) {
    user = spaceStore.getSpaceUserById(user.userId)
    return user.color
  } else {
    return undefined
  }
})
const remoteUserTiltingCardsColor = computed(() => {
  if (!globalStore.remoteUserTiltingCards.length) { return }
  let user = globalStore.remoteUserTiltingCards.find(user => user.cardIds.includes(props.card.id))
  if (user) {
    user = spaceStore.getSpaceUserById(user.userId)
    return user.color
  } else {
    return undefined
  }
})

// connections

const isConnectingTo = computed(() => {
  const connectingToId = globalStore.currentConnectionSuccess.id
  if (connectingToId) {
    postMessage.sendHaptics({ name: 'softImpact' })
  }
  return connectingToId === props.card.id
})
const isConnectingFrom = computed(() => {
  return globalStore.currentConnectionStartItemIds.includes(props.card.id)
})
const connectedConnectionTypes = computed(() => connectionStore.getItemConnectionTypes(props.card.id))

// card buttons

const currentUserIsHoveringOverUrlButton = computed(() => {
  return globalStore.currentUserIsHoveringOverUrlButtonCardId === props.card.id
})
const connectorIsVisible = computed(() => {
  const isMember = userStore.getUserIsSpaceMember
  let isVisible
  if (state.isRemoteConnecting) {
    isVisible = true
  } else if (isMember || canEditCard.value || connectedConnectionTypes.value.length) {
    isVisible = true
  }
  return isVisible
})
const connectorIsHiddenByOpacity = computed(() => {
  if (utils.isMobile()) { return }
  const isPresentationMode = globalStore.isPresentationMode
  const isNotHovering = globalStore.currentUserIsHoveringOverCardId !== props.card.id
  const isNotConnected = !isConnectingFrom.value && !isConnectingTo.value && !connectionStore.getAllConnections.length
  return isPresentationMode && isNotHovering && isNotConnected
})
const isCardButtonsVisible = computed(() => {
  return isLocked.value || (cardButtonUrl.value && !isComment.value) || connectorIsVisible.value
})
const isUrlPreviewError = computed(() => {
  if (!props.card.urlPreviewErrorUrl) { return }
  return props.card.urlPreviewUrl === props.card.urlPreviewErrorUrl
})
const urlButtonIsVisible = computed(() => {
  if (isLocked.value) { return }
  if (!cardButtonUrl.value) { return }
  if (isComment.value) { return true }
  if (isUrlPreviewError.value) { return true }
  if (state.formats.file) { return true }
  const isPreviewImageOnly = props.card.urlPreviewIsVisible && props.card.shouldHideUrlPreviewInfo
  if (isPreviewImageOnly) { return true }
  const urlIsSpace = utils.urlIsSpace(state.formats.link)
  if (urlIsSpace) { return true }
  return !props.card.urlPreviewIsVisible
})
const cardButtonUrl = computed(() => {
  const link = state.formats.link
  const file = state.formats.file
  if (utils.urlIsValidTld(link) || utils.urlIsSpace(link) || utils.urlIsValidLocalhost(link)) {
    return link
  } else if (utils.urlHasProtocol(file)) {
    return file
  } else {
    return null
  }
})
const webUrl = computed(() => {
  const link = state.formats.link
  const isValidUrl = utils.urlIsValidTld(link) || utils.urlIsValidLocalhost(link)
  const isNotSpaceUrl = !utils.urlIsSpace(link)
  if (isValidUrl && isNotSpaceUrl) {
    return link
  } else {
    return null
  }
})
const openUrl = async (event, url) => {
  if (event) {
    if (event.metaKey || event.ctrlKey) {
      await nextTick()
      globalStore.closeAllDialogs()
      return
    } else {
      event.preventDefault()
      event.stopPropagation()
    }
  }
  globalStore.closeAllDialogs()
  if (globalStore.cardsWereDragged) {
    return
  }
  const isSpaceUrl = utils.urlIsSpace(url) && !utils.urlIsSpaceInvite(url)
  if (isSpaceUrl) {
    changeSpace(url)
  } else if (event.type === 'touchend') {
    window.location = url
  } else {
    window.open(url) // opens url in new tab
  }
}

// dates, card meta

const updatedAt = computed(() => props.card.nameUpdatedAt || props.card.createdAt)
const dateUpdatedAt = computed(() => {
  const date = updatedAt.value
  const showAbsoluteDate = userStore.filterShowAbsoluteDates
  if (date) {
    if (showAbsoluteDate) {
      return new Date(date).toLocaleString()
    } else {
      return utils.shortRelativeTime(date)
    }
  } else {
    return 'Just now'
  }
})
const dateIsToday = computed(() => {
  const date = updatedAt.value
  if (!date) { return }
  return dayjs(date).isToday()
})
const toggleFilterShowAbsoluteDates = () => {
  cardStore.incrementCardZ(props.card.id)
  globalStore.closeAllDialogs()
  const value = !userStore.filterShowAbsoluteDates
  userStore.updateUser({ filterShowAbsoluteDates: value })
}
const updateRemoteConnections = () => {
  const connection = globalStore.remoteCurrentConnections.find(remoteConnection => {
    const isConnectedToStart = remoteConnection.startItemId === props.card.id
    const isConnectedToEnd = remoteConnection.endItemId === props.card.id
    return isConnectedToStart || isConnectedToEnd
  })
  if (connection) {
    state.isRemoteConnecting = true
    state.remoteConnectionColor = connection.color
  } else {
    state.isRemoteConnecting = false
  }
}

// upload

const cardPendingUpload = computed(() => {
  const pendingUploads = uploadStore.pendingUploads
  return pendingUploads.find(upload => upload.cardId === props.card.id)
})
const remoteCardPendingUpload = computed(() => {
  return globalStore.remotePendingUploads.find(upload => {
    const inProgress = upload.percentComplete < 100
    const isCard = upload.cardId === props.card.id
    return inProgress && isCard
  })
})
const pendingUploadDataUrl = computed(() => {
  if (!cardPendingUpload.value || isComment.value) { return }
  return cardPendingUpload.value.imageDataUrl
})
const selectedColorUpload = computed(() => {
  const color = currentUserColor.value
  if (state.uploadIsDraggedOver) {
    return color
  } else {
    return undefined
  }
})
const remoteUploadDraggedOverCardColor = computed(() => {
  const draggedOverCard = globalStore.remoteUploadDraggedOverCards.find(card => card.cardId === props.card.id)
  if (draggedOverCard) {
    const user = spaceStore.getSpaceUserById(draggedOverCard.userId)
    return user.color
  } else {
    return undefined
  }
})
const addCompletedUpload = async (upload) => {
  const { url, fileName } = upload
  let name = props.card.name
  name = name.replaceAll(consts.uploadPlaceholder, '')
  name = name.replace(fileName, '')
  const urlType = utils.urlType(url)
  const checkbox = utils.checkboxFromString(name)
  const previousUrls = utils.urlsFromString(name) || []
  let isReplaced
  previousUrls.forEach(previousUrl => {
    if (utils.urlType(previousUrl) === urlType) {
      name = name.replace(previousUrl.trim(), url)
      isReplaced = true
    }
  })
  if (!isReplaced) {
    name = utils.trim(name)
    name = `${url}\n\n${name}`
  }
  // ensure checkbox is first
  if (checkbox) {
    name = name.replace(checkbox, '')
    name = `${checkbox} ${name}`
  }
  // update name
  const update = {
    id: props.card.id,
    name: utils.trim(name)
  }
  cardStore.updateCard(update)
  globalStore.triggerUpdateHeaderAndFooterPosition()
  await nextTick()
  cardStore.updateCardDimensions(props.card.id)
}
const clearErrors = () => {
  state.error.signUpToUpload = false
  state.error.sizeLimit = false
  state.error.unknownUploadError = false
  state.error.spaceIsReadOnly = false
}
const checkIfUploadIsDraggedOver = (event) => {
  if (!event.dataTransfer.items.length) { return }
  if (event.dataTransfer.types[0] === 'Files' || event.dataTransfer.items[0].kind === 'file') {
    state.uploadIsDraggedOver = true
    const updates = {
      cardId: props.card.id,
      userId: userStore.id
    }
    broadcastStore.update({ updates, action: 'addToRemoteUploadDraggedOverCards' })
  }
}
const removeUploadIsDraggedOver = () => {
  state.uploadIsDraggedOver = false
  const userId = userStore.id
  broadcastStore.update({ updates: { userId }, action: 'clearRemoteUploadDraggedOverCards' })
}
const uploadFile = async (event) => {
  removeUploadIsDraggedOver()
  cardStore.incrementCardZ(props.card.id)
  // pre-upload errors
  if (!currentUserIsSignedIn.value) {
    state.error.signUpToUpload = true
    globalStore.addNotification({ message: 'To upload files, you need to Sign Up or In', type: 'info' })
    return
  }
  if (!canEditSpace.value) {
    state.error.spaceIsReadOnly = true
    globalStore.addNotification({ message: 'You can only upload files on spaces you can edit', type: 'info' })
    return
  }
  const file = event.dataTransfer.files[0]
  const cardId = props.card.id
  // upload
  try {
    await uploadStore.uploadFile({ file, cardId })
  } catch (error) {
    console.warn('🚒', error)
    if (error.type === 'sizeLimit') {
      state.error.sizeLimit = true
    } else {
      state.error.unknownUploadError = true
    }
    globalStore.addNotification({ message: error.message, type: 'danger' })
  }
}

// name

const hasTextSegments = computed(() => {
  return nameSegments.value.find(segment => segment.isText && segment.content)
})
// name without urls, checkbox text, and hidden urls
const normalizedName = computed(() => {
  let newName = props.card.name
  if (!newName) { return }
  if (newName === ' ') { return }
  if (cardHasMedia.value) {
    newName = newName.replace(state.formats.image, '')
    newName = newName.replace(state.formats.video, '')
    newName = newName.replace(state.formats.audio, '')
  }
  // link hiding
  const link = state.formats.link
  let isHidden
  const markdownLinks = newName.match(utils.markdown().linkPattern)
  const urlIsSpace = utils.urlIsSpace(state.formats.link)
  if (markdownLinks) {
    const linkIsMarkdown = markdownLinks.find(markdownLink => markdownLink.includes(link))
    isHidden = !linkIsMarkdown
  }
  if (!props.card.urlIsVisible && !urlIsSpace) {
    isHidden = true
  }
  if (isHidden) {
    newName = newName.replace(link, '')
    newName = newName.replace(utils.urlWithoutProtocol(link), '')
  }
  // checkboxes
  const checkbox = utils.checkboxFromString(newName)
  if (checkbox) {
    newName = newName.replace(checkbox, '')
  }
  newName = removeCommentBrackets(newName)
  return newName.trim()
})
const nameIsOnlySpaceLink = computed(() => {
  if (!state.formats.link) { return }
  const urlIsSpace = utils.urlIsSpace(state.formats.link)
  const nameIsOnlyUrl = normalizedName.value.trim() === state.formats.link
  return urlIsSpace && nameIsOnlyUrl
})
const isNormalizedNameOrHiddenUrl = computed(() => {
  const urlPreviewIsHidden = props.card.urlPreviewUrl && !props.card.urlPreviewIsVisible
  if (nameIsOnlySpaceLink.value) { return }
  if (urlPreviewIsHidden) { return true }
  return normalizedName.value
})
const nameSegments = computed(() => {
  let segments = utils.cardNameSegments(normalizedName.value)
  segments = segments.map(segment => {
    segment.isDark = backgroundColorIsDark.value
    // tags
    if (segment.isTag) {
      let tag = spaceStore.getSpaceTagByName(segment.name)
      if (!tag) {
        tag = {
          id: nanoid(),
          name: segment.name,
          color: newTagColor(),
          cardId: props.card.id,
          spaceId: spaceStore.id
        }
        console.warn('🦋 create missing tag', segment.name, tag, props.card)
        spaceStore.addTag(tag)
      }
      segment.color = tag.color
      segment.id = tag.id
    // invite
    } else if (segment.isInviteLink) {
      const { spaceId, collaboratorKey } = segment
      segment.otherSpace = globalStore.getOtherSpaceById(spaceId)
    // space or card
    } else if (segment.isLink) {
      const { spaceId, cardId } = utils.spaceAndCardIdFromUrl(segment.name)
      segment.otherSpace = globalStore.getOtherSpaceById(spaceId)
      segment.otherCard = globalStore.getOtherCardById(cardId)
    // text
    } else if (segment.isText) {
      segment.markdown = utils.markdownSegments(segment.content)
    }
    return segment
  })
  return segments
})

// tags

const newTagColor = () => {
  let color = randomColor({ luminosity: 'light' })
  if (themeStore.getIsThemeDark) {
    color = randomColor({ luminosity: 'dark' })
  }
  return color
}
const tags = computed(() => {
  return nameSegments.value.filter(segment => {
    if (segment.isTag) {
      return true
    }
  })
})
const dataTags = computed(() => {
  let tags = utils.tagsFromStringWithoutBrackets(props.card.name)
  if (!tags) { return }
  tags = tags.map(tag => utils.normalizeString(tag))
  tags = utils.arrayToString(tags)
  return tags
})
const showTagDetailsIsVisible = ({ event, tag }) => {
  if (isMultiTouch) { return }
  if (!canEditCard.value) { globalStore.triggerReadOnlyJiggle() }
  if (state.preventDraggedButtonBadgeFromShowingDetails) { return }
  globalStore.closeAllDialogs()
  globalStore.currentUserIsDraggingCard = false
  const tagRect = event.target.getBoundingClientRect()
  globalStore.tagDetailsPosition = {
    x: window.scrollX + tagRect.x + 2,
    y: window.scrollY + tagRect.y + tagRect.height - 2,
    pageX: window.scrollX,
    pageY: window.scrollY
  }
  tag.cardId = props.card.id
  globalStore.currentSelectedTag = tag
  globalStore.tagDetailsIsVisible = true
  cancelLocking()
  globalStore.currentUserIsDraggingCard = false
}

// all previews

const previewIsVisible = computed(() => {
  return Boolean(cardUrlPreviewIsVisible.value || groupInviteUrl.value || otherCardIsVisible.value || otherSpaceIsVisible.value)
})

// url preview

const updateUrls = () => {
  const name = utils.removeMarkdownCodeblocksFromString(props.card.name)
  const urls = utils.urlsFromString(name)
  if (urls) {
    urls.reverse()
  }
  updateMediaUrls(urls)
  state.urls = urls?.filter(url => Boolean(url)) || []
}
const urlPreviewImageIsVisible = computed(() => {
  return Boolean(cardUrlPreviewIsVisible.value && props.card.urlPreviewImage && !props.card.shouldHideUrlPreviewImage)
})
const cardUrlPreviewIsVisible = computed(() => {
  if (!props.card) { return }
  if (!props.card.name) { return }
  let cardHasUrlPreviewInfo = Boolean(props.card.urlPreviewTitle || props.card.urlPreviewDescription || props.card.urlPreviewImage || props.card.urlPreviewUrl)
  // TEMP experiment: remove card.urlPreviewErrorUrl checking to eliminate false positives. Observe if there's a downside irl and if this attribute should be removed entirely?
  // const isErrorUrl = props.card.urlPreviewErrorUrl && (props.card.urlPreviewUrl === props.card.urlPreviewErrorUrl)
  let url = props.card.urlPreviewUrl
  url = utils.clearTrailingSlash(url)
  cardHasUrlPreviewInfo = Boolean(cardHasUrlPreviewInfo && url)
  const nameHasUrl = props.card.name?.includes(url)
  return (props.card.urlPreviewIsVisible && cardHasUrlPreviewInfo && nameHasUrl) && !isComment.value
  // return Boolean(props.card.urlPreviewIsVisible && props.card.urlPreviewUrl && cardHasUrlPreviewInfo) // && !isErrorUrl
})
const isLoadingUrlPreview = computed(() => {
  let isLoading = globalStore.urlPreviewLoadingForCardIds.find(cardId => cardId === props.card.id)
  isLoading = Boolean(isLoading)
  if (isLoading) {
    prevIsLoadingUrlPreview = true
  } else if (prevIsLoadingUrlPreview) {
    // connectionStore.updateConnectionPathByItemId(props.card.id)
  }
  return isLoading
  // if (!isLoading) { return }
  // const isErrorUrl = props.card.urlPreviewErrorUrl && (props.card.urlPreviewUrl === props.card.urlPreviewErrorUrl)
  // return isLoading && !isErrorUrl
})
const updateUrlPreviewOnload = async () => {
  if (!props.card.shouldUpdateUrlPreview) { return }
  updateMediaUrls()
  const isUpdatedSuccess = await updateUrlPreview()
  const update = {
    id: props.card.id,
    shouldUpdateUrlPreview: false
  }
  cardStore.updateCard(update)
  if (isUpdatedSuccess) {
    globalStore.triggerUpdateUrlPreviewComplete(props.card.id)
  }
}
const preventUpdatePrevPreview = computed(() => {
  if (props.card.shouldUpdateUrlPreview) { return }
  const updateDelta = dayjs(updatedAt.value).diff(state.sessionStartDate, 'second')
  return updateDelta < 0
})
const updateUrlPreview = () => {
  if (globalStore.isLoadingUrlPreview) { return }
  const isOffline = !globalStore.isOnline
  if (preventUpdatePrevPreview.value) { return }
  if (isOffline) {
    const update = {
      id: props.card.id,
      shouldUpdateUrlPreview: true
    }
    cardStore.updateCard(update)
  } else {
    updateUrlPreviewOnline()
  }
}
const updateUrlPreviewOnline = async () => {
  globalStore.addUrlPreviewLoadingForCardIds(props.card.id)
  const cardId = props.card.id
  const url = webUrl.value
  if (!url) {
    globalStore.removeUrlPreviewLoadingForCardIds(cardId)
    return
  }
  const shouldUpdate = shouldUpdateUrlPreview(url)
  if (!shouldUpdate) {
    globalStore.removeUrlPreviewLoadingForCardIds(cardId)
    return
  }
  try {
    const response = await apiStore.urlPreview({ url, card: props.card })
    if (!response) { throw 'urlPreview request failed' }
    const { data, host } = response
    console.info('🚗 link preview', url, data)
    updateUrlPreviewSuccess(url, data)
  } catch (error) {
    console.warn('🚑', error, url)
    updateUrlPreviewErrorUrl(url)
  }
}
const updateUrlPreviewSuccess = async (url, data) => {
  if (!nameIncludesUrl(url)) { return }
  const cardId = data.id || props.card.id
  globalStore.removeUrlPreviewLoadingForCardIds(cardId)
  if (!cardId) {
    console.warn('🚑 could not updateUrlPreviewSuccess', cardId, props.card)
    return
  }
  cardStore.updateCard(data)
  await apiStore.addToQueue({ name: 'updateUrlPreviewImage', body: data })
}
// remove after 2025
const retryUrlPreview = () => {
  if (!canEditSpace.value) { return }
  const update = {
    id: props.card.id,
    shouldUpdateUrlPreview: true
  }
  cardStore.updateCard(update)
  updateUrlPreview()
}
const shouldUpdateUrlPreview = (url) => {
  if (props.card.shouldUpdateUrlPreview) { return true }
  const previewIsVisible = props.card.urlPreviewIsVisible
  const isNotPreviewUrl = url !== props.card.urlPreviewUrl
  const isNotErrorUrl = url !== props.card.urlPreviewErrorUrl
  const isNotKinopioUrl = !url.startsWith('https://kinopio.club')
  const isLocalhostUrl = url.match(utils.localhostUrlPattern())
  return previewIsVisible && isNotPreviewUrl && isNotErrorUrl && isNotKinopioUrl && !isLocalhostUrl
}
const nameIncludesUrl = (url) => {
  const name = props.card.name
  const normalizedUrl = utils.clearTrailingSlash(url)
  return name.includes(url) || name.includes(normalizedUrl) || normalizedUrl.includes(name)
}
const updateUrlPreviewImage = (update) => {
  if (!currentUserIsSignedIn.value) { return }
  if (!update.urlPreviewImage) { return }
  if (!canEditSpace.value) { return }
  update.cardId = update.id
  update.spaceId = spaceStore.id
  delete update.id
  apiStore.updateUrlPreviewImage(update)
}
const updateUrlPreviewErrorUrl = (url) => {
  const cardId = props.card.id
  globalStore.removeUrlPreviewLoadingForCardIds(cardId)
  const update = {
    id: cardId,
    urlPreviewErrorUrl: url,
    urlPreviewUrl: url,
    name: props.card.name
  }
  cardStore.updateCard(update)
}

// drag cards

const currentCardIsBeingDragged = computed(() => {
  let isCardId
  const currentDraggingCard = globalStore.currentDraggingCardId
  const isDraggingCard = globalStore.currentUserIsDraggingCard
  if (isSelected.value || currentDraggingCard === props.card.id) {
    isCardId = true
  }
  return Boolean(isDraggingCard && isCardId)
})
const isRemoteCardDragging = computed(() => {
  const isDragging = globalStore.remoteCardsDragging.find(card => card.cardId === props.card.id)
  return Boolean(isDragging)
})
const remoteCardDraggingColor = computed(() => {
  const draggingCard = globalStore.remoteCardsDragging.find(card => card.cardId === props.card.id)
  if (draggingCard) {
    const user = spaceStore.getSpaceUserById(draggingCard.userId)
    return user.color
  } else {
    return undefined
  }
})
const checkIfShouldDragMultipleCards = (event) => {
  if (event.shiftKey) { return }
  // if the current dragging card is not already selected then clear selection
  const multipleCardsSelectedIds = globalStore.multipleCardsSelectedIds
  if (!multipleCardsSelectedIds.includes(props.card.id)) {
    globalStore.clearMultipleSelected()
  }
}
const startDraggingCard = (event) => {
  isMultiTouch = false
  if (event.ctrlKey) { return }
  if (isLocked.value) { return }
  if (globalStore.currentUserIsPanningReady) { return }
  if (utils.isMultiTouch(event)) {
    isMultiTouch = true
    return
  }
  if (!canEditCard.value) {
    cardStore.incrementCardZ(props.card.id)
    return
  }
  event.preventDefault()
  if (globalStore.currentUserIsDrawingConnection) { return }
  globalStore.closeAllDialogs()
  globalStore.clearDraggingItems()
  globalStore.currentUserIsDraggingCard = true
  globalStore.currentDraggingCardId = props.card.id
  postMessage.sendHaptics({ name: 'softImpact' })
  const updates = {
    cardId: props.card.id,
    userId: userStore.id
  }
  broadcastStore.update({ updates, action: 'addToRemoteCardsDragging' })
  globalStore.parentCardId = props.card.id
  globalStore.childCardId = ''
  checkIfShouldDragMultipleCards(event)
  cardStore.incrementCardZ(props.card.id)
}
const notifyPressAndHoldToDrag = () => {
  if (isLocked.value) { return }
  const isDrawingConnection = globalStore.currentUserIsDrawingConnection
  if (isDrawingConnection) { return }
  const hasNotified = globalStore.hasNotifiedPressAndHoldToDrag
  if (!hasNotified) {
    globalStore.addNotification({ message: 'Press and hold to drag', icon: 'press-and-hold' })
  }
  globalStore.hasNotifiedPressAndHoldToDrag = true
}

// resize cards

const currentCardIsBeingResized = computed(() => {
  const cardIds = globalStore.currentUserIsResizingCardIds
  return cardIds.includes(props.card.id)
})

// touch locking to drag card

const cancelLocking = () => {
  shouldCancelLocking = true
}
const cancelLockingAnimationFrame = () => {
  state.isLocking = false
  state.lockingPercent = 0
  state.lockingAlpha = 0
  shouldCancelLocking = false
}
const startLocking = (event) => {
  if (isLocked.value) { return }
  updateTouchPosition(event)
  updateCurrentTouchPosition(event)
  if (isSelected.value) {
    state.isLocking = false
    startDraggingCard(event)
    return
  }
  state.isLocking = true
  shouldCancelLocking = false
  setTimeout(() => {
    if (!lockingAnimationTimer) {
      lockingAnimationTimer = window.requestAnimationFrame(lockingAnimationFrame)
    }
  }, lockingPreDuration)
}
const lockingAnimationFrame = (timestamp) => {
  if (!lockingStartTime) {
    lockingStartTime = timestamp
  }
  const elaspedTime = timestamp - lockingStartTime
  const percentComplete = (elaspedTime / lockingDuration) // between 0 and 1
  if (!utils.cursorsAreClose(touchPosition, currentTouchPosition)) {
    notifyPressAndHoldToDrag()
    cancelLockingAnimationFrame()
  }
  if (shouldCancelLocking) {
    cancelLockingAnimationFrame()
  }
  if (state.isLocking && percentComplete <= 1) {
    // const minSize = circleRadius
    const percentRemaining = Math.abs(percentComplete - 1)
    state.lockingPercent = percentRemaining
    const alpha = utils.easeOut(percentComplete, elaspedTime, lockingDuration)
    state.lockingAlpha = alpha
    window.requestAnimationFrame(lockingAnimationFrame)
  } else if (state.isLocking && percentComplete > 1) {
    console.info('🔒🐢 card lockingAnimationFrame locked')
    lockingAnimationTimer = undefined
    lockingStartTime = undefined
    state.isLocking = false
    startDraggingCard(initialTouchEvent)
    globalStore.triggeredTouchCardDragPosition = touchPosition
  } else {
    window.cancelAnimationFrame(lockingAnimationTimer)
    lockingAnimationTimer = undefined
    lockingStartTime = undefined
    cancelLockingAnimationFrame()
  }
}
const updateCurrentTouchPosition = (event) => {
  currentTouchPosition = utils.cursorPositionInViewport(event)
  if (currentCardIsBeingDragged.value || globalStore.currentUserIsResizingCard || globalStore.currentUserIsTiltingCard) {
    event.preventDefault() // allows dragging cards without scrolling
  }
}
const updateTouchPosition = (event) => {
  initialTouchEvent = event
  isMultiTouch = false
  if (utils.isMultiTouch(event)) {
    isMultiTouch = true
    return
  }
  touchPosition = utils.cursorPositionInViewport(event)
  const isDrawingConnection = globalStore.currentUserIsDrawingConnection
  if (isDrawingConnection) {
    event.preventDefault() // allows swipe to scroll, before card locked
  }
}

// select cards

const isSelected = computed(() => {
  const multipleCardsSelectedIds = globalStore.multipleCardsSelectedIds
  return multipleCardsSelectedIds.includes(props.card.id)
})
const selectedColor = computed(() => {
  const color = currentUserColor.value
  if (isSelected.value) {
    return color
  } else {
    return undefined
  }
})
const isRemoteSelected = computed(() => {
  const selectedCard = globalStore.remoteCardsSelected.find(card => card.cardId === props.card.id)
  return Boolean(selectedCard)
})
const remoteSelectedColor = computed(() => {
  const selectedCard = globalStore.remoteCardsSelected.find(card => card.cardId === props.card.id)
  if (selectedCard) {
    const user = spaceStore.getSpaceUserById(selectedCard.userId)
    return user.color
  } else {
    return undefined
  }
})
const selectAllConnectedCards = (event) => {
  const isMeta = event.metaKey || event.ctrlKey
  if (!isMeta) { return }
  if (!canEditSpace.value) { return }
  globalStore.closeAllDialogs()
  const connections = connectionStore.getAllConnections
  const selectedCards = [props.card.id]
  let shouldSearch = true
  while (shouldSearch) {
    let cancelSearch = true
    connections.forEach(connection => {
      const startCard = connection.startItemId
      const endCard = connection.endItemId
      const startCardIsConnected = selectedCards.includes(startCard)
      const endCardIsConnected = selectedCards.includes(endCard)
      if (!startCardIsConnected && endCardIsConnected) {
        selectedCards.push(startCard)
        cancelSearch = false
      }
      if (startCardIsConnected && !endCardIsConnected) {
        selectedCards.push(endCard)
        cancelSearch = false
      }
    })
    if (cancelSearch) {
      shouldSearch = false
    }
  }
  globalStore.updateMultipleSelectedActionsIsVisible(false)
  globalStore.multipleCardsSelectedIds = selectedCards
}

// card details

const currentCardDetailsIsVisible = computed(() => {
  return props.card.id === globalStore.cardDetailsIsVisibleForCardId
})
const isRemoteCardDetailsVisible = computed(() => {
  const visibleCard = globalStore.remoteCardDetailsVisible.find(card => card.cardId === props.card.id)
  return Boolean(visibleCard)
})
const remoteCardDetailsVisibleColor = computed(() => {
  const visibleCard = globalStore.remoteCardDetailsVisible.find(card => card.cardId === props.card.id)
  if (visibleCard) {
    const user = spaceStore.getSpaceUserById(visibleCard.userId)
    return user.color
  } else {
    return undefined
  }
})
const showCardDetails = (event) => {
  if (globalStore.cardDetailsIsVisibleForCardId) { return }
  if (isLocked.value) { return }
  if (globalStore.currentUserIsPainting) { return }
  if (globalStore.currentUserIsDraggingConnectionIdLabel) { return }
  if (isMultiTouch) { return }
  if (globalStore.currentUserIsPanningReady || globalStore.currentUserIsPanning) { return }
  if (globalStore.currentUserIsResizingBox || globalStore.currentUserIsDraggingBox) { return }
  if (globalStore.shouldSnapToGrid) { return }
  if (!canEditCard.value) { globalStore.triggerReadOnlyJiggle() }
  const shouldToggleSelected = event.shiftKey && !globalStore.cardsWereDragged && !isConnectingTo.value
  if (shouldToggleSelected) {
    globalStore.toggleCardSelected(props.card.id)
    event.stopPropagation()
    globalStore.currentUserIsDraggingCard = false
    return
  }
  const userId = userStore.id
  broadcastStore.update({ updates: { userId }, action: 'clearRemoteCardsDragging' })
  state.preventDraggedButtonBadgeFromShowingDetails = globalStore.preventDraggedCardFromShowingDetails
  if (globalStore.preventDraggedCardFromShowingDetails) { return }
  globalStore.closeAllDialogs()
  globalStore.clearMultipleSelected()
  const nodeName = event.target.nodeName
  if (nodeName === 'LABEL') { return } // checkbox
  if (nodeName === 'A' && event.touches) {
    window.location = event.target.href
    return
  }
  globalStore.updateCardDetailsIsVisibleForCardId(props.card.id)
  globalStore.currentDraggingCardId = props.card.id
  globalStore.parentCardId = props.card.id
  event.stopPropagation() // only stop propagation if cardDetailsIsVisible
  globalStore.currentUserIsDraggingCard = false
  updatePreviousResultItem()
  clearStickyPositionOffsets()
}
const showCardDetailsTouch = (event) => {
  cancelLocking()
  if (touchIsNearTouchPosition(event)) {
    showCardDetails(event)
  }
  const userId = userStore.id
  broadcastStore.update({ updates: { userId }, action: 'clearRemoteCardsDragging' })
}
const touchIsNearTouchPosition = (event) => {
  const currentPosition = utils.cursorPositionInViewport(event)
  const touchBlur = 12
  const isTouchX = utils.isBetween({
    value: currentPosition.x,
    min: touchPosition.x - touchBlur,
    max: touchPosition.x + touchBlur
  })
  const isTouchY = utils.isBetween({
    value: currentPosition.y,
    min: touchPosition.y - touchBlur,
    max: touchPosition.y + touchBlur
  })
  if (isTouchX && isTouchY) {
    return true
  }
}

// space filters

const filtersIsActive = computed(() => Boolean(userStore.getUserTotalItemFadingFiltersActive))
const isFilteredByTags = computed(() => {
  const tagNames = globalStore.filteredTagNames
  if (!tagNames.length) { return }
  const hasTag = tags.value.find(tag => {
    if (tagNames.includes(tag.name)) {
      return true
    }
  })
  return hasTag
})
const isFilteredByConnectionType = computed(() => {
  const typeIds = globalStore.filteredConnectionTypeIds
  if (!typeIds) { return }
  const filteredTypes = connectedConnectionTypes.value.filter(type => {
    return typeIds.includes(type.id)
  })
  return Boolean(filteredTypes.length)
})
const isFilteredByFrame = computed(() => {
  const frameIds = globalStore.filteredFrameIds
  if (!frameIds.length) { return }
  const hasFrame = frameIds.includes(props.card.frameId)
  return hasFrame
})
const isFilteredByUnchecked = computed(() => {
  const filterUncheckedIsActive = userStore.filterUnchecked
  if (!filterUncheckedIsActive) { return }
  return !isChecked.value && hasCheckbox.value
})
const isHiddenByCommentFilter = computed(() => {
  const filterCommentsIsActive = userStore.filterComments
  if (!filterCommentsIsActive) { return }
  return isComment.value
})
const isFilteredByBox = computed(() => {
  const boxIds = globalStore.filteredBoxIds
  const boxes = containingBoxes.value || []
  const isInBox = boxes.find(box => boxIds.includes(box.id))
  return isInBox
})
const isFiltered = computed(() => {
  if (isSelectedOrDragging.value) { return }
  if (currentCardIsBeingDragged.value) { return }
  if (!filtersIsActive.value) { return }
  const isInFilter = isFilteredByTags.value || isFilteredByConnectionType.value || isFilteredByFrame.value || isFilteredByUnchecked.value || isFilteredByBox.value
  return !isInFilter
})

// user

const cardCreatedByUser = computed(() => {
  // same as userDetailsWrap.cardCreatedByUser
  const userId = props.card.userId
  if (!userId) { return }
  let user = spaceStore.getSpaceUserById(userId) || globalStore.otherUsers[userId]
  if (!user) {
    user = {
      name: '',
      color: '#cdcdcd' // secondary-active-background
    }
  }
  return user
})
const userDetailsIsUser = computed(() => {
  if (!globalStore.userDetailsIsVisible) { return }
  const user = cardCreatedByUser.value
  return user.id === globalStore.userDetailsUser.id
})

// is visible in viewport, perf, should render

const initViewportObserver = async () => {
  await nextTick()
  try {
    const callback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          state.isVisibleInViewport = true
          checkIfShouldUpdateDimensions()
        } else {
          state.isVisibleInViewport = false
        }
      })
    }
    const target = cardElement.value
    observer = new IntersectionObserver(callback, { rootMargin: '50%' })
    observer.observe(target)
  } catch (error) {
    console.error('🚒 card initViewportObserver', error)
  }
}
const removeViewportObserver = () => {
  const target = cardElement.value
  if (!observer) { return }
  observer.unobserve(target)
}
const shouldRender = computed(() => {
  const shouldExplitlyRender = globalStore.shouldExplicitlyRenderCardIds[props.card.id]
  if (isConnectingFrom.value) { return true }
  if (shouldExplitlyRender) { return true }
  if (state.shouldRenderParent) { return true }
  if (globalStore.disableViewportOptimizations) { return true }
  if (state.isVisibleInViewport) {
    updateLockedItemButtonPosition()
  }
  return state.isVisibleInViewport
})
const updateShouldRenderParent = (value) => {
  state.shouldRenderParent = value
}
const updateLockedItemButtonPosition = async () => {
  if (!props.card.isLocked) { return }
  await nextTick()
  globalStore.triggerUpdateLockedItemButtonPositionCardId(props.card.id)
}

// mouse hover handlers

const handleMouseEnter = () => {
  if (currentCardIsBeingDragged.value) { return }
  initStickToCursor()
  globalStore.currentUserIsHoveringOverCardId = props.card.id
}
const handleMouseLeave = () => {
  unstickToCursor()
  globalStore.currentUserIsHoveringOverCardId = ''
}
const handleMouseEnterUrlButton = () => {
  globalStore.currentUserIsHoveringOverUrlButtonCardId = props.card.id
}
const handleMouseLeaveUrlButton = () => {
  globalStore.currentUserIsHoveringOverUrlButtonCardId = ''
}

// sticky

const shouldNotStick = computed(() => {
  if (!userStore.shouldUseStickyCards) { return true }
  if (iframeIsVisible.value) { return true }
  if (globalStore.codeLanguagePickerIsVisible) { return true }
  if (globalStore.currentUserIsDraggingConnectionIdLabel) { return true }
  if (currentUserIsHoveringOverUrlButton.value) { return true }
  const userIsConnecting = globalStore.currentConnectionStartItemIds.length
  const currentUserIsPanning = globalStore.currentUserIsPanningReady || globalStore.currentUserIsPanning
  return userIsConnecting || globalStore.currentUserIsDraggingBox || globalStore.currentUserIsResizingBox || currentUserIsPanning || currentCardDetailsIsVisible.value || isRemoteCardDetailsVisible.value || isRemoteCardDragging.value || currentCardIsBeingDragged.value || globalStore.currentUserIsResizingCard || globalStore.currentUserIsTiltingCard || isLocked.value
})
const updateShouldNotStickMap = () => {
  stickyMap = []
  const element = cardElement.value
  let rect
  // connector
  const connector = element.querySelector('.connector')
  if (connector) {
    rect = connector.getBoundingClientRect()
    rect = utils.rectDimensions(rect)
    stickyMap.push(rect)
  }
  // checkbox
  const checkbox = element.querySelector('.item-checkbox-button')
  if (checkbox) {
    rect = checkbox.getBoundingClientRect()
    rect = utils.rectDimensions(rect)
    stickyMap.push(rect)
  }
  // tilt resize buttons
  const tiltResizeButtons = element.querySelectorAll('.bottom-button-wrap')
  tiltResizeButtons.forEach(button => {
    rect = button.getBoundingClientRect()
    rect = utils.rectDimensions(rect)
    stickyMap.push(rect)
  })
}
const initStickToCursor = () => {
  preventSticking = false
  if (shouldNotStick.value || consts.userPrefersReducedMotion()) {
    preventSticking = true
  }
  stickyTimer = setTimeout(() => {
    stickyTimerComplete = true
  }, stickyTimerDuration)
  updateStickyStretchResistance()
  updateShouldNotStickMap()
}
const clearStickyTimer = () => {
  clearTimeout(stickyTimer)
  stickyTimerComplete = false
}
const stopSticking = () => {
  clearStickyPositionOffsets()
  preventSticking = true
}
const updateStickyStretchResistance = () => {
  const zoom = globalStore.getSpaceZoomDecimal
  let { height, width } = props.card
  height = height * zoom
  width = width * zoom
  // larger sizes have stick less
  let stretchResistance // higher resistance moves less
  const area = width * height
  switch (true) {
    case area > 1000000:
      stretchResistance = 24
      break
    case area > 60000:
      stretchResistance = 16
      break
    case area > 20000:
      stretchResistance = 10
      break
    default:
      stretchResistance = 6
  }
  state.stickyStretchResistance = stretchResistance
}
const stickToCursor = (event) => {
  if (state.isAnimationUnsticking) { return }
  if (preventSticking) { return }
  if (!stickyTimerComplete) { return }
  const position = utils.cursorPositionInSpace(event)
  // stop sticking by map
  const positionIsInsideMap = stickyMap.find(rect => utils.isPointInsideRect(position, rect))
  if (positionIsInsideMap) {
    stopSticking()
    return
  }
  // stop sticking by element
  const classes = ['checkbox-wrap', 'button-wrap', 'progress-wrap', 'inline-button', 'badge']
  const elements = ['button', 'progress', 'iframe']
  const isOverAction = classes.includes(event.target.className) || elements.includes(event.target.nodeName.toLowerCase())
  const isOverTag = event.target.className.includes('button-badge')
  if (shouldNotStick.value || isOverAction || isOverTag) {
    stopSticking()
    return
  }
  const isButtonHover = event.target.closest('.inline-button-wrap') || event.target.closest('.button-wrap')
  if (isButtonHover) {
    stopSticking()
    return
  }
  // position
  const stretchResistance = state.stickyStretchResistance
  const { height, width } = props.card
  const halfWidth = width / 2
  const halfHeight = height / 2
  const centerX = x.value + halfWidth
  const centerY = y.value + halfHeight
  // position from card center
  const xFromCenter = position.x - centerX
  const yFromCenter = position.y - centerY
  // percentage from center to card edge
  const xPercent = (xFromCenter / halfWidth)
  const yPercent = (yFromCenter / halfHeight)
  // calc sticky offset
  let xOffset = (xPercent * halfWidth) / stretchResistance
  xOffset = Math.round(xOffset)
  let yOffset = (yPercent * halfHeight) / stretchResistance
  yOffset = Math.round(yOffset)
  state.stickyTranslateX = xOffset + 'px'
  state.stickyTranslateY = yOffset + 'px'
}
const unstickToCursor = () => {
  clearStickyTimer()
  state.isAnimationUnsticking = true
  const xOffset = parseInt(state.stickyTranslateX)
  const yOffset = parseInt(state.stickyTranslateY)
  const timing = {
    duration: 0, // sum of keyframe offsets
    easing: 'cubic-bezier(0.45, 0, 0.55, 1)',
    iterations: 1
  }
  const swings = [-0.9, 0.6, -0.4, 0.2, 0] // [-1, 0.75, -0.5, 0.25, 0]
  let keyframes = [
    { transform: `translate(${xOffset * swings[0]}px,   ${yOffset * swings[0]}px)`, offset: 50 },
    { transform: `translate(${xOffset * swings[1]}px, ${yOffset * swings[1]}px)`, offset: 75 },
    { transform: `translate(${xOffset * swings[2]}px, ${yOffset * swings[2]}px)`, offset: 50 },
    { transform: `translate(${xOffset * swings[3]}px, ${yOffset * swings[3]}px)`, offset: 100 },
    { transform: `translate(${xOffset * swings[4]}px,    ${yOffset * swings[4]}px)`, offset: 100 }
  ]
  keyframes.forEach(keyframe => {
    timing.duration = timing.duration + keyframe.offset
  })
  let lastOffset = 0
  keyframes = keyframes.map(keyframe => {
    keyframe.offset = lastOffset + (keyframe.offset / timing.duration)
    keyframe.offset = utils.roundFloat(keyframe.offset)
    lastOffset = keyframe.offset
    return keyframe
  })
  // play animation
  const element = cardElement.value
  if (!element) { return }
  const animation = element.animate(keyframes, timing)
  animation.onfinish = () => {
    clearStickyPositionOffsets()
    state.isAnimationUnsticking = false
  }
}
const clearStickyPositionOffsets = () => {
  state.stickyTranslateX = 0
  state.stickyTranslateY = 0
}

// lock card position

const unlockCard = (event) => {
  if (globalStore.currentUserIsDrawingConnection) {
    return
  }
  event.stopPropagation()
  if (!canEditCard.value) {
    const position = utils.cursorPositionInSpace(event)
    globalStore.addNotificationWithPosition({ message: 'Card is Read Only', position, type: 'info', layer: 'space', icon: 'cancel' })
    return
  }
  globalStore.currentUserIsDraggingCard = false
  const update = {
    id: props.card.id,
    isLocked: false
  }
  cardStore.updateCard(update)
}
const lockingFrameStyle = computed(() => {
  const initialPadding = 65 // matches initialLockCircleRadius in paintSelect
  const initialBorderRadius = 50
  const padding = initialPadding * state.lockingPercent
  const userColor = currentUserColor.value
  const borderRadius = Math.max((state.lockingPercent * initialBorderRadius), 5) + 'px'
  const size = `calc(100% + ${padding}px)`
  const position = -(padding / 2) + 'px'
  return {
    width: size,
    height: size,
    left: position,
    top: position,
    background: userColor,
    opacity: state.lockingAlpha,
    borderRadius
  }
})

// other items

const updateOtherItems = () => {
  let url = state.linkToPreview
  const shouldRemoveLink = (props.card.linkToCardId || props.card.linkToSpaceId) && !url
  if (shouldRemoveLink) {
    const update = {
      id: props.card.id,
      linkToSpaceId: null,
      linkToCardId: null
    }
    cardStore.updateCard(update)
    return
  }
  if (!url) { return }
  const urlIsSpace = utils.urlIsSpace(url)
  const urlIsSpaceInvite = utils.urlIsSpaceInvite(url)
  const urlIsGroupInvite = utils.urlIsGroupInvite(url)
  url = new URL(url)
  if (urlIsSpaceInvite) {
    updateOtherInviteItems(url)
  } else if (urlIsSpace) {
    updateOtherSpaceOrCardItems(url)
  } else if (urlIsGroupInvite) {
    updateOtherGroupItems(url)
  }
}
const updateOtherSpaceOrCardItems = (url) => {
  const { spaceId, cardId } = utils.spaceAndCardIdFromPath(url.pathname)
  const update = {
    id: props.card.id,
    linkToSpaceId: spaceId,
    linkToCardId: cardId,
    linkToSpaceCollaboratorKey: null
  }
  cardStore.updateCard(update)
  spaceStore.updateOtherItems({ spaceId, cardId })
}
const updateOtherInviteItems = (url) => {
  const { spaceId, collaboratorKey } = qs.decode(url.search)
  const isCardLink = spaceId === props.card.linkToSpaceId && collaboratorKey === props.card.linkToSpaceCollaboratorKey
  if (!isCardLink) {
    const update = {
      id: props.card.id,
      linkToSpaceId: spaceId,
      linkToCardId: null,
      linkToSpaceCollaboratorKey: collaboratorKey
    }
    cardStore.updateCard(update)
  }
  spaceStore.updateOtherItems({ spaceId, collaboratorKey })
}
const updateOtherGroupItems = (url) => {
  const groupFromUrl = utils.groupFromGroupInviteUrl(url)
  groupStore.updateOtherGroups(groupFromUrl)
}

// utils

const removeCard = () => {
  if (isLocked.value) { return }
  if (canEditCard.value) {
    cardStore.removeCards([props.card.id])
  }
}
const closeAllDialogs = () => {
  globalStore.closeAllDialogs()
}

// migration added July 2024

const checkIfShouldUpdateIframeUrl = () => {
  if (props.card.urlPreviewEmbedHtml && !props.card.urlPreviewIframeUrl) {
    retryUrlPreview()
  }
}

// containing box

const containingBoxes = computed(() => {
  if (isSelectedOrDragging.value) { return }
  if (currentCardIsBeingDragged.value) { return }
  if (globalStore.boxDetailsIsVisibleForBoxId) { return }
  // check boxes
  let boxes = boxStore.getAllBoxes
  boxes = boxes.filter(box => {
    const boxRect = {
      x: box.x,
      y: box.y,
      width: box.resizeWidth,
      height: box.resizeHeight
    }
    return (
      props.card.x >= boxRect.x &&
      props.card.y >= boxRect.y &&
      (props.card.x + props.card.width) <= (boxRect.x + boxRect.width) &&
      (props.card.y + props.card.height) <= (boxRect.y + boxRect.height)
    )
  })
  return boxes
})
const isInCheckedBox = computed(() => {
  if (!containingBoxes.value) { return }
  const checkedBox = containingBoxes.value.find(box => utils.nameIsChecked(box.name))
  return Boolean(checkedBox)
})

// card focus

const isFocusing = computed(() => props.card.id === globalStore.focusOnCardId)
const focusColor = computed(() => {
  if (isFocusing.value) {
    return currentUserColor.value
  } else {
    return null
  }
})
const clearFocus = () => {
  globalStore.focusOnCardId = ''
}
</script>

<template lang="pug">
.card-wrap(
  :style="cardWrapStyle"
  :data-card-id="card.id"
  :data-is-hidden-by-comment-filter="isHiddenByCommentFilter"
  :data-is-visible-in-viewport="state.isVisibleInViewport"
  :data-should-render="shouldRender"
  :data-is-locked="isLocked"
  :data-tilt-degrees="card.tilt"
  :data-sticky-stretch-resistance="state.stickyStretchResistance"
  :data-x="x"
  :data-y="y"
  :data-resize-width="resizeWidth"
  :data-width="resizeWidth || card.width"
  :data-height="card.height"
  :data-created-by-user="card.userId"
  :data-name-updated-by-user="card.nameUpdatedByUserId"

  :key="card.id"
  ref="cardElement"
  :class="cardWrapClasses"
)
  .focusing-frame(v-if="isFocusing" :style="{backgroundColor: currentUserColor}" @animationend="clearFocus")
  .card(
    v-show="shouldRender"
    @mousedown.left.prevent="startDraggingCard"
    @mouseup.left="showCardDetails"

    @mouseenter="handleMouseEnter"
    @mousemove="stickToCursor"
    @mouseleave="handleMouseLeave"

    @touchstart="startLocking"
    @touchmove="updateCurrentTouchPosition"
    @touchend="showCardDetailsTouch"

    @keyup.stop.enter="showCardDetails"
    @keyup.stop.backspace="removeCard"

    :class="cardClasses"
    :style="cardStyle"
    :data-card-id="card.id"
    :data-card-x="x"
    :data-card-y="y"
    :data-name-updated-at="updatedAt"
    :data-is-locked="isLocked"
    tabindex="0"
    :data-droppable="true"
    @dragenter="checkIfUploadIsDraggedOver"
    @dragover.prevent="checkIfUploadIsDraggedOver"
    @dragleave="removeUploadIsDraggedOver"
    @dragend="removeUploadIsDraggedOver"
    @drop.prevent.stop="uploadFile"
    @click="selectAllConnectedCards"

    :data-checkbox="hasCheckbox"
    :data-background-color="card.backgroundColor"
    :data-tags="dataTags"
  )
    .selected-user-avatar(v-if="isRemoteSelected || isRemoteCardDetailsVisible" :style="{backgroundColor: remoteSelectedColor || remoteCardDetailsVisibleColor}")
      img(src="@/assets/anon-avatar.svg")

    .locking-frame(v-if="state.isLocking" :style="lockingFrameStyle")
    Frames(:card="card")

    template(v-if="isVisualCard || pendingUploadDataUrl")
      ImageOrVideo(
        :isSelectedOrDragging="isSelectedOrDragging"
        :pendingUploadDataUrl="pendingUploadDataUrl"
        :image="state.formats.image"
        :video="state.formats.video"
        @loadSuccess="updateDimensionsAndPaths"
        :cardId="card.id"
        :width="props.card.width"
        :height="props.card.height"
      )

    TiltResize(:card="card" :visible="tiltResizeIsVisible")

    //- Content
    span.card-content-wrap(:style="cardContentWrapStyles")
      //- Comment
      .card-comment(v-if="isComment")
        //- [·]
        ItemCheckboxButton(:visible="hasCheckbox" :card="card" :canEditItem="canEditCard" @toggleItemChecked="cancelLocking")
        //- Name
        .badge.comment-badge(:class="{'is-light-in-dark-theme': isLightInDarkTheme, 'is-dark-in-light-theme': isDarkInLightTheme}")
          img.icon.view(src="@/assets/comment.svg")
          //- User
          UserLabelInline(:user="cardCreatedByUser" :shouldHideName="true")
          //- Url →
        a.url-wrap(v-if="urlButtonIsVisible" :href="cardButtonUrl" @mouseup.exact.prevent="closeAllDialogs" @click.stop="openUrl($event, cardButtonUrl)" @touchend.prevent="openUrl($event, cardButtonUrl)" target="_blank" @mouseenter="handleMouseEnterUrlButton" @mouseleave="handleMouseLeaveUrlButton")
          .url.inline-button-wrap
            button.inline-button(:style="{background: currentBackgroundColor}" :class="{'is-light-in-dark-theme': isLightInDarkTheme, 'is-dark-in-light-theme': isDarkInLightTheme}" tabindex="-1")
              img.icon.visit.arrow-icon(src="@/assets/visit.svg")

      //- Not Comment
      .card-content(v-if="!isComment" :style="cardContentStyles")
        //- Audio
        .audio-wrap(v-if="Boolean(state.formats.audio)")
          Audio(:visible="Boolean(state.formats.audio)" :url="state.formats.audio" @isPlaying="updateIsPlayingAudio" :selectedColor="selectedColor" :normalizedName="normalizedName")
        .name-wrap
          //- [·]
          ItemCheckboxButton(:visible="hasCheckbox" :card="card" :canEditItem="canEditCard" @toggleItemChecked="cancelLocking")
          //- Name
          p.name.name-segments(v-if="isNormalizedNameOrHiddenUrl" :style="nameSegmentsStyles" :class="{'is-checked': isChecked, 'has-checkbox': hasCheckbox, 'badge badge-status': isImageCard && hasTextSegments}")
            template(v-for="segment in nameSegments")
              NameSegment(:segment="segment" @showTagDetailsIsVisible="showTagDetailsIsVisible" :parentCardId="card.id" :backgroundColorIsDark="currentBackgroundColorIsDark" :headerFontId="card.headerFontId" :headerFontSize="card.headerFontSize")
            Loader(:visible="isLoadingUrlPreview")
          //- Url →
          a.url-wrap(v-if="urlButtonIsVisible" :href="cardButtonUrl" @mouseup.exact.prevent="closeAllDialogs" @click.stop="openUrl($event, cardButtonUrl)" @touchend.prevent="openUrl($event, cardButtonUrl)" target="_blank" @mouseenter="handleMouseEnterUrlButton" @mouseleave="handleMouseLeaveUrlButton")
            .url.inline-button-wrap
              button.inline-button(:style="{background: currentBackgroundColor}" :class="{'is-light-in-dark-theme': isLightInDarkTheme, 'is-dark-in-light-theme': isDarkInLightTheme}" tabindex="-1")
                img.icon.visit.arrow-icon(src="@/assets/visit.svg")
      //- Right buttons
      span.card-buttons-wrap(v-if="isCardButtonsVisible")
        //- Lock
        template(v-if="isLocked")
          //- based on CardUnlockButton.vue
          //- .connector maintains connection paths when card is locked
          .lock-button-wrap.inline-button-wrap(@mouseup.left="unlockCard" @touchend="unlockCard" :data-card-id="card.id")
            button.inline-button(tabindex="-1" :style="{background: currentBackgroundColor}")
              img.icon.lock-icon(src="@/assets/lock.svg")
        template(v-else)
          //- connector
          ItemConnectorButton(
            :visible="connectorIsVisible"
            :isHiddenByOpacity="connectorIsHiddenByOpacity"
            :card="card"
            :isConnectingTo="isConnectingTo"
            :isConnectingFrom="isConnectingFrom"
            :isVisibleInViewport="state.isVisibleInViewport"
            :isRemoteConnecting="state.isRemoteConnecting"
            :remoteConnectionColor="state.remoteConnectionColor"
            :defaultBackgroundColor="state.defaultBackgroundColor"
            :currentBackgroundColor="currentBackgroundColor"
            :parentDetailsIsVisible="currentCardDetailsIsVisible"
            @shouldRenderParent="updateShouldRenderParent"
          )
    .url-preview-wrap(v-if="previewIsVisible" :class="{'is-image-card': isImageCard}")
      template(v-if="cardUrlPreviewIsVisible")
        UrlPreviewCard(
          :visible="true"
          :card="card"
          :user="cardCreatedByUser"
          :isImageCard="isImageCard"
          :isSelected="isSelectedOrDragging"
          :urlPreviewImageIsVisible="urlPreviewImageIsVisible"
          :isLoadingUrlPreview="isLoadingUrlPreview"
          @retryUrlPreview="retryUrlPreview"
          :backgroundColor="backgroundColor"
        )
      template(v-if="groupInviteUrl")
        GroupInvitePreview(
          :card="card"
          :groupInviteUrl="groupInviteUrl"
          :selectedColor="selectedColor"
        )
      template(v-else-if="otherCardIsVisible")
        OtherCardPreview(
          :otherCard="otherCard"
          :url="otherCardUrl"
          :parentCardId="card.id"
          :shouldCloseAllDialogs="true"
          :selectedColor="selectedColor"
        )
      template(v-else-if="otherSpaceIsVisible")
        OtherSpacePreviewCard(
          :otherSpace="otherSpace"
          :url="otherSpaceUrl"
          :card="card"
          :isSelected="isSelectedOrDragging"
          :selectedColor="selectedColor"
          :isImageCard="isImageCard"
        )
    //- Upload Progress
    .uploading-container(v-if="cardPendingUpload")
      .badge.info
        Loader(:visible="true")
        span {{cardPendingUpload.percentComplete}}%
    //- Remote Upload Progress
    .uploading-container(v-if="remoteCardPendingUpload")
      .badge.info
        Loader(:visible="true")
        span {{remoteCardPendingUpload.percentComplete}}%
    //- Upload Errors
    .error-container(v-if="state.error.sizeLimit" @animationend="clearErrors")
      span.badge.danger
        img.icon.cancel(src="@/assets/add.svg")
        span Too Big
    .error-container(v-if="state.error.unknownUploadError" @animationend="clearErrors")
      span.badge.danger
        img.icon.cancel(src="@/assets/add.svg")
        span Error
    .error-container(v-if="state.error.signUpToUpload" @animationend="clearErrors")
      span.badge.info
        img.icon.cancel(src="@/assets/add.svg")
        span Sign Up or In
    .error-container(v-if="state.error.spaceIsReadOnly" @animationend="clearErrors")
      span.badge.info
        img.icon.cancel(src="@/assets/add.svg")
        span Space is Read Only

  //- Meta Info
  .meta-container(v-if="state.isVisibleInViewport")
    //- Search result
    span.badge.search(v-if="isInSearchResultsCards")
      img.icon.search(src="@/assets/search.svg")
    //- Vote Counter
    CardVote(:card="card")
    //- Created Through API
    .badge.secondary(v-if="card.isCreatedThroughPublicApi && filterShowUsers" title="Created via public API")
      img.icon.system(src="@/assets/system.svg")
    //- User
    .badge-wrap(v-if="filterShowUsers")
      UserLabelInline(:user="cardCreatedByUser" :isClickable="true")
    //- Date
    .badge.secondary.button-badge(v-if="filterShowDateUpdated" @click.left.prevent.stop="toggleFilterShowAbsoluteDates" @touchend.prevent.stop="toggleFilterShowAbsoluteDates" :class="{'date-is-today': dateIsToday}")
      img.icon.time(src="@/assets/time.svg")
      .name {{dateUpdatedAt}}

</template>

<style lang="stylus">
.card-wrap
  --card-width 200px // consts.normalCardMaxWidth
  pointer-events all
  position absolute
  max-width var(--card-width)
  -webkit-touch-callout none
  &.is-resizing,
  &.is-tilting
    *
      outline none
  .card
    border-radius var(--entity-radius)
    user-select none
    background-color var(--secondary-background)
    max-width var(--card-width)
    cursor pointer
    touch-action manipulation
    transform-origin: calc(100% - 16px) calc(0% + 16px)
    .name
      color var(--primary-on-light-background)
    &:hover,
    &.hover
      box-shadow var(--hover-shadow)
    &:active,
    &.active
      box-shadow var(--active-shadow)
    &.child-is-hovered
      box-shadow none
    &.is-dark
      .name
        color var(--primary-on-dark-background)
    &:focus
      outline 2px solid var(--primary-border)

    &.is-comment
      opacity 0.5

    .card-comment
      > .badge
        margin 0
        margin-top 6px
        margin-left 6px
        margin-bottom 6px
      .comment
        &.is-checked
          text-decoration line-through
      .user-label-inline
        transform translateY(-1px)
        margin 0
        height 15px
        img
          vertical-align 4px

    .card-content-wrap
      display flex
      align-items flex-start
      justify-content space-between

    .card-content
      min-width 28px
      padding-right 6px
      border-radius var(--entity-radius)
      max-width 100%
    .card-comment
      margin-right 8px
    .card-buttons-wrap
      display flex
      margin-left -8px // cancels out margin-right in .card-content or .card-comment
      height 32px

    .loader
      width 14px
      height 14px
      flex-shrink 0
      vertical-align -2px
      margin-left 3px

    .name-wrap,
    .card-comment
      display flex
      align-items flex-start
      > .loader
        transform translateX(8px) translateY(8px)
      .name
        margin 8px
        margin-top 7px
        margin-right 0
        align-self stretch
        word-break break-word
        white-space pre-line
        width 100%
        &.is-checked
          text-decoration line-through
          h1,
          h2,
          h3
            text-decoration line-through
        &.has-checkbox
          .audio
            width 132px
    .name-wrap
      min-width 40px
    .connector,
    .url
      padding 8px
      align-self right
      cursor cell
      button
        z-index 1
    .connector
      padding-top 9px

    .url-wrap
      padding 0
      margin 0
      padding-left 6px
      vertical-align -1px
      .url
        display inline-block
        cursor pointer
        padding-left 0
        padding-right 0
        button
          cursor pointer
    span + .url-wrap,
    p + .url-wrap,
    .badge + .url-wrap
      margin-left 0

    .lock-icon
      position absolute
      left 5.5px
      top 2px
      height 10px
    .arrow-icon
      position absolute
      left 5px
      top 3.5px

    .is-light-in-dark-theme
      border-color var(--primary-on-light-background)
      .icon
        filter none
    .is-dark-in-light-theme
      border-color var(--primary-on-dark-background)
      .icon
        filter invert()

    .uploading-container
      position absolute
      top 6px
      left 6px

    &.media-card
      background-color transparent
      &:hover,
      &.hover
        background-color var(--secondary-background)
      &:active,
      &.active
        background-color var(--secondary-background)
      &.is-locked
        &:hover,
        &.hover,
        &:active,
        &.active
          background-color transparent
      .card-content-wrap
        position absolute
        top 0
        width 100% !important
        align-items initial
        justify-content space-between
        .name
          background-color var(--secondary-background)

    &.audio-card
      .card-content-wrap
        width 100%
        align-items initial
        justify-content space-between

    .error-container
      position absolute
      top 6px
      left 6px
      animation-name hideme
      animation-delay 5s
      animation-duration 0.1s
      animation-iteration-count 1
      animation-direction forward
      animation-fill-mode forwards
      animation-timing-function ease-out

    &.is-playing-audio
      animation bounce 1.2s infinite ease-in-out alternate
    @media (prefers-reduced-motion)
      &.is-playing-audio
        animation none

    .audio-wrap
      margin-top 8px
      margin-left 8px

  .lock-button-wrap
    opacity 0
    pointer-events all
    cursor pointer
    position relative
    button
      cursor pointer

  .meta-container
    transform translateY(-6px)
    display -webkit-box
    padding 8px
    padding-top 0
    position absolute
    .user-label-inline
      margin-right 0
      width max-content
    .user-badge
      display flex
      margin 0
      .label-badge
        padding 0 10px
    .badge
      width max-content
      &.secondary
        display flex
        .icon
          margin-right 5px
          margin-top 3px
        .icon.system
          margin 0

    .badge + .badge,
    .badge-wrap + .badge
      margin-left 6px
    .date-is-today
      background-color var(--info-background)

  .comment-user-badge
    display inline
    .user
      vertical-align bottom
  .comment-badge
    padding-left 0
    padding-right 0
    padding-bottom 0
    .icon.view
      margin-right 6px
    .user-badge,
    .user
      margin-right 0
    .user-label-inline-wrap
      margin 0

  .url-preview-wrap
    margin-top -2px
    padding 8px
    padding-top 0
    border-radius var(--entity-radius)
    &.is-image-card
      margin-top 0
      border-top-left-radius 0
      border-top-right-radius 0

  .locking-frame
    position absolute
    z-index -1
    pointer-events none

  .selected-user-avatar
    padding 0 3px
    border-radius var(--small-entity-radius)
    position absolute
    top -5px
    left -5px
    pointer-events none
    z-index 1
    img
      width 10px
      height 10px

  .is-in-checked-box,
  .is-checked
    opacity var(--is-checked-opacity)

@keyframes bounce
  0%
    transform translateY(0)
  50%
    transform translateY(4px)
  100%
    transform translateY(0)

.jiggle
  animation jiggle 0.5s infinite ease-out forwards
  &.l-width
    animation-name jiggle-small

@media (prefers-reduced-motion)
  .jiggle
    animation none

@keyframes jiggle
  0%
    transform rotate(0deg)
  25%
    transform rotate(-2deg)
  50%
    transform rotate(2deg)
  75%
    transform rotate(-2deg)
  100%
    transform rotate(0deg)

@keyframes jiggle-small
  0%
    transform rotate(0deg)
  25%
    transform rotate(-1deg)
  50%
    transform rotate(1deg)
  75%
    transform rotate(-1deg)
  100%
    transform rotate(0deg)
</style>
