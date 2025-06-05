import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useCardStore } from '@/stores/useCardStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useApiStore } from '@/stores/useApiStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'
import { useHistoryStore } from '@/stores/useHistoryStore'

import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'
import postMessage from '@/postMessage.js'

import { nanoid } from 'nanoid'
import uniqBy from 'lodash-es/uniqBy'
import last from 'lodash-es/last'
import dayjs from 'dayjs'

export const useGlobalStore = defineStore('global', {
  state: () => ({
    pageHeight: 0,
    pageWidth: 0,
    viewportHeight: 0,
    viewportWidth: 0,
    isOnline: true,
    isReconnectingToBroadcast: false,
    isBeta: false,
    shouldHideConnectionOutline: false,
    changelogIsUpdated: false,
    changelog: [],
    stripeIsLoaded: false,
    shouldHideFooter: false,
    shouldExplicitlyHideFooter: false,
    isTouchDevice: false,
    // cardsCreatedLimit: 100,
    prevCursorPosition: { x: 0, y: 0 },
    currentSpacePath: '/',
    webfontIsLoaded: false,
    userHasScrolled: false,
    shouldPreventNextEnterKey: false,
    shouldPreventNextFocusOnName: false,
    isEmbedMode: false,
    isAddPage: false,
    isPresentationMode: false,
    isCommentMode: false,
    disableViewportOptimizations: false,
    pricingIsVisible: false,
    userSettingsIsVisible: false,
    offlineIsVisible: false,
    spaceUserListIsVisible: false,
    spaceUserListIsSpectators: false,
    isFadingOutDuringTouch: false,
    prevSpaceIdInSession: '',
    prevSpaceIdInSessionPagePosition: {},
    outsideSpaceBackgroundColor: '',
    groupsIsVisible: false,
    dateImageUrl: null,
    currentSpaceIsUnavailableOffline: false,

    // zoom and scroll
    spaceZoomPercent: 100,
    pinchCounterZoomDecimal: 1,
    zoomOrigin: { x: 0, y: 0 },
    isPinchZooming: false,
    isTouchScrolling: false,

    // search
    searchIsVisible: false,
    search: '',
    searchResultsCards: [],
    previousResultItem: {},

    // update password
    updatePasswordApiKey: '',
    passwordResetIsVisible: false,

    // services
    importArenaChannelIsVisible: false,
    isAuthenticatingWithArena: false,

    // current user state
    currentUserIsDrawingConnection: false,
    currentUserIsPainting: false,
    currentUserIsPaintingLocked: false,
    currentUserIsDraggingCard: false,
    currentUserIsHoveringOverConnectionId: '',
    currentUserIsHoveringOverCardId: '',
    currentUserIsHoveringOverBoxId: '',
    currentUserIsHoveringOverCheckboxCardId: '',
    currentUserIsHoveringOverConnectorItemId: '',
    currentUserIsHoveringOverUrlButtonCardId: '',
    currentUserIsPanningReady: false,
    currentUserIsPanning: false,
    currentUserToolbar: 'card', // card, box
    currentUserIsDraggingConnectionIdLabel: '',
    clipboardData: {}, // for kinopio data pasting
    shouldCancelNextMouseUpInteraction: false,
    currentUserIsDrawing: false,

    // drawing
    drawingEraserIsActive: false,
    drawingStrokeColors: [],

    // box-selecting
    currentUserIsBoxSelecting: false,
    currentUserBoxSelectStart: {},
    currentUserBoxSelectMove: {},
    remoteUserBoxSelectStyles: [],
    remotePreviousUserBoxSelectStyles: [],

    // boxes
    focusOnBoxId: '',
    boxDetailsIsVisibleForBoxId: '',
    multipleBoxesSelectedIds: [],
    currentBoxIsNew: false,
    remoteBoxDetailsVisible: [],
    // resizing boxes
    currentUserIsResizingBox: false,
    currentUserIsResizingBoxIds: [],
    remoteUserResizingBoxes: [],
    // dragging boxes
    currentDraggingBoxId: '',
    boxesWereDragged: false,
    currentUserIsDraggingBox: false,
    currentUserIsDraggingBoxIds: [],
    remoteBoxesDragging: [],
    preventDraggedBoxFromShowingDetails: false,

    // cards
    shouldExplicitlyRenderCardIds: {},
    shouldAddCard: false,
    cardDetailsIsVisibleForCardId: '',
    parentCardId: '',
    childCardId: '',
    remoteCardDetailsVisible: [],
    preventCardDetailsOpeningAnimation: true,
    multipleCardsSelectedIds: [],
    iframeIsVisibleForCardId: '',
    focusOnCardId: '',
    // resizing card
    currentUserIsResizingCard: false,
    currentUserIsResizingCardIds: [],
    remoteUserResizingCards: [],
    // tilting card
    currentUserIsTiltingCard: false,
    currentUserIsTiltingCardIds: [],
    remoteUserTiltingCards: [],
    // dragging cards
    currentDraggingCardId: '',
    remoteCardsDragging: [],
    remoteUploadDraggedOverCards: [],
    preventDraggedCardFromShowingDetails: false,
    triggeredTouchCardDragPosition: {},
    cardsWereDragged: false,
    // user details
    userDetailsIsVisible: false,
    userDetailsPosition: {}, // x, y, shouldIgnoreZoom
    userDetailsUser: {},

    // draggingItems
    shouldSnapToGrid: false,

    // multiple selection
    multipleSelectedActionsIsVisible: false,
    preventMultipleSelectedActionsIsVisible: false,
    multipleSelectedActionsPosition: {},
    previousMultipleCardsSelectedIds: [],
    previousMultipleConnectionsSelectedIds: [],
    remoteCardsSelected: [], // [{ cardId, userId }, …]
    remoteConnectionsSelected: [], // [{ connectionId, userId }, …]
    remoteBoxesSelected: [], // [{ boxId, userId }, …]
    multipleConnectionsSelectedIds: [],
    previousMultipleBoxesSelectedIds: [],
    isSelectingX: false,
    isSelectingY: false,
    multipleCardsSelectedIdsToLoad: [],
    multipleConnectionsSelectedIdsToLoad: [],
    multipleBoxesSelectedIdsToLoad: [],
    multipleConnectionTypesSelectedIdsToLoad: [],

    // connections
    currentConnectionStartItemIds: [],
    currentConnectionSuccess: {},
    currentConnectionCursorStart: {},
    connectionDetailsPosition: {}, // x, y, pageX, pageY
    connectionDetailsIsVisibleForConnectionId: '',
    currentConnectionColor: '',
    remoteConnectionDetailsVisible: [],
    remoteCurrentConnections: [],
    currentItemConnections: [],
    // connection labels
    remoteUserDraggingConnectionLabel: [],

    // tags
    tagDetailsIsVisible: false,
    tagDetailsIsVisibleFromTagList: false,
    tagDetailsPosition: {}, // x, y
    tagDetailsPositionShouldUpdate: false,
    currentSelectedTag: {},
    remoteTags: [],
    remoteTagsIsFetched: false,
    tags: [],

    // other items (links)
    otherCardDetailsIsVisible: false,
    otherItemDetailsPosition: {}, // x, y
    currentSelectedOtherItem: {},

    // pinned dialogs
    spaceDetailsIsPinned: false,
    sidebarIsPinned: false,
    minimapIsPinned: false,
    searchIsPinned: false,
    userSettingsIsPinned: false,

    // loading
    isLoadingSpace: false,
    isJoiningSpace: false, // broadcast
    isLoadingOtherItems: false,
    spaceUrlToLoad: '',
    groupToJoinOnLoad: null, // { groupId, collaboratorKey }
    spaceReadOnlyKey: {}, //  { spaceId, key }
    spaceCollaboratorKeys: [],
    remotePendingUploads: [],
    isLoadingFavorites: false,
    loadSpaceFocusOnCardId: '',
    loadNewSpace: false,
    urlPreviewLoadingForCardIds: [],
    loadInboxSpace: false,
    shouldResetDimensionsOnLoad: false,
    shouldShowExploreOnLoad: false,
    isLoadingGroups: false,

    // notifications
    notifications: [],
    notifySpaceNotFound: false,
    notifyConnectionError: false,
    notifyConnectionErrorName: '',
    notifyServerCouldNotSave: false,
    notifySpaceIsRemoved: false,
    notifyCurrentSpaceIsNowRemoved: false,
    notifySignUpToEditSpace: false,
    notifySignUpToJoinGroup: false,
    notifyCardsCreatedIsNearLimit: false,
    notifyCardsCreatedIsOverLimit: false,
    notifyMoveOrCopyToSpace: false,
    notifyMoveOrCopyToSpaceDetails: {},
    hasNotifiedPressAndHoldToDrag: false,
    notifySpaceIsHidden: false,
    notifyThanksForDonating: false,
    notifyThanksForUpgrading: false,
    shouldNotifyIsJoiningGroup: false,
    notifyIsJoiningGroup: false,
    notifyIsDuplicatingSpace: false,
    notifyBoxSnappingIsReady: false,

    // notifications with position
    notificationsWithPosition: [],

    // filters
    filteredConnectionTypeIds: [],
    filteredBoxIds: [],
    filteredFrameIds: [],
    filteredTagNames: [],
    spaceListFilterInfo: {},

    // session data
    otherUsers: [], // { id, name color }
    otherItems: { spaces: [], cards: [] },
    sendingQueue: [],
    currentUserIsInvitedButCannotEditCurrentSpace: false,

    // codeblocks
    codeLanguagePickerIsVisible: false,
    codeLanguagePickerPosition: {}, // x, y
    codeLanguagePickerCardId: '',

    // snap guide lines
    snapGuideLinesOrigin: {}
  }),
  getters: {
    // getIsSpacePage
    isSpacePage () {
      if (window.location.pathname === '/add') { return }
      return !this.isAddPage
    },
    // getSpaceZoomDecimal
    spaceZoomDecimal () {
      return this.spaceZoomPercent / 100
    },
    // getSpaceCounterZoomDecimal
    spaceCounterZoomDecimal () {
      return 1 / this.spaceZoomDecimal
    },
    // getIsTouchDevice
    // this.isTouchDevice is in state
    isTouchDevice () {
      return this.isTouchDevice || utils.isMobile() || consts.isSecureAppContext
    },
    // getZoomTransform
    zoomTransform () {
      const zoom = this.spaceZoomDecimal
      const origin = this.zoomOrigin
      const transform = `translate(${origin.x}px, ${origin.y}px) scale(${zoom}) translate(-${origin.x}px, -${origin.y}px)`
      return transform
    },
    // getWindowScrollWithSpaceOffset
    windowScrollWithSpaceOffset () {
      const scroll = { x: window.scrollX, y: window.scrollY }
      return utils.updatePositionWithSpaceOffset(scroll)
    },
    // getIsInteractingWithItem
    isInteractingWithItem () {
      return this.currentUserIsDraggingCard || this.currentUserIsDrawingConnection || this.currentUserIsResizingCard || this.currentUserIsResizingBox || this.currentUserIsDraggingBox
    },
    // getIsMultipleItemsSelected
    isMultipleItemsSelected () {
      return this.multipleCardsSelectedIds.length || this.multipleConnectionsSelectedIds.length || this.multipleBoxesSelectedIds.length
    },
    // getSpaceShouldHaveBorderRadius
    spaceShouldHaveBorderRadius () {
      const isNativeApp = consts.isSecureAppContext
      const isZoomedOut = this.spaceZoomPercent !== 100
      if (isNativeApp || isZoomedOut) { return true }
    },
    // getDateImageUrl
    dateImageUrl () {
      if (this.dateImageUrl) {
        return this.dateImageUrl
      } else {
        const date = dayjs().format('MM-DD-YYYY') // 11-19-2024
        return `${consts.cdnHost}/date/${date}.jpg` // https://cdn.kinopio.club/date/11-19-24.jpg
      }
    },
    // getAllTags
    allTags () {
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const allTags = this.tags
      const userTags = userStore.tags
      const spaceTags = spaceStore.tags
      const tags = spaceTags.concat(userTags).concat(allTags)
      // tags = uniqBy(tags, 'name') // removed for perf reasons
      return tags || []
    }
  },

  actions: {
    // getShouldScrollAtEdges
    shouldScrollAtEdges (event) {
      if (window.visualViewport.scale > 1) { return }
      let isPainting
      if (event.touches) {
        isPainting = this.currentUserIsPaintingLocked
      } else {
        isPainting = this.currentUserIsPainting
      }
      const isDrawingConnection = this.currentUserIsDrawingConnection
      const isDraggingCard = this.currentUserIsDraggingCard
      const isDraggingBox = this.currentUserIsDraggingBox
      return isPainting || isDrawingConnection || isDraggingCard || isDraggingBox
    },
    // getOtherUserById
    otherUserById (userId) {
      return this.otherUsers[userId]
    },
    // getOtherSpaceById
    otherSpaceById (spaceId) {
      const otherSpaces = this.otherItems.spaces.filter(Boolean)
      const space = otherSpaces.find(otherSpace => otherSpace.id === spaceId)
      return space
    },
    // getOtherCardById
    otherCardById (cardId) {
      const otherCards = this.otherItems.cards.filter(Boolean)
      const card = otherCards.find(otherCard => otherCard.id === cardId)
      return card
    },
    // getNewTag
    newTag ({ name, defaultColor, cardId, spaceId }) {
      let color
      const allTags = this.tags
      const existingTag = allTags.find(tag => tag.name === name)
      if (existingTag) {
        color = existingTag.color
      }
      return {
        name,
        id: nanoid(),
        color: color || defaultColor,
        cardId,
        spaceId
      }
    },
    // getCurrentInteractingItem
    currentInteractingItem () {
      const boxStore = useBoxStore()
      const cardStore = useCardStore()
      let boxId = this.currentDraggingBoxId
      if (this.currentUserIsResizingBox) {
        boxId = this.currentUserIsResizingBoxIds[0]
      }
      let cardId = this.currentDraggingCardId
      if (this.currentUserIsResizingCard) {
        cardId = this.currentUserIsResizingCardIds[0]
      }
      if (boxId) {
        return boxStore.getBox(boxId)
      }
      if (cardId) {
        return cardStore.getCard(cardId)
      }
    }

  }
})
