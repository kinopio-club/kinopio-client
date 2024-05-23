<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore, mapState, mapGetters } from 'vuex'

import utils from '@/utils.js'
import Frames from '@/components/Frames.vue'
import Loader from '@/components/Loader.vue'
import Audio from '@/components/Audio.vue'
import NameSegment from '@/components/NameSegment.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'
import OtherCardPreview from '@/components/OtherCardPreview.vue'
import consts from '@/consts.js'
import postMessage from '@/postMessage.js'

// Card only child components
import OtherSpacePreviewCard from '@/components/OtherSpacePreviewCard.vue'
import CardCounter from '@/components/CardCounter.vue'
import TiltResize from '@/components/TiltResize.vue'
import UrlPreviewCard from '@/components/UrlPreviewCard.vue'
import ImageOrVideo from '@/components/ImageOrVideo.vue'

import dayjs from 'dayjs'
import qs from '@aguezz/qs-parse'
import debounce from 'lodash-es/debounce'

const store = useStore()

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

let observer

onMounted(async () => {
  store.subscribe((mutation, state) => {
    const { type, payload } = mutation
    if (type === 'updateRemoteCurrentConnection' || type === 'removeRemoteCurrentConnection') {
      updateRemoteConnections()
    } else if (type === 'triggerScrollCardIntoView') {
      if (payload === props.card.id) {
        const element = cardElement.value
        utils.scrollIntoView({ element })
      }
    } else if (type === 'triggerUploadComplete') {
      let { cardId, url } = payload
      if (cardId !== props.card.id) { return }
      addFile({ url })
    } else if (type === 'triggerUpdateUrlPreview') {
      if (payload === props.card.id) {
        updateMediaUrls()
        updateUrlPreview()
      }
    } else if (type === 'triggerUpdateTheme') {
      updateDefaultBackgroundColor(utils.cssVariable('secondary-background'))
    } else if (type === 'triggerCancelLocking') {
      cancelLocking()
    }
  })
  updateDefaultBackgroundColor(utils.cssVariable('secondary-background'))
  const shouldShowDetails = store.state.loadSpaceShowDetailsForCardId === props.card.id
  if (shouldShowDetails) {
    store.commit('preventCardDetailsOpeningAnimation', false)
    store.dispatch('currentCards/showCardDetails', props.card.id)
  }
  await updateUrlPreviewOnload()
  checkIfShouldUpdatePreviewHtml()
  const defaultCardMaxWidth = consts.defaultCardMaxWidth + 'px'
  utils.setCssVariable('card-width', defaultCardMaxWidth)
  initViewportObserver()
})

onBeforeUnmount(() => {
  removeViewportObserver()
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
  isVisibleInViewport: false
})
watch(() => state.linkToPreview, (value, prevValue) => {
  updateUrlData()
})
const updateUrlData = () => {
  updateOtherItems()
  if (store.state.isLoadingSpace) { return }
  updateUrlPreview()
}

const canEditCard = computed(() => store.getters['currentUser/canEditCard'](props.card))
const isSelectedOrDragging = computed(() => {
  return Boolean(isSelected.value || isRemoteSelected.value || isRemoteCardDetailsVisible.value || isRemoteCardDragging.value || state.uploadIsDraggedOver || remoteUploadDraggedOverCardColor.value || remoteUserResizingCardsColor.value || remoteUserTiltingCardsColor.value)
})
const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])

// current space

const canEditSpace = computed(() => store.getters['currentUser/canEditSpace']())
const changeSpace = async (url) => {
  const { spaceId, spaceUrl, cardId } = utils.spaceAndCardIdFromUrl(url)
  if (cardId) {
    changeSpaceAndCard(spaceId, cardId)
  } else {
    const space = { id: spaceId }
    store.dispatch('currentSpace/changeSpace', space)
  }
  store.dispatch('closeAllDialogs')
}
const changeSpaceAndCard = async (spaceId, cardId) => {
  const currentSpaceId = store.state.currentSpace.id
  // space and card
  if (currentSpaceId !== spaceId) {
    store.commit('loadSpaceShowDetailsForCardId', cardId)
    const space = { id: spaceId }
    store.dispatch('currentSpace/changeSpace', space)
  // card in current space
  } else {
    await nextTick()
    store.dispatch('currentCards/showCardDetails', cardId)
  }
}

// user theme

const isThemeDark = computed(() => store.state.currentUser.theme === 'dark')
const isDarkInLightTheme = computed(() => backgroundColorIsDark.value && !isThemeDark.value)
const isLightInDarkTheme = computed(() => !backgroundColorIsDark.value && isThemeDark.value)

// background color

const updateDefaultBackgroundColor = (color) => {
  state.defaultBackgroundColor = color
}
const currentBackgroundColor = computed(() => {
  let background = 'transparent'
  if (isImageCard.value) {
    background = props.card.backgroundColor
  }
  return selectedColor.value || remoteSelectedColor.value || background
})
const backgroundColor = computed(() => {
  let nameColor
  if (nameIsColor.value) {
    nameColor = props.card.name
  }
  let color = selectedColor.value || remoteCardDetailsVisibleColor.value || remoteSelectedColor.value || selectedColorUpload.value || remoteCardDraggingColor.value || remoteUploadDraggedOverCardColor.value || remoteUserResizingCardsColor.value || remoteUserTiltingCardsColor.value || nameColor || props.card.backgroundColor
  return color
})
const backgroundColorIsDark = computed(() => {
  const color = props.card.backgroundColor || state.defaultBackgroundColor
  return utils.colorIsDark(color)
})
const nameIsColor = computed(() => {
  return utils.colorNameIsValid(props.card.name)
})
const currentBackgroundColorIsDark = computed(() => {
  const color = backgroundColor.value || props.card.backgroundColor || state.defaultBackgroundColor
  return utils.colorIsDark(color)
})

// comment

const isComment = computed(() => store.getters['currentCards/isComment'](props.card))
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

const isChecked = computed(() => utils.nameIsChecked(name.value))
const hasCheckbox = computed(() => {
  if (isLocked.value) { return }
  return utils.checkboxFromString(name.value)
})
const checkboxState = computed({
  get () {
    return isChecked.value
  }
})
const toggleCardChecked = () => {
  if (store.state.currentUserIsDraggingConnectionIdLabel) { return }
  if (store.state.preventDraggedCardFromShowingDetails) { return }
  if (!canEditSpace.value) { return }
  const value = !isChecked.value
  store.dispatch('closeAllDialogs')
  store.dispatch('currentCards/toggleChecked', { cardId: props.card.id, value })
  postMessage.sendHaptics({ name: 'heavyImpact' })
  cancelLocking()
  store.commit('currentUserIsDraggingCard', false)
  const userId = store.state.currentUser.id
  store.commit('broadcast/updateStore', { updates: { userId }, type: 'clearRemoteCardsDragging' })
  event.stopPropagation()
}

// media

const isImageCard = computed(() => Boolean(state.formats.image || state.formats.video))
const urlEmbedIsVisible = computed(() => {
  // youtube, spotify etc.
  const urlEmbedIsVisibleForCardId = store.state.urlEmbedIsVisibleForCardId
  return props.card.id === urlEmbedIsVisibleForCardId
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
  urls = urls || utils.urlsFromString(props.card.name)
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
      state.linkToPreview = url
    }
  })
}
const updateIsPlayingAudio = (value) => {
  state.isPlayingAudio = value
  cancelLocking()
}

// other card

const otherCardUrl = computed(() => utils.urlFromSpaceAndCard({ cardId: props.card.linkToCardId, spaceId: props.card.linkToSpaceId }))
const otherCard = computed(() => {
  const card = store.getters.otherCardById(props.card.linkToCardId)
  return card
})
const otherCardIsVisible = computed(() => {
  if (!props.card.linkToCardId) { return }
  const name = props.card.name
  const urls = utils.urlsFromString(name) || []
  const value = urls.find((url) => {
    return url?.includes(props.card.linkToCardId)
  })
  return Boolean(value)
})

// other space

const otherSpace = computed(() => {
  let isInviteLink, collaboratorKey, readOnlyKey
  let space = nameSegments.value.find(segment => segment.otherSpace)
  if (!space) { return }
  return space.otherSpace
})
const otherSpaceUrl = computed(() => {
  let segment = nameSegments.value.find(segment => segment.otherSpace)
  return segment?.name
})
const spaceOrInviteUrl = computed(() => {
  const link = state.formats.link
  if (utils.urlIsSpace(link) || utils.urlIsInvite(link)) {
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
  const results = store.state.searchResultsCards
  if (!results.length) { return }
  return Boolean(results.find(card => props.card.id === card.id))
})
const filterShowUsers = computed(() => store.state.currentUser.filterShowUsers)
const filterShowDateUpdated = computed(() => store.state.currentUser.filterShowDateUpdated)

// styles

const articleStyle = computed(() => {
  let z = props.card.z
  let pointerEvents = 'auto'
  if (currentCardDetailsIsVisible.value || currentCardIsBeingDragged.value) {
    z = 2147483646 // max z
  } else if (isLocked.value) {
    z = 0
    pointerEvents = 'none'
  }
  let styles = {
    left: `${x.value}px`,
    top: `${y.value}px`,
    // width: `${width.value}px`,
    // height: `${props.card.height}px`,
    zIndex: z,
    pointerEvents
  }
  if (!store.state.currentUserIsDraggingCard) {
    styles.transform = `translate(${state.stickyTranslateX}, ${state.stickyTranslateY})`
  }
  styles = updateStylesWithWidth(styles)
  return styles
})
const cardStyle = computed(() => {
  let backgroundColor, nameColor
  backgroundColor = props.card.backgroundColor
  if (nameIsColor.value) {
    nameColor = props.card.name
  }
  let color = selectedColor.value || remoteCardDetailsVisibleColor.value || remoteSelectedColor.value || selectedColorUpload.value || remoteCardDraggingColor.value || remoteUploadDraggedOverCardColor.value || remoteUserResizingCardsColor.value || remoteUserTiltingCardsColor.value || nameColor || backgroundColor
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
  let styles = {}
  return updateStylesWithWidth(styles)
})
const addSizeClasses = (classes) => {
  const m = 100
  const l = 150
  classes['s-width'] = width.value < m
  classes['m-width'] = utils.isBetween({ value: width.value, min: m, max: l })
  classes['l-width'] = width.value > l
  return classes
}
const articleClasses = computed(() => {
  let classes = {
    'is-resizing': store.state.currentUserIsResizingCard,
    'is-tilting': store.state.currentUserIsTiltingCard,
    'is-hidden-by-opacity': isCardHiddenByCommentFilter.value,
    'jiggle': shouldJiggle.value
  }
  classes = addSizeClasses(classes)
  return classes
})
const cardClasses = computed(() => {
  let classes = {
    'active': isConnectingTo.value || isConnectingFrom.value || state.isRemoteConnecting || currentCardIsBeingDragged.value || state.uploadIsDraggedOver,
    'filtered': isFiltered.value,
    'media-card': isVisualCard.value || pendingUploadDataUrl.value,
    'audio-card': isAudioCard.value,
    'is-playing-audio': state.isPlayingAudio,
    'is-locked': isLocked.value,
    'has-url-preview': cardUrlPreviewIsVisible.value,
    'is-dark': backgroundColorIsDark.value
  }
  classes = addSizeClasses(classes)
  return classes
})
const shouldJiggle = computed(() => {
  const max = 500
  const cardIsTooBig = width.value > max || props.card.height > max
  if (cardIsTooBig) { return }
  const isMultipleItemsSelected = store.getters.isMultipleItemsSelected
  const isShiftKeyDown = store.state.currentUserIsBoxSelecting
  if (isMultipleItemsSelected || isShiftKeyDown) { return }
  return isConnectingTo.value || isConnectingFrom.value || state.isRemoteConnecting || currentCardIsBeingDragged.value || isRemoteCardDragging.value
})
const updateStylesWithWidth = (styles) => {
  const cardHasExtendedContent = cardUrlPreviewIsVisible.value || otherCardIsVisible.value || isVisualCard.value || isAudioCard.value
  const cardHasUrlsOrMedia = cardHasMedia.value || cardHasUrls.value
  if (isComment.value) { return styles }
  if (cardHasUrlsOrMedia) {
    styles.width = consts.defaultCardMaxWidth
  }
  if (resizeWidth.value) {
    styles.maxWidth = resizeWidth.value
    styles.width = resizeWidth.value
  }
  if (styles.width) {
    styles.width = styles.width + 'px'
  }
  if (styles.maxWidth) {
    styles.maxWidth = styles.maxWidth + 'px'
  }
  return styles
}
const updatePreviousResultItem = () => {
  const search = store.state.search
  const searchResultsCards = store.state.searchResultsCards
  if (!search) { return }
  if (!searchResultsCards.length) { return }
  if (searchResultsCards.find(card => card.id === props.card.id)) {
    store.commit('previousResultItem', props.card)
  }
}

// position and dimensions

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
  if (urlEmbedIsVisible.value || isLoadingUrlPreview.value) {
    resizeWidth = Math.max(resizeWidth, consts.minCardEmbedWidth)
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
  if (utils.isMobile()) { return }
  return true
})
const x = computed(() => {
  const x = props.card.x
  if (x === undefined || x === null) {
    return defaultCardPosition
  } else {
    return x
  }
})
const y = computed(() => {
  const y = props.card.y
  if (y === undefined || y === null) {
    return defaultCardPosition
  } else {
    return y
  }
})
const remoteUserResizingCardsColor = computed(() => {
  if (!store.state.remoteUserResizingCards.length) { return }
  let user = store.state.remoteUserResizingCards.find(user => user.cardIds.includes(props.card.id))
  if (user) {
    user = store.getters['currentSpace/userById'](user.userId)
    return user.color
  } else {
    return undefined
  }
})
const remoteUserTiltingCardsColor = computed(() => {
  if (!store.state.remoteUserTiltingCards.length) { return }
  let user = store.state.remoteUserTiltingCards.find(user => user.cardIds.includes(props.card.id))
  if (user) {
    user = store.getters['currentSpace/userById'](user.userId)
    return user.color
  } else {
    return undefined
  }
})
const updateCardDimensions = () => {
  let card = { id: props.card.id }
  card = utils.updateCardDimensions(card)
  if (!card) { return }
  store.commit('currentCards/update', card)
  store.dispatch('currentCards/updateTallestCardHeight', card)
  if (!canEditSpace.value) { return }
  store.dispatch('api/addToQueue', { name: 'updateCard', body: card })
}

// connections

const connectionFromAnotherCardConnectedToCurrentCard = (anotherCardId) => {
  const currentCardConnections = store.getters['currentConnections/byCardId'](props.card.id)
  return currentCardConnections.find(connection => {
    const isConnectedToStart = connection.startCardId === anotherCardId
    const isConnectedToEnd = connection.endCardId === anotherCardId
    return isConnectedToStart || isConnectedToEnd
  })
}
const connectionsFromMultipleCardsConnectedToCurrentCard = (otherCardIds) => {
  const currentCardConnections = store.getters['currentConnections/byCardId'](props.card.id)
  let currentCardConnection
  otherCardIds.find(anotherCardId => {
    return currentCardConnections.find(connection => {
      const isConnectedToStart = connection.startCardId === anotherCardId
      const isConnectedToEnd = connection.endCardId === anotherCardId
      if (isConnectedToStart || isConnectedToEnd) {
        currentCardConnection = connection
        return true
      }
    })
  })
  return currentCardConnection
}
const connectedConnectionTypes = computed(() => store.getters['currentConnections/typesByCardId'](props.card.id))
const connectedConnectionTypeById = (typeId) => {
  return connectedConnectionTypes.value.find(type => type.id === typeId)
}
const connectionTypeColorisDark = computed(() => {
  const type = connectedConnectionTypes.value[connectedConnectionTypes.value.length - 1]
  if (!type) { return }
  return utils.colorIsDark(type.color)
})
const currentUserIsDraggingLabelConnectedToCard = computed(() => {
  const connectionId = store.state.currentUserIsDraggingConnectionIdLabel
  if (!connectionId) { return }
  const connection = store.getters['currentConnections/byId'](connectionId)
  if (!connection) { return }
  const isConnected = connection.startCardId === props.card.id || connection.endCardId === props.card.id
  return isConnected
})
const isConnectingTo = computed(() => {
  const connectingToId = store.state.currentConnectionSuccess.id
  if (connectingToId) {
    postMessage.sendHaptics({ name: 'softImpact' })
  }
  return connectingToId === props.card.id
})
const isConnectingFrom = computed(() => {
  return store.state.currentConnectionStartCardIds.find(cardId => cardId === props.card.id)
})
const hasConnections = computed(() => {
  const connections = store.getters['currentConnections/byCardId'](props.card.id)
  return Boolean(connections.length)
})
const currentConnectionColor = computed(() => store.state.currentConnectionColor)
const createCurrentConnection = (event) => {
  const cursor = utils.cursorPositionInViewport(event)
  const multipleCardsSelectedIds = store.state.multipleCardsSelectedIds
  let cardIds = [props.card.id]
  if (multipleCardsSelectedIds.length) {
    cardIds = multipleCardsSelectedIds
  }
  store.commit('currentConnectionStartCardIds', cardIds)
  store.commit('currentConnectionCursorStart', cursor)
}
const addConnectionType = (event) => {
  const shouldUseLastConnectionType = store.state.currentUser.shouldUseLastConnectionType
  const shiftKey = event.shiftKey
  const connectionType = store.getters['currentConnections/typeForNewConnections']
  if (!connectionType) {
    store.dispatch('currentConnections/addType')
  }
  if (shouldUseLastConnectionType && shiftKey) {
    store.dispatch('currentConnections/addType')
    return
  }
  if (shiftKey || shouldUseLastConnectionType) {
    return
  }
  store.dispatch('currentConnections/addType')
}
const startConnecting = (event) => {
  if (!canEditSpace.value) { return }
  if (utils.isMultiTouch(event)) { return }
  store.dispatch('closeAllDialogs')
  store.commit('preventDraggedCardFromShowingDetails', true)
  if (!store.state.currentUserIsDrawingConnection) {
    addConnectionType(event)
    createCurrentConnection(event)
  }
  store.commit('currentUserIsDrawingConnection', true)
}

// connector button

const isConnectorDarkInLightTheme = computed(() => {
  if (connectionTypeColorisDark.value) { return connectionTypeColorisDark.value }
  return isDarkInLightTheme.value
})
const isConnectorLightInDarkTheme = computed(() => {
  if (connectionTypeColorisDark.value) { return !connectionTypeColorisDark.value }
  return isLightInDarkTheme.value
})
const connectorButtonBackground = computed(() => {
  if (store.state.currentUserIsDraggingCard) { return }
  if (hasConnections.value || isConnectingFrom.value || isConnectingTo.value) { return }
  return currentBackgroundColor.value
})
const connectorIsVisible = computed(() => {
  const spaceIsOpen = store.state.currentSpace.privacy === 'open' && currentUserIsSignedIn.value
  let isVisible
  if (state.isRemoteConnecting) {
    isVisible = true
  } else if (spaceIsOpen || canEditCard.value || connectedConnectionTypes.value.length) {
    isVisible = true
  }
  return isVisible
})
const connectorGlowStyle = computed(() => {
  if (!state.isVisibleInViewport) { return }
  if (!utils.arrayHasItems(connectedConnectionTypes.value) && !store.state.currentUserIsDrawingConnection) { return } // cards with no connections
  const color = connectedToAnotherCardDetailsVisibleColor.value ||
    connectedToAnotherCardBeingDraggedColor.value ||
    connectedToConnectionDetailsIsVisibleColor.value ||
    currentUserIsHoveringOverConnectionColor.value ||
    currentUserIsMultipleSelectedConnectionColor.value ||
    currentUserIsHoveringOverConnectedCardColor.value ||
    currentUserIsMultipleSelectedCardColor.value ||
    currentUserIsCreatingConnectionColor.value
  return { background: color }
})
const connectionColor = (connection) => {
  if (!connection) { return }
  const connectionType = connectedConnectionTypeById(connection.connectionTypeId)
  return connectionType?.color
}
// another card that is connected to this one is being edited
const connectedToAnotherCardDetailsVisibleColor = computed(() => {
  if (currentCardDetailsIsVisible.value) { return }
  const anotherCardId = store.state.cardDetailsIsVisibleForCardId
  if (!anotherCardId) { return }
  const connection = connectionFromAnotherCardConnectedToCurrentCard(anotherCardId)
  return connectionColor(connection)
})
// another card that is connected to this one is being dragged
const connectedToAnotherCardBeingDraggedColor = computed(() => {
  const isDraggingCard = store.state.currentUserIsDraggingCard
  if (!isDraggingCard) { return }
  const currentDraggingCardId = store.state.currentDraggingCardId
  const connection = connectionFromAnotherCardConnectedToCurrentCard(currentDraggingCardId)
  return connectionColor(connection)
})
// a connection that is connected to this card is being edited
const connectedToConnectionDetailsIsVisibleColor = computed(() => {
  const connectionDetailsVisibleId = store.state.connectionDetailsIsVisibleForConnectionId
  if (!connectionDetailsVisibleId) { return }
  const currentCardConnections = store.getters['currentConnections/byCardId'](props.card.id)
  const connectionWithDetailsVisible = currentCardConnections.find(connection => connection.id === connectionDetailsVisibleId)
  if (!connectionWithDetailsVisible) { return }
  const connectionType = connectedConnectionTypeById(connectionWithDetailsVisible.connectionTypeId)
  return connectionType?.color
})
// a connection that is connected to this card is being hovered over
const currentUserIsHoveringOverConnectionColor = computed(() => {
  const connectionId = store.state.currentUserIsHoveringOverConnectionId || store.state.currentUserIsDraggingConnectionIdLabel
  const currentCardConnections = store.getters['currentConnections/byCardId'](props.card.id)
  const connection = currentCardConnections.find(currentCardConnection => currentCardConnection.id === connectionId)
  return connectionColor(connection)
})
// a connection that is connected to this card, is paint selected
const currentUserIsMultipleSelectedConnectionColor = computed(() => {
  const connectionIds = store.state.multipleConnectionsSelectedIds
  const currentCardConnections = store.getters['currentConnections/byCardId'](props.card.id)
  const connection = currentCardConnections.find(currentCardConnection => connectionIds.includes(currentCardConnection.id))
  return connectionColor(connection)
})
// this card, or another card connected to this card, is being hovered over
const currentUserIsHoveringOverConnectedCardColor = computed(() => {
  const cardId = store.state.currentUserIsHoveringOverCardId
  const connection = connectionFromAnotherCardConnectedToCurrentCard(cardId)
  return connectionColor(connection)
})
// this card, or another card connected to this card, is paint selected
const currentUserIsMultipleSelectedCardColor = computed(() => {
  const cardIds = store.state.multipleCardsSelectedIds
  const connection = connectionsFromMultipleCardsConnectedToCurrentCard(cardIds)
  return connectionColor(connection)
})
// a current connection is being made by dragging from this card's connector
const currentUserIsCreatingConnectionColor = computed(() => {
  if (!store.state.currentUserIsDrawingConnection) { return }
  const cardIds = store.state.currentConnectionStartCardIds
  const isCurrentlyConnecting = cardIds.includes(props.card.id)
  if (!isCurrentlyConnecting) { return }
  return store.state.currentConnectionColor
})

// card buttons

const isCardButtonsVisible = computed(() => {
  return isLocked.value || (cardButtonUrl.value && !isComment.value) || connectorIsVisible.value
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
      store.dispatch('closeAllDialogs')
      return
    } else {
      event.preventDefault()
      event.stopPropagation()
    }
  }
  store.dispatch('closeAllDialogs')
  if (store.state.cardsWereDragged) {
    return
  }
  const isSpaceUrl = utils.urlIsSpace(url) && !utils.urlIsInvite(url)
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
  const showAbsoluteDate = store.state.currentUser.filterShowAbsoluteDates
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
const toggleFilterShowAbsoluteDates = () => {
  store.dispatch('currentCards/incrementZ', props.card.id)
  store.dispatch('closeAllDialogs')
  const value = !store.state.currentUser.filterShowAbsoluteDates
  store.dispatch('currentUser/toggleFilterShowAbsoluteDates', value)
}
const updateRemoteConnections = () => {
  const connection = store.state.remoteCurrentConnections.find(remoteConnection => {
    const isConnectedToStart = remoteConnection.startCardId === props.card.id
    const isConnectedToEnd = remoteConnection.endCardId === props.card.id
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
  const pendingUploads = store.state.upload.pendingUploads
  return pendingUploads.find(upload => upload.cardId === props.card.id)
})
const remoteCardPendingUpload = computed(() => {
  return store.state.remotePendingUploads.find(upload => {
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
  const color = store.state.currentUser.color
  if (state.uploadIsDraggedOver) {
    return color
  } else {
    return undefined
  }
})
const remoteUploadDraggedOverCardColor = computed(() => {
  const draggedOverCard = store.state.remoteUploadDraggedOverCards.find(card => card.cardId === props.card.id)
  if (draggedOverCard) {
    const user = store.getters['currentSpace/userById'](draggedOverCard.userId)
    return user.color
  } else {
    return undefined
  }
})
const addFile = (file) => {
  let name = props.card.name
  const url = file.url
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
    // prepend url to name
    name = utils.trim(name)
    name = `${url}\n\n${name}`
  }
  // ensure checkbox is first
  if (checkbox) {
    name = name.replace(checkbox, '')
    name = `${checkbox} ${name}`
  }
  // update name
  store.dispatch('currentCards/update', {
    id: props.card.id,
    name: utils.trim(name)
  })
  store.commit('triggerUpdateHeaderAndFooterPosition')
}
const clearErrors = () => {
  state.error.signUpToUpload = false
  state.error.sizeLimit = false
  state.error.unknownUploadError = false
  state.error.spaceIsReadOnly = false
}
const checkIfUploadIsDraggedOver = (event) => {
  if (event.dataTransfer.types[0] === 'Files' || event.dataTransfer.items[0].kind === 'file') {
    state.uploadIsDraggedOver = true
    const updates = {
      cardId: props.card.id,
      userId: store.state.currentUser.id
    }
    store.commit('broadcast/updateStore', { updates, type: 'addToRemoteUploadDraggedOverCards' })
  }
}
const removeUploadIsDraggedOver = () => {
  state.uploadIsDraggedOver = false
  const userId = store.state.currentUser.id
  store.commit('broadcast/updateStore', { updates: { userId }, type: 'clearRemoteUploadDraggedOverCards' })
}
const uploadFile = async (event) => {
  removeUploadIsDraggedOver()
  store.dispatch('currentCards/incrementZ', props.card.id)
  // pre-upload errors
  if (!currentUserIsSignedIn.value) {
    state.error.signUpToUpload = true
    store.commit('addNotification', { message: 'To upload files, you need to Sign Up or In', type: 'info' })
    return
  }
  if (!canEditSpace.value) {
    state.error.spaceIsReadOnly = true
    store.commit('addNotification', { message: 'You can only upload files on spaces you can edit', type: 'info' })
    return
  }
  const file = event.dataTransfer.files[0]
  const cardId = props.card.id
  // upload
  try {
    await store.dispatch('upload/uploadFile', { file, cardId })
  } catch (error) {
    console.warn('🚒', error)
    if (error.type === 'sizeLimit') {
      state.error.sizeLimit = true
    } else {
      state.error.unknownUploadError = true
    }
    store.commit('addNotification', { message: error.message, type: 'danger' })
  }
}

// name

const name = computed(() => {
  updateMediaUrls()
  return props.card.name
})
const hasTextSegments = computed(() => {
  return nameSegments.value.find(segment => segment.isText && segment.content)
})
const normalizedName = computed(() => {
  // name without urls and checkbox text
  let newName = name.value
  if (!newName) { return }
  if (cardHasMedia.value) {
    newName = newName.replace(state.formats.image, '')
    newName = newName.replace(state.formats.video, '')
    newName = newName.replace(state.formats.audio, '')
  }
  // link hiding
  let link = state.formats.link
  let isHidden
  let markdownLinks = newName.match(utils.markdown().linkPattern)
  if (markdownLinks) {
    const linkIsMarkdown = markdownLinks.find(markdownLink => markdownLink.includes(link))
    isHidden = !linkIsMarkdown
  } else if (link?.includes('hidden=true')) {
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
const nameSegments = computed(() => {
  let segments = utils.cardNameSegments(normalizedName.value)
  segments = segments.map(segment => {
    segment.isDark = backgroundColorIsDark.value
    // tags
    if (segment.isTag) {
      let tag = store.getters['currentSpace/tagByName'](segment.name)
      if (!tag) {
        tag = utils.newTag({
          name: segment.name,
          defaultColor: store.state.currentUser.color,
          cardId: props.card.id,
          spaceId: store.state.currentSpace.id
        })
        console.warn('🦋 create missing tag', segment.name, tag, props.card)
        store.dispatch('currentSpace/addTag', tag)
      }
      segment.color = tag.color
      segment.id = tag.id
    // invite
    } else if (segment.isInviteLink) {
      const { spaceId, collaboratorKey } = segment
      segment.otherSpace = store.getters.otherSpaceById(spaceId)
    // space or card
    } else if (segment.isLink) {
      const { spaceId, cardId } = utils.spaceAndCardIdFromUrl(segment.name)
      segment.otherSpace = store.getters.otherSpaceById(spaceId)
      segment.otherCard = store.getters.otherCardById(cardId)
    // text
    } else if (segment.isText) {
      segment.markdown = utils.markdownSegments(segment.content)
    }
    return segment
  })
  return segments
})

// tags

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
  if (!canEditCard.value) { store.commit('triggerReadOnlyJiggle') }
  if (state.preventDraggedButtonBadgeFromShowingDetails) { return }
  store.dispatch('currentCards/incrementZ', props.card.id)
  store.dispatch('closeAllDialogs')
  store.commit('currentUserIsDraggingCard', false)
  const tagRect = event.target.getBoundingClientRect()
  store.commit('tagDetailsPosition', {
    x: window.scrollX + tagRect.x + 2,
    y: window.scrollY + tagRect.y + tagRect.height - 2,
    pageX: window.scrollX,
    pageY: window.scrollY
  })
  tag.cardId = props.card.id
  store.commit('currentSelectedTag', tag)
  store.commit('tagDetailsIsVisible', true)
  cancelLocking()
  store.commit('currentUserIsDraggingCard', false)
}

// url preview

const urls = computed(() => {
  const normalizedName = utils.removeMarkdownCodeblocksFromString(name.value)
  let urls = utils.urlsFromString(normalizedName)
  if (urls) {
    urls.reverse()
  }
  updateMediaUrls(urls)
  urls = urls?.filter(url => Boolean(url))
  return urls || []
})
const cardHasUrls = computed(() => {
  if (!urls.value.length) {
    return false
  } else {
    return true
  }
})
const urlPreviewImageIsVisible = computed(() => {
  return Boolean(cardUrlPreviewIsVisible.value && props.card.urlPreviewImage && !props.card.shouldHideUrlPreviewImage)
})
const cardUrlPreviewIsVisible = computed(() => {
  if (!props.card) { return }
  if (!props.card.name) { return }
  let cardHasUrlPreviewInfo = Boolean(props.card.urlPreviewTitle || props.card.urlPreviewDescription || props.card.urlPreviewImage)
  // TEMP experiment: remove card.urlPreviewErrorUrl checking to eliminate false positives. Observe if there's a downside irl and if this attribute should be removed entirely?
  // const isErrorUrl = props.card.urlPreviewErrorUrl && (props.card.urlPreviewUrl === props.card.urlPreviewErrorUrl)
  let url = props.card.urlPreviewUrl
  url = utils.removeTrailingSlash(url)
  cardHasUrlPreviewInfo = Boolean(cardHasUrlPreviewInfo && url)
  const nameHasUrl = props.card.name?.includes(url)
  return (props.card.urlPreviewIsVisible && cardHasUrlPreviewInfo && nameHasUrl) && !isComment.value
  // return Boolean(props.card.urlPreviewIsVisible && props.card.urlPreviewUrl && cardHasUrlPreviewInfo) // && !isErrorUrl
})
const isLoadingUrlPreview = computed(() => {
  let isLoading = store.state.urlPreviewLoadingForCardIds.find(cardId => cardId === props.card.id)
  return Boolean(isLoading)
  // if (!isLoading) { return }
  // const isErrorUrl = props.card.urlPreviewErrorUrl && (props.card.urlPreviewUrl === props.card.urlPreviewErrorUrl)
  // return isLoading && !isErrorUrl
})
const updateUrlPreviewOnload = async () => {
  if (!props.card.shouldUpdateUrlPreview) { return }
  updateMediaUrls()
  const isUpdatedSuccess = await updateUrlPreview()
  store.dispatch('currentCards/update', {
    id: props.card.id,
    shouldUpdateUrlPreview: false
  })
  if (isUpdatedSuccess) {
    store.commit('triggerUpdateUrlPreviewComplete', props.card.id)
  }
}
const preventUpdatePrevPreview = computed(() => {
  if (props.card.shouldUpdateUrlPreview) { return }
  const updateDelta = dayjs(updatedAt.value).diff(state.sessionStartDate, 'second')
  return updateDelta < 0
})
const updateUrlPreview = () => {
  const isOffline = !store.state.isOnline
  if (preventUpdatePrevPreview.value) { return }
  if (isOffline) {
    store.dispatch('currentCards/update', {
      id: props.card.id,
      shouldUpdateUrlPreview: true
    })
  } else {
    updateUrlPreviewOnline()
  }
}
const updateUrlPreviewOnline = async () => {
  store.commit('addUrlPreviewLoadingForCardIds', props.card.id)
  const cardId = props.card.id
  let url = webUrl.value
  if (!url) {
    store.commit('removeUrlPreviewLoadingForCardIds', cardId)
    return
  }
  const shouldUpdate = shouldUpdateUrlPreview(url)
  if (!shouldUpdate) {
    store.commit('removeUrlPreviewLoadingForCardIds', cardId)
    return
  }
  try {
    url = utils.removeHiddenQueryStringFromURLs(url)
    let response = await store.dispatch('api/urlPreview', url)
    if (!response) { throw 'api/urlPreview' }
    let { data, host } = response
    const { links, meta } = data
    console.log('🚗 link preview', url, data, links, meta)
    if (!links) { throw 'link preview error' }
    let html
    if (links.player || links.reader) {
      html = data.html
    }
    updateUrlPreviewSuccess({ links, meta, cardId, url, html })
  } catch (error) {
    console.warn('🚑', error, url)
    updateUrlPreviewErrorUrl(url)
  }
}
const retryUrlPreview = () => {
  store.dispatch('currentCards/update', {
    id: props.card.id,
    shouldUpdateUrlPreview: true
  })
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
  const normalizedUrl = utils.removeTrailingSlash(url)
  return name.includes(url) || name.includes(normalizedUrl) || normalizedUrl.includes(name)
}
const previewImage = ({ thumbnail }) => {
  const minWidth = consts.defaultCardMaxWidth
  if (!thumbnail) { return '' }
  let image = thumbnail.find(item => {
    let shouldSkipImage = false
    if (item.media) {
      if (item.media.width < minWidth) {
        shouldSkipImage = true
      }
    }
    return item.href && !shouldSkipImage
  })
  if (!image) { return '' }
  return image.href || ''
}
const previewFavicon = ({ icon }) => {
  if (!icon) { return '' }
  let image = icon.find(item => item.href)
  return image.href || ''
}
const updateUrlPreviewImage = (update) => {
  if (!currentUserIsSignedIn.value) { return }
  if (!update.urlPreviewImage) { return }
  update.cardId = update.id
  update.spaceId = store.state.currentSpace.id
  delete update.id
  store.dispatch('api/updateUrlPreviewImage', update)
}
const updateUrlPreviewSuccess = ({ links, meta, cardId, url, html }) => {
  if (!nameIncludesUrl(url)) { return }
  cardId = cardId || props.card.id
  if (!cardId) {
    console.warn('🚑 could not updateUrlPreviewSuccess', cardId, props.card)
    store.commit('removeUrlPreviewLoadingForCardIds', cardId)
    return
  }
  const update = {
    id: cardId,
    name: utils.addHiddenQueryStringToURLs(props.card.name),
    urlPreviewUrl: url,
    urlPreviewTitle: utils.truncated(meta.title || meta.site),
    urlPreviewDescription: utils.truncated(meta.description, 280),
    urlPreviewImage: previewImage(links),
    urlPreviewFavicon: previewFavicon(links),
    urlPreviewEmbedHtml: html
  }
  store.dispatch('currentCards/update', update)
  store.commit('removeUrlPreviewLoadingForCardIds', cardId)
  store.dispatch('api/addToQueue', { name: 'updateUrlPreviewImage', body: update })
}
const updateUrlPreviewErrorUrl = (url) => {
  const cardId = props.card.id
  store.commit('removeUrlPreviewLoadingForCardIds', cardId)
  const update = {
    id: cardId,
    urlPreviewErrorUrl: url,
    urlPreviewUrl: url,
    name: props.card.name
  }
  store.dispatch('currentCards/update', update)
}

// drag cards

const currentCardIsBeingDragged = computed(() => {
  let isCardId
  const currentDraggingCard = store.state.currentDraggingCardId
  const isDraggingCard = store.state.currentUserIsDraggingCard
  if (isSelected.value || currentDraggingCard === props.card.id) {
    isCardId = true
  }
  return Boolean(isDraggingCard && isCardId)
})
const isRemoteCardDragging = computed(() => {
  const isDragging = store.state.remoteCardsDragging.find(card => card.cardId === props.card.id)
  return Boolean(isDragging)
})
const remoteCardDraggingColor = computed(() => {
  const draggingCard = store.state.remoteCardsDragging.find(card => card.cardId === props.card.id)
  if (draggingCard) {
    const user = store.getters['currentSpace/userById'](draggingCard.userId)
    return user.color
  } else {
    return undefined
  }
})
const checkIfShouldDragMultipleCards = (event) => {
  if (event.shiftKey) { return }
  // if the current dragging card is not already selected then clear selection
  const multipleCardsSelectedIds = store.state.multipleCardsSelectedIds
  if (!multipleCardsSelectedIds.includes(props.card.id)) {
    store.dispatch('clearMultipleSelected')
  }
}
const startDraggingCard = (event) => {
  isMultiTouch = false
  if (event.ctrlKey) { return }
  if (isLocked.value) { return }
  if (store.state.currentUserIsPanningReady) { return }
  if (!canEditCard.value) { return }
  if (utils.isMultiTouch(event)) {
    isMultiTouch = true
    return
  }
  event.preventDefault()
  if (store.state.currentUserIsDrawingConnection) { return }
  store.dispatch('closeAllDialogs')
  store.commit('currentUserIsDraggingCard', true)
  store.commit('currentDraggingCardId', props.card.id)
  postMessage.sendHaptics({ name: 'softImpact' })
  const updates = {
    cardId: props.card.id,
    userId: store.state.currentUser.id
  }
  store.commit('broadcast/updateStore', { updates, type: 'addToRemoteCardsDragging' })
  store.commit('parentCardId', props.card.id)
  store.commit('childCardId', '')
  checkIfShouldDragMultipleCards(event)
}
const notifyPressAndHoldToDrag = () => {
  if (isLocked.value) { return }
  const isDrawingConnection = store.state.currentUserIsDrawingConnection
  if (isDrawingConnection) { return }
  const hasNotified = store.state.hasNotifiedPressAndHoldToDrag
  if (!hasNotified) {
    store.commit('addNotification', { message: 'Press and hold to drag', icon: 'press-and-hold' })
  }
  store.commit('hasNotifiedPressAndHoldToDrag', true)
}

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
    console.log('🔒🐢 card lockingAnimationFrame locked')
    lockingAnimationTimer = undefined
    lockingStartTime = undefined
    state.isLocking = false
    startDraggingCard(initialTouchEvent)
    store.commit('triggeredTouchCardDragPosition', touchPosition)
  } else {
    window.cancelAnimationFrame(lockingAnimationTimer)
    lockingAnimationTimer = undefined
    lockingStartTime = undefined
    cancelLockingAnimationFrame()
  }
}
const updateCurrentTouchPosition = (event) => {
  currentTouchPosition = utils.cursorPositionInViewport(event)
  if (currentCardIsBeingDragged.value || store.state.currentUserIsResizingCard || store.state.currentUserIsTiltingCard) {
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
  const isDrawingConnection = store.state.currentUserIsDrawingConnection
  if (isDrawingConnection) {
    event.preventDefault() // allows swipe to scroll, before card locked
  }
}

// select cards

const isSelected = computed(() => {
  const multipleCardsSelectedIds = store.state.multipleCardsSelectedIds
  return multipleCardsSelectedIds.includes(props.card.id)
})
const selectedColor = computed(() => {
  const color = store.state.currentUser.color
  if (isSelected.value) {
    return color
  } else {
    return undefined
  }
})
const isRemoteSelected = computed(() => {
  const selectedCard = store.state.remoteCardsSelected.find(card => card.cardId === props.card.id)
  return Boolean(selectedCard)
})
const remoteSelectedColor = computed(() => {
  const selectedCard = store.state.remoteCardsSelected.find(card => card.cardId === props.card.id)
  if (selectedCard) {
    const user = store.getters['currentSpace/userById'](selectedCard.userId)
    return user.color
  } else {
    return undefined
  }
})
const selectAllConnectedCards = (event) => {
  const isMeta = event.metaKey || event.ctrlKey
  if (!isMeta) { return }
  if (!canEditSpace.value) { return }
  store.dispatch('closeAllDialogs')
  const connections = store.getters['currentConnections/all']
  let selectedCards = [props.card.id]
  let shouldSearch = true
  while (shouldSearch) {
    let cancelSearch = true
    connections.forEach(connection => {
      const startCard = connection.startCardId
      const endCard = connection.endCardId
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
  store.commit('multipleSelectedActionsIsVisible', false)
  store.commit('multipleCardsSelectedIds', selectedCards)
}

// card details

const currentCardDetailsIsVisible = computed(() => {
  return props.card.id === store.state.cardDetailsIsVisibleForCardId
})
const isRemoteCardDetailsVisible = computed(() => {
  const visibleCard = store.state.remoteCardDetailsVisible.find(card => card.cardId === props.card.id)
  return Boolean(visibleCard)
})
const remoteCardDetailsVisibleColor = computed(() => {
  const visibleCard = store.state.remoteCardDetailsVisible.find(card => card.cardId === props.card.id)
  if (visibleCard) {
    const user = store.getters['currentSpace/userById'](visibleCard.userId)
    return user.color
  } else {
    return undefined
  }
})
const showCardDetails = (event) => {
  if (store.state.cardDetailsIsVisibleForCardId) { return }
  if (isLocked.value) { return }
  if (store.state.currentUserIsPainting) { return }
  if (store.state.currentUserIsDraggingConnectionIdLabel) { return }
  if (isMultiTouch) { return }
  if (store.state.currentUserIsPanningReady || store.state.currentUserIsPanning) { return }
  if (store.state.currentUserIsResizingBox || store.state.currentUserIsDraggingBox) { return }
  if (!canEditCard.value) { store.commit('triggerReadOnlyJiggle') }
  const shouldToggleSelected = event.shiftKey && !store.state.cardsWereDragged && !isConnectingTo.value
  if (shouldToggleSelected) {
    store.dispatch('toggleCardSelected', props.card.id)
    event.stopPropagation()
    store.commit('currentUserIsDraggingCard', false)
    return
  }
  const userId = store.state.currentUser.id
  store.commit('broadcast/updateStore', { updates: { userId }, type: 'clearRemoteCardsDragging' })
  state.preventDraggedButtonBadgeFromShowingDetails = store.state.preventDraggedCardFromShowingDetails
  if (store.state.preventDraggedCardFromShowingDetails) { return }
  store.dispatch('closeAllDialogs')
  store.dispatch('clearMultipleSelected')
  const nodeName = event.target.nodeName
  if (nodeName === 'LABEL') { return } // checkbox
  if (nodeName === 'A' && event.touches) {
    window.location = event.target.href
    return
  }
  store.commit('cardDetailsIsVisibleForCardId', props.card.id)
  store.commit('preventCardDetailsOpeningAnimation', true)
  store.commit('parentCardId', props.card.id)
  event.stopPropagation() // only stop propagation if cardDetailsIsVisible
  store.commit('currentUserIsDraggingCard', false)
  updatePreviousResultItem()
  clearStickyPositionOffsets()
}
const showCardDetailsTouch = (event) => {
  cancelLocking()
  if (touchIsNearTouchPosition(event)) {
    showCardDetails(event)
  }
  const userId = store.state.currentUser.id
  store.commit('broadcast/updateStore', { updates: { userId }, type: 'clearRemoteCardsDragging' })
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

const filtersIsActive = computed(() => {
  return Boolean(store.getters['currentUser/totalCardFadingFiltersActive'])
})
const isCardFilteredByTags = computed(() => {
  const tagNames = store.state.filteredTagNames
  if (!tagNames.length) { return }
  const hasTag = tags.value.find(tag => {
    if (tagNames.includes(tag.name)) {
      return true
    }
  })
  return hasTag
})
const isConnectionFilteredByType = computed(() => {
  const typeIds = store.state.filteredConnectionTypeIds
  if (!typeIds) { return }
  const filteredTypes = connectedConnectionTypes.value.filter(type => {
    return typeIds.includes(type.id)
  })
  return Boolean(filteredTypes.length)
})
const isCardFilteredByFrame = computed(() => {
  const frameIds = store.state.filteredFrameIds
  if (!frameIds.length) { return }
  const hasFrame = frameIds.includes(props.card.frameId)
  return hasFrame
})
const isCardFilteredByUnchecked = computed(() => {
  const filterUncheckedIsActive = store.state.currentUser.filterUnchecked
  if (!filterUncheckedIsActive) { return }
  return !isChecked.value && hasCheckbox.value
})
const isCardHiddenByCommentFilter = computed(() => {
  const filterCommentsIsActive = store.state.currentUser.filterComments
  if (!filterCommentsIsActive) { return }
  return isComment.value
})
const isFiltered = computed(() => {
  if (!filtersIsActive.value) { return }
  const isInFilter = isCardFilteredByTags.value || isConnectionFilteredByType.value || isCardFilteredByFrame.value || isCardFilteredByUnchecked.value
  return !isInFilter
})

// user

const createdByUser = computed(() => {
  // same as userDetailsWrap.cardCreatedByUser
  const userId = props.card.userId
  let user = store.getters['currentSpace/userById'](userId)
  if (!user) {
    user = {
      name: '',
      color: '#cdcdcd' // secondary-active-background
    }
  }
  return user
})
const userDetailsIsUser = computed(() => {
  if (!store.state.userDetailsIsVisible) { return }
  const user = createdByUser.value
  return user.id === store.state.userDetailsUser.id
})

// is visible in viewport, perf, should render

const initViewportObserver = async () => {
  await nextTick()
  try {
    let callback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          state.isVisibleInViewport = true
        } else {
          state.isVisibleInViewport = false
        }
      })
    }
    const target = cardElement.value
    observer = new IntersectionObserver(callback, { rootMargin: '100%' })
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
  const isConnectingFrom = store.state.currentConnectionStartCardIds.includes(props.card.id)
  const shouldExplitlyRender = store.state.shouldExplicitlyRenderCardIds.includes(props.card.id)
  if (isConnectingFrom) { return true }
  if (shouldExplitlyRender) { return true }
  if (connectedToAnotherCardBeingDraggedColor.value) { return true }
  if (isSelectedOrDragging.value) { return true }
  if (state.isVisibleInViewport) {
    updateLockedItemButtonPosition()
  }
  return state.isVisibleInViewport
})
const updateLockedItemButtonPosition = async () => {
  if (!props.card.isLocked) { return }
  await nextTick()
  store.commit('triggerUpdateLockedItemButtonPositionCardId', props.card.id)
}

// mouse hover handlers

const handleMouseEnter = () => {
  initStickToCursor()
  store.commit('currentUserIsHoveringOverCardId', props.card.id)
}
const handleMouseLeave = () => {
  unstickToCursor()
  store.commit('currentUserIsHoveringOverCardId', '')
}
const handleMouseEnterConnector = (event) => {
  store.commit('currentUserIsHoveringOverConnectorCardId', props.card.id)
}
const handleMouseLeaveConnector = () => {
  store.commit('currentUserIsHoveringOverConnectorCardId', '')
}

// sticky

const shouldNotStick = computed(() => {
  if (!store.state.currentUser.shouldUseStickyCards) { return true }
  if (urlEmbedIsVisible.value) { return true }
  if (store.state.codeLanguagePickerIsVisible) { return true }
  if (store.state.currentUserIsDraggingConnectionIdLabel) { return true }
  const userIsConnecting = store.state.currentConnectionStartCardIds.length
  const currentUserIsPanning = store.state.currentUserIsPanningReady || store.state.currentUserIsPanning
  return userIsConnecting || store.state.currentUserIsDraggingBox || store.state.currentUserIsResizingBox || currentUserIsPanning || currentCardDetailsIsVisible.value || isRemoteCardDetailsVisible.value || isRemoteCardDragging.value || currentCardIsBeingDragged.value || store.state.currentUserIsResizingCard || store.state.currentUserIsTiltingCard || isLocked.value
})
const initStickToCursor = () => {
  preventSticking = false
  if (shouldNotStick.value || consts.userPrefersReducedMotion()) {
    preventSticking = true
  }
  stickyTimer = setTimeout(() => {
    stickyTimerComplete = true
  }, stickyTimerDuration)
  updateStickyStretchResistance()
}
const clearStickyTimer = () => {
  clearTimeout(stickyTimer)
  stickyTimerComplete = false
}
const isValidStickySize = (width, height, min) => {
  const isWidth = width > min
  const isHeight = height > min
  return isWidth || isHeight
}
const updateStickyStretchResistance = () => {
  const zoom = store.getters.spaceZoomDecimal
  let { height, width } = props.card
  height = height * zoom
  width = width * zoom
  let stretchResistance = 6 // higher resistance moves less
  // larger sizes have higher resistance
  const size = {
    s: isValidStickySize(width, height, 250),
    m: isValidStickySize(width, height, 500),
    l: isValidStickySize(width, height, 1000),
    xl: width > 1200 || height > 1000
  }
  if (size.xl) {
    stretchResistance = 20
  } else if (size.l) {
    stretchResistance = 16
  } else if (size.m) {
    stretchResistance = 12
  } else if (size.s) {
    stretchResistance = 10
  }
  state.stickyStretchResistance = stretchResistance
}
const stickToCursor = (event) => {
  if (state.isAnimationUnsticking) { return }
  if (preventSticking) { return }
  if (!stickyTimerComplete) { return }
  const classes = ['checkbox-wrap', 'button-wrap', 'progress-wrap', 'inline-button', 'badge']
  const elements = ['button', 'progress', 'iframe']
  const isOverAction = classes.includes(event.target.className) || elements.includes(event.target.nodeName.toLowerCase())
  const isOverTag = event.target.className.includes('button-badge')
  if (shouldNotStick.value || isOverAction || isOverTag) {
    clearStickyPositionOffsets()
    preventSticking = true
    return
  }
  const isButtonHover = event.target.closest('.inline-button-wrap') || event.target.closest('.button-wrap')
  if (isButtonHover) {
    clearStickyPositionOffsets()
    return
  }
  const stretchResistance = state.stickyStretchResistance
  const { height, width } = props.card
  const halfWidth = width / 2
  const halfHeight = height / 2
  let centerX = x.value + halfWidth
  let centerY = y.value + halfHeight
  let position = utils.cursorPositionInSpace(event)
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
  let timing = {
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
  if (store.state.currentUserIsDrawingConnection) {
    return
  }
  event.stopPropagation()
  if (!canEditCard.value) {
    const position = utils.cursorPositionInSpace(event)
    store.commit('addNotificationWithPosition', { message: 'Card is Read Only', position, type: 'info', layer: 'space', icon: 'cancel' })
    return
  }
  store.commit('currentUserIsDraggingCard', false)
  store.dispatch('currentCards/update', {
    id: props.card.id,
    isLocked: false
  })
}
const lockingFrameStyle = computed(() => {
  const initialPadding = 65 // matches initialLockCircleRadius in magicPaint
  const initialBorderRadius = 50
  const padding = initialPadding * state.lockingPercent
  const userColor = store.state.currentUser.color
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
    borderRadius: borderRadius
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
    store.dispatch('currentCards/update', update)
    return
  }
  if (!url) { return }
  const urlIsSpace = utils.urlIsSpace(url)
  const urlIsInvite = utils.urlIsInvite(url)
  url = new URL(url)
  if (urlIsInvite) {
    updateOtherInviteItems(url)
  } else if (urlIsSpace) {
    updateOtherSpaceOrCardItems(url)
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
  store.dispatch('currentCards/update', update)
  store.dispatch('currentSpace/updateOtherItems', { spaceId, cardId })
}
const updateOtherInviteItems = (url) => {
  const { spaceId, collaboratorKey } = qs.decode(url.search)
  const linkExists = spaceId === props.card.linkToSpaceId && collaboratorKey === props.card.linkToSpaceCollaboratorKey
  if (linkExists) { return }
  const update = {
    id: props.card.id,
    linkToSpaceId: spaceId,
    linkToCardId: null,
    linkToSpaceCollaboratorKey: collaboratorKey
  }
  store.dispatch('currentCards/update', update)
  store.dispatch('currentSpace/updateOtherItems', { spaceId, collaboratorKey })
}

// utils

const removeCard = () => {
  if (isLocked.value) { return }
  if (canEditCard.value) {
    store.dispatch('currentCards/remove', props.card)
  }
}
const closeAllDialogs = () => {
  store.dispatch('closeAllDialogs')
}

// migration added june 2023

const checkIfShouldUpdatePreviewHtml = () => {
  const name = props.card.name
  if (!name) { return }
  const url = utils.urlFromString(name)
  if (!url) { return }
  const urlIsYoutube = utils.urlIsYoutube(url)
  const urlIsSpotify = url.includes('open.spotify.com')
  const shouldUpdate = urlIsYoutube || urlIsSpotify
  if (shouldUpdate && !props.card.urlPreviewEmbedHtml) {
    retryUrlPreview()
  }
}

</script>

<template lang="pug">
article.card-wrap#card(
  :style="articleStyle"
  :data-card-id="card.id"
  :data-is-hidden-by-comment-filter="isCardHiddenByCommentFilter"
  :data-is-visible-in-viewport="state.isVisibleInViewport"
  :data-should-render="shouldRender"
  :data-is-locked="isLocked"
  :data-resize-width="resizeWidth"
  :data-tilt-degrees="card.tilt"
  :data-sticky-stretch-resistance="state.stickyStretchResistance"
  :data-x="x"
  :data-y="y"
  :key="card.id"
  ref="cardElement"
  :class="articleClasses"
)
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

    template(v-if="!isComment")
      ImageOrVideo(:isSelectedOrDragging="isSelectedOrDragging" :pendingUploadDataUrl="pendingUploadDataUrl" :image="state.formats.image" :video="state.formats.video" @updateCardDimensions="updateCardDimensions")

    TiltResize(:card="card" :visible="tiltResizeIsVisible")

    //- Content
    span.card-content-wrap(:style="cardContentWrapStyles")
      //- Comment
      .card-comment(v-if="isComment")
        //- [·]
        .checkbox-wrap(v-if="hasCheckbox" @mouseup.left="toggleCardChecked" @touchend.prevent="toggleCardChecked")
          label(:class="{active: isChecked, disabled: !canEditSpace}")
            input(type="checkbox" v-model="checkboxState")
        //- Name
        .badge.comment-badge
          img.icon.view(src="@/assets/comment.svg")
          //- User
          UserLabelInline(:user="createdByUser" :shouldHideName="true")

      //- Not Comment
      .card-content(v-if="!isComment" :style="cardContentStyles")
        //- Audio
        .audio-wrap(v-if="Boolean(state.formats.audio)")
          Audio(:visible="Boolean(state.formats.audio)" :url="state.formats.audio" @isPlaying="updateIsPlayingAudio" :selectedColor="selectedColor" :normalizedName="normalizedName")
        .name-wrap
          //- [·]
          .checkbox-wrap(v-if="hasCheckbox" @mouseup.left="toggleCardChecked" @touchend.prevent="toggleCardChecked")
            label(:class="{active: isChecked, disabled: !canEditSpace}")
              input(type="checkbox" v-model="checkboxState")
          //- Name
          p.name.name-segments(v-if="normalizedName" :style="{background: currentBackgroundColor}" :class="{'is-checked': isChecked, 'has-checkbox': hasCheckbox, 'badge badge-status': isImageCard && hasTextSegments}")
            template(v-for="segment in nameSegments")
              NameSegment(:segment="segment" @showTagDetailsIsVisible="showTagDetailsIsVisible" :parentCardId="card.id" :backgroundColorIsDark="currentBackgroundColorIsDark" :headerFontId="card.headerFontId")
            Loader(:visible="isLoadingUrlPreview")

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
          //- Url →
          a.url-wrap(v-if="cardButtonUrl && !isComment" :href="cardButtonUrl" @mouseup.exact.prevent="closeAllDialogs" @click.stop="openUrl($event, cardButtonUrl)" @touchend.prevent="openUrl($event, cardButtonUrl)" :class="{'connector-is-visible': connectorIsVisible}" target="_blank")
            .url.inline-button-wrap
              button.inline-button(:style="{background: currentBackgroundColor}" :class="{'is-light-in-dark-theme': isLightInDarkTheme, 'is-dark-in-light-theme': isDarkInLightTheme}" tabindex="-1")
                img.icon.visit.arrow-icon(src="@/assets/visit.svg")
          //- Connector
          .connector.inline-button-wrap(
            v-if="connectorIsVisible"
            :data-card-id="card.id"
            @mousedown.left="startConnecting"
            @touchstart="startConnecting"
            @mouseenter="handleMouseEnterConnector"
            @mouseleave="handleMouseLeaveConnector"
          )
            .connector-glow(:style="connectorGlowStyle" tabindex="-1")
            .connected-colors
              template(v-if="isConnectingTo || isConnectingFrom")
                .color(:style="{ background: currentConnectionColor}")
              template(v-else-if="state.isRemoteConnecting")
                .color(:style="{ background: state.remoteConnectionColor }")
              template(v-else v-for="type in connectedConnectionTypes")
                .color(:style="{ background: type.color}")

            button.inline-button.connector-button(
              :class="{ active: isConnectingTo || isConnectingFrom, 'is-light-in-dark-theme': isConnectorLightInDarkTheme, 'is-dark-in-light-theme': isConnectorDarkInLightTheme}"
              :style="{background: connectorButtonBackground }"
              tabindex="-1"
              @keyup.stop.enter="showCardDetails"
            )
              template(v-if="hasConnections || isConnectingFrom || isConnectingTo")
                img.connector-icon(src="@/assets/connector-closed-in-card.svg")
              //- template(v-else)
              //-   img.connector-icon(src="@/assets/connector-open-in-card.svg")
    .url-preview-wrap(v-if="cardUrlPreviewIsVisible || otherCardIsVisible || otherSpaceIsVisible" :class="{'is-image-card': isImageCard}")
      template(v-if="cardUrlPreviewIsVisible")
        UrlPreviewCard(
          :visible="true"
          :card="card"
          :user="createdByUser"
          :isImageCard="isImageCard"
          :isSelected="isSelectedOrDragging"
          :urlPreviewImageIsVisible="urlPreviewImageIsVisible"
          :isLoadingUrlPreview="isLoadingUrlPreview"
          @retryUrlPreview="retryUrlPreview"
          :backgroundColor="backgroundColor"
        )
      template(v-if="otherCardIsVisible")
        OtherCardPreview(
          :otherCard="otherCard"
          :url="otherCardUrl"
          :parentCardId="card.id"
          :shouldCloseAllDialogs="true"
          :isSelected="isSelectedOrDragging"
          :selectedColor="selectedColor"
        )
      template(v-else-if="otherSpaceIsVisible")
        OtherSpacePreviewCard(
          :otherSpace="otherSpace"
          :url="otherSpaceUrl"
          :card="card"
          :isSelected="isSelectedOrDragging"
          :selectedColor="selectedColor"
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
    //- Counter
    CardCounter(:card="card")
    //- Created Through API
    .badge.secondary(v-if="card.isCreatedThroughPublicApi && filterShowUsers" title="Created via public API")
      img.icon.system(src="@/assets/system.svg")
    //- User
    .badge-wrap(v-if="filterShowUsers")
      UserLabelInline(:user="createdByUser" :isClickable="true")
    //- Date
    .badge.secondary.button-badge(v-if="filterShowDateUpdated" @click.left.prevent.stop="toggleFilterShowAbsoluteDates" @touchend.prevent.stop="toggleFilterShowAbsoluteDates")
      img.icon.time(src="@/assets/time.svg")
      .name {{dateUpdatedAt}}

</template>

<style lang="stylus">
article.card-wrap
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
    .name
      color var(--primary-on-light-background)
    &:hover,
    &.hover
      box-shadow var(--hover-shadow)
    &:active,
    &.active
      box-shadow var(--active-shadow)
    &.is-dark
      .name
        color var(--primary-on-dark-background)
    &:focus
      outline 2px solid var(--primary-border)

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
        height 18px
        min-height 17px
        img
          top 6px

    .card-content-wrap
      display flex
      align-items flex-start
      justify-content space-between

    .card-content
      min-width 28px
      margin-right 8px
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

    .checkbox-wrap
      z-index 1

    .name-wrap,
    .card-comment
      display flex
      align-items flex-start
      > .loader
        transform translateX(8px) translateY(8px)
      .checkbox-wrap
        padding-top 8px
        padding-left 8px
        padding-bottom 8px
        label
          pointer-events none
          width 20px
          height 16px
          display flex
          align-items center
          padding-left 4px
          padding-right 4px
          input
            margin 0
            margin-top -1px
            width 10px
            height 10px
            background-size contain
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

    .connector
      position relative
      height 32px
      padding-top 9px !important
      z-index 2
      &.invisible
        height 32px
        width 36px
        padding 0
        position absolute
        left 0
        top 0
        background transparent
        pointer-events none
        button
          width 0
          height 0
          min-width 0
          padding 0
          border none
          border-color var(--primary-border)
      .connector-glow
        position absolute
        width 32px
        height 32px
        top 0px
        left -1px
        border-radius 100px
        pointer-events none

    .connector,
    .url
      padding 8px
      align-self right
      cursor cell
      button
        z-index 1
    .checkbox-wrap
      &:hover
        label
          box-shadow 3px 3px 0 var(--heavy-shadow)
          background-color var(--secondary-hover-background)
          input
            background-color var(--secondary-hover-background)
        label.active
          box-shadow var(--active-inset-shadow)
          background-color var(--secondary-active-background)
          input
            background-color var(--secondary-active-background)
      &:active
        label
          box-shadow none
          color var(--primary)
          background-color var(--secondary-active-background)
        input
          background-color var(--secondary-active-background)
    .connected-colors
      position absolute
      display flex
      height 12px
      width 12px
      top 10px
      left 9px
      overflow hidden
      border-radius 100px
      .color
        width 100%
    .connector-button
      background-color transparent
      border-radius 100px
      width 14px
      height 14px
      padding 0
      &:hover,
      &:active
        background-color transparent
    .inline-button-wrap
      &:hover,
      &:active
        .connector-button
          background-color transparent
    .connector-button
      border 1px solid var(--primary-border)
    .connector-icon
      position absolute
      left -1px
      top -1px
      width 9.5px

    .lock-icon
      position absolute
      left 5.5px
      top 2px
      height 10px
    .arrow-icon
      position absolute
      left 5px
      top 3.5px
    .url
      cursor pointer
      padding-right 0
      button
        cursor pointer
        span
          top -3px
          position relative

    .url-wrap
      max-height 28px
      padding-right 8px
      &.connector-is-visible
        padding-right 0

    .is-light-in-dark-theme
      border-color var(--primary-on-light-background)
      .icon,
      .connector-icon
        filter none
    .is-dark-in-light-theme
      border-color var(--primary-on-dark-background)
      .icon,
      .connector-icon
        filter invert()

    .uploading-container
      position absolute
      top 6px
      left 6px

    &.has-url-preview
      width var(--card-width)

    &.media-card
      width var(--card-width)
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
      width var(--card-width)
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
      animation bounce 1.2s infinite ease-in-out forwards
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
