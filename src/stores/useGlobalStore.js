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
    currentUserToolbar: 'card', // card, box, drawing
    currentUserIsDraggingConnectionIdLabel: '',
    clipboardData: {}, // for kinopio data pasting
    shouldCancelNextMouseUpInteraction: false,
    currentUserIsDrawing: false,

    // drawing
    drawingEraserIsActive: false,
    drawingStrokeColors: [],
    drawingImageUrl: '',

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
    // loading broadcast
    isConnectingToBroadcast: false,
    isJoiningSpace: false,

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
    getGlobalAllState () {
      return { ...this.$state }
    },
    getIsSpacePage () {
      if (window.location.pathname === '/add') { return }
      return !this.isAddPage
    },
    getSpaceZoomDecimal () {
      return this.spaceZoomPercent / 100
    },
    getSpaceCounterZoomDecimal () {
      return 1 / this.getSpaceZoomDecimal
    },
    getIsTouchDevice () {
      return this.isTouchDevice || utils.isMobile() || consts.isSecureAppContext
    },
    getZoomTransform () {
      const zoom = this.getSpaceZoomDecimal
      const origin = this.zoomOrigin
      const transform = `translate(${origin.x}px, ${origin.y}px) scale(${zoom}) translate(-${origin.x}px, -${origin.y}px)`
      return transform
    },
    getWindowScrollWithSpaceOffset () {
      const scroll = { x: window.scrollX, y: window.scrollY }
      return utils.updatePositionWithSpaceOffset(scroll)
    },
    getIsInteractingWithItem () {
      return this.currentUserIsDraggingCard || this.currentUserIsDrawingConnection || this.currentUserIsResizingCard || this.currentUserIsResizingBox || this.currentUserIsDraggingBox
    },
    getIsMultipleItemsSelected () {
      return this.multipleCardsSelectedIds.length || this.multipleConnectionsSelectedIds.length || this.multipleBoxesSelectedIds.length
    },
    getSpaceShouldHaveBorderRadius () {
      const isNativeApp = consts.isSecureAppContext
      const isZoomedOut = this.spaceZoomPercent !== 100
      if (isNativeApp || isZoomedOut) { return true }
    },
    getDateImageUrl () {
      if (this.dateImageUrl) {
        return this.dateImageUrl
      } else {
        const date = dayjs().format('MM-DD-YYYY') // 11-19-2024
        return `${consts.cdnHost}/date/${date}.jpg` // https://cdn.kinopio.club/date/11-19-24.jpg
      }
    },
    getAllTags () {
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const allTags = this.tags
      const userTags = userStore.tags
      const spaceTags = spaceStore.tags
      const tags = spaceTags.concat(userTags).concat(allTags)
      // tags = uniqBy(tags, 'name') // removed for perf reasons
      return tags || []
    },
    getToolbarIsDrawing () {
      return this.currentUserToolbar === 'drawing'
    },
    getToolbarIsBox () {
      return this.currentUserToolbar === 'box'
    }
  },

  actions: {
    getShouldScrollAtEdges (event) {
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
    getOtherUserById (userId) {
      return this.otherUsers[userId]
    },
    getOtherSpaceById (spaceId) {
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
    getCurrentInteractingItem () {
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
    },

    // subscribe triggers

    triggerSpaceDetailsVisible () {},
    triggerSpaceDetailsInfoIsVisible () {},
    triggerFocusResultsFilter () {},
    triggerFocusSpaceDetailsName () {},
    triggerSpaceDetailsUpdateLocalSpaces () {},
    triggerSignUpOrInIsVisible () {},
    triggerArenaAuthenticationError () {},
    triggerKeyboardShortcutsIsVisible () {},
    triggerReadOnlyJiggle () {},
    triggerSelectTemplateCategory () {},
    triggerUpdatePaintSelectCanvasPositionOffset () {},
    triggerPaintFramePosition (event) {},
    triggerAddRemotePaintingCircle () {},
    triggerUpdateRemoteUserCursor () {},
    triggerUpdateRemoteDropGuideLine () {},
    triggerUpdateStopRemoteUserDropGuideLine (updates) {},
    triggerUpdateHeaderAndFooterPosition () {},
    triggerHideTouchInterface () {},
    triggerUpgradeUserIsVisible () {},
    triggerDonateIsVisible () {},
    triggerUploadComplete (updates) {},
    triggerPauseAllAudio () {},
    triggerScrollCardIntoView (cardId) {},
    triggerPickerNavigationKey (key) {},
    triggerPickerSelect () {},
    triggerUpdateNotifications () {},
    triggerSpaceZoomReset () {},
    triggerSpaceZoomOutMax (options) {},
    triggerUnloadPage () {},
    triggerShowNextSearchCard () {},
    triggerShowPreviousSearchCard () {},
    triggerMoreFiltersIsNotVisible () {},
    triggerConnectionDetailsIsVisible (connectionId) {},
    triggerUpdateWindowHistory (options) {},
    triggerAddCard (options) {},
    triggerAddChildCard (options) {},
    triggerTemplatesIsVisible () {},
    triggerImportIsVisible () {},
    triggerSplitCard (cardId) {},
    triggerUpdateUrlPreview (cardId) {},
    triggerUpdateUrlPreviewComplete (cardId) {},
    triggerRemovedIsVisible () {},
    triggerMinimapIsVisible () {},
    triggerClearAllSpaceFilters () {},
    triggerScrollUserDetailsIntoView () {},
    triggerUpdateLockedItemButtonPositionCardId (cardId) {},
    triggerCenterZoomOrigin () {},
    triggerRemoveCardFromCardList (card) {},
    triggerUpdateTheme () {},
    triggerUserIsLoaded () {},
    triggerSearchScopeIsRemote () {},
    triggerSearchScopeIsLocal () {},
    triggerCardIdUpdatePastedName (options) {},
    triggerExploreIsVisible () {},
    triggerDrawConnectionFrame (event) {},
    triggerCancelLocking () {},
    triggerUpdateOtherCard (cardId) {},
    triggerUpdateCardDetailsCardName (options) {},
    triggerCloseChildDialogs () {},
    triggerOfflineIsVisible () {},
    triggerAppsAndExtensionsIsVisible () {},
    triggerUpdateWindowTitle () {},
    triggerCheckIfShouldNotifySpaceOutOfSync () {},
    triggerNotifyOffscreenCardCreated (card) {},
    triggerNotifyCouldNotSave () {},
    triggerSonarPing (event) {},
    triggerUpdatePathWhileDragging (connections) {},
    triggerUpdateCardDimensionsAndPaths (cardId) {},
    triggerCloseGroupDetailsDialog () {},
    triggerPanningStart () {},
    triggerClearUserNotifications () {},
    triggerAddBox (event) {},
    triggerUpdateDrawingBackground () {},
    // select all below
    triggerSelectAllItemsBelowCursor (position) {},
    triggerSelectAllItemsAboveCursor (position) {},
    // select all right
    triggerSelectAllItemsLeftOfCursor (position) {},
    triggerSelectAllItemsRightOfCursor (position) {},
    // Used by extensions only
    triggerSelectedCardsContainInBox () {},
    triggerSelectedItemsAlignLeft () {},
    // drawing
    triggerDrawingReset () {},
    triggerDrawingInitialize () {},
    triggerStartDrawing (event) {},
    triggerDraw (event) {},
    triggerDrawingUndo () {},
    triggerDrawingRedo () {},
    triggerAddRemoteDrawingStroke (updates) {},
    triggerRemoveRemoteDrawingStroke (updates) {},
    triggerEndDrawing () {},

    resetPageSizes () {
      this.updateViewportSizes()
      this.pageWidth = this.viewportWidth
      this.pageHeight = this.viewportHeight
    },
    updatePageSizesFromRect (itemsRect) {
      if (!itemsRect) { return }
      const pageWidth = Math.max(this.viewportWidth, itemsRect.width, this.pageWidth)
      const pageHeight = Math.max(this.viewportHeight, itemsRect.height, this.pageHeight)
      this.pageWidth = Math.round(pageWidth)
      this.pageHeight = Math.round(pageHeight)
    },
    async updatePageSizes () {
      const cardStore = useCardStore()
      const boxStore = useBoxStore()
      const spaceStore = useSpaceStore()
      const cards = cardStore.getAllCards
      const boxes = boxStore.getAllBoxes
      const items = cards.concat(boxes)
      items.push({
        x: 0, y: 0, width: 500, height: 500 // minimum page size
      })
      const itemsRect = utils.pageSizeFromItems(items)
      const drawingRect = await utils.imageSize(spaceStore.drawingImage)
      const rect = utils.mergeRectSizes(itemsRect, drawingRect)
      this.updatePageSizesFromRect(rect)
    },
    updateViewportSizes () {
      const viewport = utils.visualViewport()
      this.viewportWidth = Math.round(viewport.width)
      this.viewportHeight = Math.round(viewport.height)
    },

    scrollElementIntoView ({ element, behavior, positionIsCenter }) {
      behavior = behavior || 'smooth'
      if (!element) { return }
      const sidebarIsVisible = document.querySelector('dialog#sidebar')
      const smallCardCharacterLimit = 300
      const isViewportNarrow = this.viewportWidth < (smallCardCharacterLimit * 2)
      let horizontal = 'nearest'
      let vertical = 'nearest'
      if (sidebarIsVisible || positionIsCenter) {
        horizontal = 'center'
        vertical = 'center'
      }
      if (sidebarIsVisible && isViewportNarrow) {
        horizontal = 'start'
      }
      // increase page size by amount to scroll beyond page size
      const rect = element.getBoundingClientRect()
      if (window.scrollX + rect.x + rect.width > this.pageWidth) {
        this.pageWidth += rect.width
      }
      if (window.scrollY + rect.y + rect.height > this.pageHeight) {
        this.pageHeight += rect.height
      }
      // scroll page
      nextTick(() => {
        element.scrollIntoView({
          behavior,
          block: vertical,
          inline: horizontal
        })
      })
    },

    // isOnline (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.isOnline = value
    // },
    // isConnectingToBroadcast (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.isConnectingToBroadcast = value
    // },
    // isBeta (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.isBeta = value
    // },
    // loadNewSpace (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.loadNewSpace = value
    // },
    // loadInboxSpace (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.loadInboxSpace = value
    // },
    // shouldResetDimensionsOnLoad (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.shouldResetDimensionsOnLoad = value
    // },
    // shouldShowExploreOnLoad (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.shouldShowExploreOnLoad = value
    // },
    // isLoadingGroups (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.isLoadingGroups = value
    // },
    addUrlPreviewLoadingForCardIds (cardId) {
      utils.typeCheck({ value: cardId, type: 'string' })
      this.urlPreviewLoadingForCardIds.push(cardId)
    },
    removeUrlPreviewLoadingForCardIds (cardId) {
      utils.typeCheck({ value: cardId, type: 'string' })
      let cardIds = utils.clone(this.urlPreviewLoadingForCardIds)
      cardIds = cardIds.filter(id => cardId !== id) || []
      this.urlPreviewLoadingForCardIds = cardIds
    },
    // shouldHideConnectionOutline (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.shouldHideConnectionOutline = value
    // },
    // changelogIsUpdated (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.changelogIsUpdated = value
    // },
    // changelog (value) {
    //   utils.typeCheck({ value, type: 'array' })
    //   this.changelog = value
    // },
    // stripeIsLoaded (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.stripeIsLoaded = value
    // },
    // shouldHideFooter (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.shouldHideFooter = value
    // },
    // shouldExplicitlyHideFooter (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.shouldExplicitlyHideFooter = value
    // },
    // isTouchDevice (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.isTouchDevice = value
    // },
    // prevCursorPosition (cursor) {
    //   this.prevCursorPosition = cursor
    // },
    // spaceZoomPercent (value) {
    //   utils.typeCheck({ value, type: 'number' })
    //   this.spaceZoomPercent = value
    // },
    // pinchCounterZoomDecimal (value) {
    //   utils.typeCheck({ value, type: 'number' })
    //   this.pinchCounterZoomDecimal = value
    // },
    // zoomOrigin (value) {
    //   this.zoomOrigin = value
    // },
    // isPinchZooming (value) {
    //   this.isPinchZooming = value
    // },
    // isTouchScrolling (value) {
    //   this.isTouchScrolling = value
    // },
    // currentSpacePath (value) {
    //   utils.typeCheck({ value, type: 'string' })
    //   this.currentSpacePath = value
    // },
    // webfontIsLoaded (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.webfontIsLoaded = value
    // },
    // userHasScrolled (value) {
    //     utils.typeCheck({ value, type: 'boolean' })
    //     this.userHasScrolled = value
    //   },
    // shouldPreventNextEnterKey (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.shouldPreventNextEnterKey = value
    // },
    // shouldPreventNextFocusOnName (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.shouldPreventNextFocusOnName = value
    // },
    // isEmbedMode (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.isEmbedMode = value
    // },
    // isAddPage (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.isAddPage = value
    // },
    // isPresentationMode (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.isPresentationMode = value
    // },
    // isCommentMode (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.isCommentMode = value
    // },
    // pricingIsVisible (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.pricingIsVisible = value
    // },
    // userSettingsIsVisible (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.userSettingsIsVisible = value
    // },
    // disableViewportOptimizations (value) {
    //   utils.typeCheck({ value, type: 'boolean', allowUndefined: true })
    //   this.disableViewportOptimizations = value
    // },
    // offlineIsVisible (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.offlineIsVisible = value
    // },
    // spaceUserListIsVisible (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.spaceUserListIsVisible = value
    // },
    // spaceUserListIsSpectators (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.spaceUserListIsSpectators = value
    // },
    // isFadingOutDuringTouch (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.isFadingOutDuringTouch = value
    // },
    updatePrevSpaceIdInSession (value) {
      if (value === this.prevSpaceIdInSession) {
        this.prevSpaceIdInSession = ''
      } else {
        this.prevSpaceIdInSession = value
      }
    },
    updatePrevSpaceIdInSessionPagePosition (position) {
      position = {
        x: window.scrollX,
        y: window.scrollY
      }
      const prevSpaceIdInSessionPagePosition = position
    },
    // outsideSpaceBackgroundColor (value) {
    //   utils.typeCheck({ value, type: 'string' })
    //   this.outsideSpaceBackgroundColor = value
    // },
    // groupsIsVisible (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.groupsIsVisible = value
    // },
    // dateImageUrl (value) {
    //   utils.typeCheck({ value, type: 'string' })
    //   this.dateImageUrl = value
    // },
    // currentSpaceIsUnavailableOffline (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.currentSpaceIsUnavailableOffline = value
    // },
    // searchIsVisible (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.searchIsVisible = value
    // },
    // search (value) {
    //   utils.typeCheck({ value, type: 'string' })
    //   this.search = value
    // },
    // searchResultsCards (results) {
    //   utils.typeCheck({ value: results, type: 'array' })
    //   this.searchResultsCards = results
    // },
    // previousResultItem (value) {
    //   utils.typeCheck({ value, type: 'object' })
    //   this.previousResultItem = value
    // },
    clearSearch () {
      if (this.searchIsVisible) { return }
      this.search = ''
      this.searchResultsCards = []
      this.previousResultItem = {}
    },
    // updatePasswordApiKey (apiKey) {
    //   utils.typeCheck({ value: apiKey, type: 'string' })
    //   this.updatePasswordApiKey = apiKey
    // },
    // passwordResetIsVisible (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.passwordResetIsVisible = value
    // },
    // importArenaChannelIsVisible (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.importArenaChannelIsVisible = value
    // },
    // isAuthenticatingWithArena (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.isAuthenticatingWithArena = value
    // },

    // Cards

    updateShouldExplicitlyRenderCardIds (cardIds) {
      utils.typeCheck({ value: cardIds, type: 'array' })
      const object = {}
      cardIds.forEach(cardId => {
        object[cardId] = true
      })
      this.shouldExplicitlyRenderCardIds = object
    },
    clearShouldExplicitlyRenderCardIds () {
      this.shouldExplicitlyRenderCardIds = {}
    },
    // shouldAddCard (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.shouldAddCard = value
    // },
    // currentUserIsHoveringOverCardId (cardId) {
    //   utils.typeCheck({ value: cardId, type: 'string' })
    //   this.currentUserIsHoveringOverCardId = cardId
    // },
    // currentUserIsHoveringOverCheckboxCardId (cardId) {
    //   utils.typeCheck({ value: cardId, type: 'string' })
    //   this.currentUserIsHoveringOverCheckboxCardId = cardId
    // },
    // currentUserIsHoveringOverUrlButtonCardId (cardId) {
    //   utils.typeCheck({ value: cardId, type: 'string' })
    //   this.currentUserIsHoveringOverUrlButtonCardId = cardId
    // },
    updateCardDetailsIsVisibleForCardId (cardId) {
      utils.typeCheck({ value: cardId, type: 'string' })
      this.cardDetailsIsVisibleForCardId = cardId
      if (cardId) {
        postMessage.sendHaptics({ name: 'lightImpact' })
      }
    },
    // parentCardId (cardId) {
    //   utils.typeCheck({ value: cardId, type: 'string' })
    //   this.parentCardId = cardId
    // },
    // childCardId (cardId) {
    //   utils.typeCheck({ value: cardId, type: 'string' })
    //   this.childCardId = cardId
    // },
    updateRemoteCardDetailsVisible (update) {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      let cardDetailsVisible = utils.clone(this.remoteCardDetailsVisible)
      cardDetailsVisible = cardDetailsVisible.filter(card => card.id !== update.cardId) || []
      cardDetailsVisible.push(update)
      this.remoteCardDetailsVisible = cardDetailsVisible
    },
    clearRemoteCardDetailsVisible (update) {
      utils.typeCheck({ value: update, type: 'object' })
      this.remoteCardDetailsVisible = this.remoteCardDetailsVisible.filter(card => card.userId !== update.userId) || []
    },
    // preventCardDetailsOpeningAnimation (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.preventCardDetailsOpeningAnimation = value
    // },
    // iframeIsVisibleForCardId (cardId) {
    //   utils.typeCheck({ value: cardId, type: 'string' })
    //   this.iframeIsVisibleForCardId = cardId
    // },
    // focusOnCardId (cardId) {
    //   utils.typeCheck({ value: cardId, type: 'string' })
    //   this.focusOnCardId = cardId
    // },

    // Connections

    // currentUserIsHoveringOverConnectorItemId (itemId) {
    //   utils.typeCheck({ value: itemId, type: 'string' })
    //   this.currentUserIsHoveringOverConnectorItemId = itemId
    // },
    // currentUserIsHoveringOverConnectionId (connectionId) {
    //   utils.typeCheck({ value: connectionId, type: 'string' })
    //   this.currentUserIsHoveringOverConnectionId = connectionId
    // },
    updateCurrentUserIsDrawingConnection (value) {
      utils.typeCheck({ value, type: 'boolean' })
      this.currentUserIsDrawingConnection = value
      if (value) {
        postMessage.sendHaptics({ name: 'mediumImpact' })
      }
    },
    // currentConnectionSuccess (object) {
    //   utils.typeCheck({ value: object, type: 'object', allowUndefined: true })
    //   this.currentConnectionSuccess = object
    // },
    // currentConnectionCursorStart (object) {
    //   utils.typeCheck({ value: object, type: 'object' })
    //   this.currentConnectionCursorStart = object
    // },
    // currentConnectionStartItemIds (cardIds) {
    //   utils.typeCheck({ value: cardIds, type: 'array' })
    //   this.currentConnectionStartItemIds = cardIds
    // },
    updateRemoteCurrentConnection (updates) {
      utils.typeCheck({ value: updates, type: 'object' })
      const index = this.remoteCurrentConnections.findIndex(remoteConnection => {
        const isUserId = remoteConnection.userId === updates.userId
        const isStartCardId = remoteConnection.startItemId === updates.startItemId
        return isUserId && isStartCardId
      })
      if (index >= 0) {
        const connection = this.remoteCurrentConnections[index]
        const keys = Object.keys(updates)
        keys.forEach(key => {
          connection[key] = updates[key]
        })
        this.remoteCurrentConnections[index] = connection
      } else {
        this.remoteCurrentConnections.push(updates)
      }
    },
    removeRemoteCurrentConnection (updates) {
      this.remoteCurrentConnections = this.remoteCurrentConnections.filter(remoteConnection => remoteConnection.userId !== updates.userId)
    },
    updateCurrentCardConnections (connections) {
      connections = connections || []
      connections = connections.map(connection => connection.id)
      this.currentItemConnections = connections
    },

    // Connection Labels

    updateRemoteUserDraggingConnectionLabel (update) {
      this.remoteUserDraggingConnectionLabel = this.remoteUserDraggingConnectionLabel.filter(remoteUser => remoteUser.userId !== update.userId)
      this.remoteUserDraggingConnectionLabel = this.remoteUserDraggingConnectionLabel.concat(update)
    },
    removeRemoteUserDraggingConnectionLabel (update) {
      this.remoteUserDraggingConnectionLabel = this.remoteUserDraggingConnectionLabel.filter(remoteUser => remoteUser.userId !== update.userId)
    },

    // Painting

    // currentUserIsPainting (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.currentUserIsPainting = value
    // },
    // currentUserIsPaintingLocked (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.currentUserIsPaintingLocked = value
    // },

    // box selecting

    // currentBoxIsNew (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.currentBoxIsNew = value
    // },
    // currentUserIsBoxSelecting (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.currentUserIsBoxSelecting = value
    // },
    // currentUserBoxSelectStart (object) {
    //   utils.typeCheck({ value: object, type: 'object' })
    //   this.currentUserBoxSelectStart = object
    // },
    // currentUserBoxSelectMove (object) {
    //   utils.typeCheck({ value: object, type: 'object' })
    //   this.currentUserBoxSelectMove = object
    // },
    updateRemoteUserBoxSelectStyles (object) {
      utils.typeCheck({ value: object, type: 'object' })
      this.remoteUserBoxSelectStyles = this.remoteUserBoxSelectStyles.filter(styles => styles.currentBoxSelectId !== object.currentBoxSelectId)
      this.remoteUserBoxSelectStyles.push(object)
    },
    updateRemotePreviousBoxSelectStyles (object) {
      utils.typeCheck({ value: object, type: 'object' })
      this.remoteUserBoxSelectStyles = this.remoteUserBoxSelectStyles.filter(styles => styles.currentBoxSelectId !== object.currentBoxSelectId)
      this.remotePreviousUserBoxSelectStyles = this.remotePreviousUserBoxSelectStyles.filter(styles => styles.currentBoxSelectId !== object.currentBoxSelectId)
      this.remotePreviousUserBoxSelectStyles.push(object)
    },
    removeRemotePreviousBoxSelectStyle () {
      this.remotePreviousUserBoxSelectStyles.shift()
    },

    // Resizing Cards

    // currentUserIsResizingCard (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.currentUserIsResizingCard = value
    // },
    // currentUserIsResizingCardIds (cardIds) {
    //   utils.typeCheck({ value: cardIds, type: 'array' })
    //   this.currentUserIsResizingCardIds = cardIds
    // },
    removeRemoteUserResizingCards (update) {
      this.remoteUserResizingCards = this.remoteUserResizingCards.filter(remoteUser => remoteUser.userId !== update.userId)
    },
    updateRemoteUserResizingCards (update) {
      this.remoteUserResizingCards = this.remoteUserResizingCards.filter(remoteUser => remoteUser.userId !== update.userId)
      this.remoteUserResizingCards = this.remoteUserResizingCards.concat(update)
    },

    // Tilting Cards

    // currentUserIsTiltingCard (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.currentUserIsTiltingCard = value
    // },
    // currentUserIsTiltingCardIds (cardIds) {
    //   utils.typeCheck({ value: cardIds, type: 'array' })
    //   this.currentUserIsTiltingCardIds = cardIds
    // },
    removeRemoteUserTiltingCards (update) {
      this.remoteUserTiltingCards = this.remoteUserTiltingCards.filter(remoteUser => remoteUser.userId !== update.userId)
    },
    updateRemoteUserTiltingCards (update) {
      this.remoteUserTiltingCards = this.remoteUserTiltingCards.filter(remoteUser => remoteUser.userId !== update.userId)
      this.remoteUserTiltingCards = this.remoteUserTiltingCards.concat(update)
    },

    // Boxes

    // currentUserIsHoveringOverBoxId (boxId) {
    //   utils.typeCheck({ value: boxId, type: 'string' })
    //   this.currentUserIsHoveringOverBoxId = boxId
    // },
    // focusOnBoxId (boxId) {
    //   utils.typeCheck({ value: boxId, type: 'string' })
    //   this.focusOnBoxId = boxId
    // },
    updateBoxDetailsIsVisibleForBoxId (value) {
      utils.typeCheck({ value, type: 'string' })
      this.boxDetailsIsVisibleForBoxId = value
      if (value) {
        postMessage.sendHaptics({ name: 'lightImpact' })
      }
    },
    // currentUserIsResizingBox (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.currentUserIsResizingBox = value
    // },
    // currentUserIsResizingBoxIds (cardIds) {
    //   utils.typeCheck({ value: cardIds, type: 'array' })
    //   this.currentUserIsResizingBoxIds = cardIds
    // },
    // currentUserIsDraggingBox (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.currentUserIsDraggingBox = value
    // },
    updateRemoteBoxDetailsVisible (update) {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      let boxDetailsVisible = utils.clone(this.remoteBoxDetailsVisible)
      boxDetailsVisible = boxDetailsVisible.filter(box => box.id !== update.boxId) || []
      boxDetailsVisible.push(update)
      this.remoteBoxDetailsVisible = boxDetailsVisible
    },
    clearRemoteBoxDetailsVisible (update) {
      utils.typeCheck({ value: update, type: 'object' })
      this.remoteBoxDetailsVisible = this.remoteBoxDetailsVisible.filter(box => box.userId !== update.userId) || []
    },
    removeRemoteUserResizingBoxes (update) {
      this.remoteUserResizingBoxes = this.remoteUserResizingBoxes.filter(remoteUser => remoteUser.userId !== update.userId)
    },
    updateRemoteUserResizingBoxes (update) {
      this.remoteUserResizingBoxes = this.remoteUserResizingBoxes.filter(remoteUser => remoteUser.userId !== update.userId)
      this.remoteUserResizingBoxes = this.remoteUserResizingBoxes.concat(update)
    },

    // Toolbar Mode

    // updateCurrentUserToolbar (value) {
    //   utils.typeCheck({ value, type: 'string' })
    //   this.currentUserToolbar = value
    //   this.drawingEraserIsActive = false
    // },

    // drawing

    // drawingEraserIsActive (value) {
    //   this.drawingEraserIsActive = value
    // },
    addToDrawingStrokeColors (color) {
      if (this.drawingStrokeColors.includes(color)) { return }
      this.drawingStrokeColors.push(color)
    },

    // Dragging

    // currentUserIsPanningReady (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.currentUserIsPanningReady = value
    // },
    // currentUserIsPanning (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.currentUserIsPanning = value
    // },
    // currentUserIsDraggingConnectionIdLabel (value) {
    //   utils.typeCheck({ value, type: 'string' })
    //   this.currentUserIsDraggingConnectionIdLabel = value
    // },
    // // clipboardData (data) {
    //   utils.typeCheck({ value: data, type: 'object' })
    //   this.clipboardData = data
    // },
    // shouldCancelNextMouseUpInteraction (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.shouldCancelNextMouseUpInteraction = value
    // },
    // currentUserIsDrawing (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.currentUserIsDrawing = value
    // },

    // Dragging Cards

    // currentUserIsDraggingCard (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.currentUserIsDraggingCard = value
    // },
    // preventDraggedCardFromShowingDetails (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.preventDraggedCardFromShowingDetails = value
    // },
    // triggeredTouchCardDragPosition (cursor) {
    //   this.triggeredTouchCardDragPosition = cursor
    // },
    // cardsWereDragged (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.cardsWereDragged = value
    // },
    // currentDraggingCardId (cardId) {
    //   utils.typeCheck({ value: cardId, type: 'string' })
    //   this.currentDraggingCardId = cardId
    // },
    addToRemoteCardsDragging (update) {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      let cards = utils.clone(this.remoteCardsDragging)
      cards = cards.filter(card => card.userId !== update.userId) || []
      cards.push(update)
      this.remoteCardsDragging = cards
    },
    clearRemoteCardsDragging (update) {
      utils.typeCheck({ value: update, type: 'object' })
      this.remoteCardsDragging = this.remoteCardsDragging.filter(card => card.userId !== update.userId)
    },
    addToRemoteUploadDraggedOverCards (update) {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      let cards = utils.clone(this.remoteUploadDraggedOverCards)
      cards = cards.filter(card => card.userId !== update.userId) || []
      cards.push(update)
      this.remoteUploadDraggedOverCards = cards
    },
    clearRemoteUploadDraggedOverCards (update) {
      utils.typeCheck({ value: update, type: 'object' })
      this.remoteUploadDraggedOverCards = this.remoteUploadDraggedOverCards.filter(card => card.userId !== update.userId)
    },

    // Dragging Boxes

    // currentDraggingBoxId (boxId) {
    //   utils.typeCheck({ value: boxId, type: 'string' })
    //   this.currentDraggingBoxId = boxId
    // },
    // boxesWereDragged (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.boxesWereDragged = value
    // },
    addToRemoteBoxesDragging (update) {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      let boxes = utils.clone(this.remoteBoxesDragging)
      boxes = boxes.filter(box => box.userId !== update.userId) || []
      boxes.push(update)
      this.remoteBoxesDragging = boxes
    },
    clearRemoteBoxesDragging (update) {
      utils.typeCheck({ value: update, type: 'object' })
      this.remoteBoxesDragging = this.remoteBoxesDragging.filter(box => box.userId !== update.userId)
    },
    // preventDraggedBoxFromShowingDetails (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.preventDraggedBoxFromShowingDetails = value
    // },

    // Dragging Items

    // shouldSnapToGrid (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.shouldSnapToGrid = value
    // },

    // User Details

    // userDetailsIsVisible (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.userDetailsIsVisible = value
    // },
    // userDetailsPosition (position) {
    //   utils.typeCheck({ value: position, type: 'object' })
    //   this.userDetailsPosition = position
    // },
    // userDetailsUser (user) {
    //   utils.typeCheck({ value: user, type: 'object' })
    //   this.userDetailsUser = user
    // },

    // Tag Details

    // tagDetailsIsVisible (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.tagDetailsIsVisible = value
    // },
    // tagDetailsIsVisibleFromTagList (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.tagDetailsIsVisibleFromTagList = value
    // },
    // tagDetailsPosition (position) {
    //   utils.typeCheck({ value: position, type: 'object' })
    //   this.tagDetailsPosition = position
    // },
    // tagDetailsPositionShouldUpdate (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.tagDetailsPositionShouldUpdate = value
    // },
    // currentSelectedTag (tag) {
    //   utils.typeCheck({ value: tag, type: 'object' })
    //   this.currentSelectedTag = tag
    // },
    // remoteTags (tags) {
    //   utils.typeCheck({ value: tags, type: 'array' })
    //   this.remoteTags = tags
    // },
    // remoteTagsIsFetched (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.remoteTagsIsFetched = value
    // },
    tags (tags) {
      utils.typeCheck({ value: tags, type: 'array' })
      this.tags = tags
    },

    // Link Details

    // otherCardDetailsIsVisible (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.otherCardDetailsIsVisible = value
    // },
    // otherItemDetailsPosition (position) {
    //   utils.typeCheck({ value: position, type: 'object' })
    //   this.otherItemDetailsPosition = position
    // },
    // currentSelectedOtherItem (link) {
    //   utils.typeCheck({ value: link, type: 'object' })
    //   this.currentSelectedOtherItem = link
    // },

    // Pinned Dialogs

    // sidebarIsPinned (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.sidebarIsPinned = value
    // },
    // minimapIsPinned (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.minimapIsPinned = value
    // },
    // spaceDetailsIsPinned (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.spaceDetailsIsPinned = value
    // },
    // searchIsPinned (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.searchIsPinned = value
    // },
    // userSettingsIsPinned (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.userSettingsIsPinned = value
    // },

    // Connection Details

    // connectionDetailsIsVisibleForConnectionId (connectionId) {
    //   utils.typeCheck({ value: connectionId, type: 'string' })
    // },
    // currentConnectionColor (color) {
    //   utils.typeCheck({ value: color, type: 'string' })
    //   this.currentConnectionColor = color
    // },
    // connectionDetailsPosition (position) {
    //   utils.typeCheck({ value: position, type: 'object' })
    //   this.connectionDetailsPosition = position
    // },
    addToRemoteConnectionDetailsVisible (update) {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      let connections = utils.clone(this.remoteConnectionDetailsVisible)
      connections = connections.filter(connection => connection.userId !== update.userId) || []
      connections.push(update)
      this.remoteConnectionDetailsVisible = connections
    },
    clearRemoteConnectionDetailsVisible (update) {
      utils.typeCheck({ value: update, type: 'object' })
      this.remoteConnectionDetailsVisible = this.remoteConnectionDetailsVisible.filter(connection => connection.userId !== update.userId)
    },

    // Multiple Selection

    updateMultipleSelectedActionsIsVisible (value) {
      this.multipleSelectedActionsIsVisible = value
      if (value) {
        postMessage.sendHaptics({ name: 'lightImpact' })
      }
    },
    // preventMultipleSelectedActionsIsVisible (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.preventMultipleSelectedActionsIsVisible = value
    // },
    // multipleSelectedActionsPosition (position) {
    //   utils.typeCheck({ value: position, type: 'object' })
    //   this.multipleSelectedActionsPosition = position
    // },
    // clearMultipleSelected () {
    // },
    clearDraggingItems () {
      this.currentDraggingCardId = ''
      this.currentDraggingBoxId = ''
    },
    multipleSelectedItemsToLoad (items) {
      utils.typeCheck({ value: items, type: 'object' })
      console.info('multipleSelectedItemsToLoad', items)
      this.multipleCardsSelectedIdsToLoad = items.cards.map(card => card.id)
      this.multipleConnectionsSelectedIdsToLoad = items.connections.map(connection => connection.id)
      this.multipleBoxesSelectedIdsToLoad = items.boxes.map(box => box.id)
      this.multipleConnectionTypesSelectedIdsToLoad = items.connectionTypes.map(type => type.id)
    },
    restoreMultipleSelectedItemsToLoad () {
      this.multipleCardsSelectedIds = this.multipleCardsSelectedIdsToLoad
      this.multipleConnectionsSelectedIds = this.multipleConnectionsSelectedIdsToLoad
      this.multipleBoxesSelectedIds = this.multipleBoxesSelectedIdsToLoad
      this.multipleCardsSelectedIdsToLoad = []
      this.multipleConnectionsSelectedIdsToLoad = []
      this.multipleConnectionTypesSelectedIdsToLoad = []
      this.multipleBoxesSelectedIdsToLoad = []
    },

    // multiple cards

    // multipleCardsSelectedIds (cardIds) {
    //   utils.typeCheck({ value: cardIds, type: 'array' })
    //   this.multipleCardsSelectedIds = cardIds
    // },
    // addToMultipleCardsSelected (cardId) {
    //   utils.typeCheck({ value: cardId, type: 'string' })
    // },
    // addMultipleToMultipleCardsSelected (cardIds) {
    //   postMessage.sendHaptics({ name: 'selection' })
    //   this.multipleCardsSelectedIds = cardIds
    // },
    // removeFromMultipleCardsSelected (cardId) {
    //   utils.typeCheck({ value: cardId, type: 'string' })
    // },
    addToRemoteCardsSelected (update) {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      const isSelected = this.remoteCardsSelected.find(card => {
        const cardIsSelected = card.cardId === update.cardId
        const selectedByUser = card.userId === update.userId
        return cardIsSelected && selectedByUser
      })
      if (isSelected) { return }
      this.remoteCardsSelected.push(update)
    },
    removeFromRemoteCardsSelected (update) {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      this.remoteCardsSelected = this.remoteCardsSelected.filter(card => {
        const cardIsSelected = card.cardId === update.cardId
        const selectedByUser = card.userId === update.userId
        const cardIsUpdate = cardIsSelected && selectedByUser
        return !cardIsUpdate
      })
    },
    updateRemoteCardsSelected (update) {
      this.remoteCardsSelected = this.remoteCardsSelected.filter(card => card.userId !== update.userId)
      const updates = update.cardIds.map(cardId => {
        return {
          userId: update.userId,
          cardId
        }
      })
      this.remoteCardsSelected = this.remoteCardsSelected.concat(updates)
    },
    // previousMultipleCardsSelectedIds (cardIds) {
    //   utils.typeCheck({ value: cardIds, type: 'array' })
    //   this.previousMultipleCardsSelectedIds = cardIds
    // },

    // muiltiple connections

    // multipleConnectionsSelectedIds (connectionIds) {
    //   utils.typeCheck({ value: connectionIds, type: 'array' })
    //   this.multipleConnectionsSelectedIds = connectionIds
    // },
    updateRemoteConnectionsSelected (update) {
      this.remoteConnectionsSelected = this.remoteConnectionsSelected.filter(connection => connection.userId !== update.userId)
      const updates = update.connectionIds.map(connectionId => {
        return {
          userId: update.userId,
          connectionId
        }
      })
      this.remoteConnectionsSelected = this.remoteConnectionsSelected.concat(updates)
    },
    // addToMultipleConnectionsSelected (connectionId) {
    //   utils.typeCheck({ value: connectionId, type: 'string' })
    // },
    // removeFromMultipleConnectionsSelected (connectionId) {
    //   utils.typeCheck({ value: connectionId, type: 'string' })
    // },
    addToRemoteConnectionsSelected (update) {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      const isSelected = this.remoteConnectionsSelected.find(connection => {
        const connectionIsSelected = connection.connectionId === update.connectionId
        const selectedByUser = connection.userId === update.userId
        return connectionIsSelected && selectedByUser
      })
      if (isSelected) { return }
      this.remoteConnectionsSelected.push(update)
    },
    removeFromRemoteConnectionsSelected (update) {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      this.remoteConnectionsSelected = this.remoteConnectionsSelected.filter(connection => {
        const connectionIsSelected = connection.connectionId === update.connectionId
        const selectedByUser = connection.userId === update.userId
        const connectionIsUpdate = connectionIsSelected && selectedByUser
        return !connectionIsUpdate
      })
    },
    clearRemoteMultipleSelected (update) {
      utils.typeCheck({ value: update, type: 'object' })
      const user = update.user || update.updates.user
      this.remoteCardsSelected = this.remoteCardsSelected.filter(card => card.userId !== user.id)
      this.remoteConnectionsSelected = this.remoteConnectionsSelected.filter(connection => connection.userId !== user.id)
      this.remoteBoxesSelected = this.remoteBoxesSelected.filter(box => box.userId !== user.id)
    },
    previousMultipleConnectionsSelectedIds (connectionIds) {
      utils.typeCheck({ value: connectionIds, type: 'array' })
      this.previousMultipleConnectionsSelectedIds = connectionIds
    },

    // multiple boxes

    // multipleBoxesSelectedIds (boxIds) {
    //   utils.typeCheck({ value: boxIds, type: 'array' })
    //   this.multipleBoxesSelectedIds = boxIds
    // },
    // addToMultipleBoxesSelected (boxId) {
    //   utils.typeCheck({ value: boxId, type: 'string' })
    // },
    // removeFromMultipleBoxesSelected (boxId) {
    //   utils.typeCheck({ value: boxId, type: 'string' })
    // },
    previousMultipleBoxesSelectedIds (boxIds) {
      utils.typeCheck({ value: boxIds, type: 'array' })
      this.previousMultipleBoxesSelectedIds = boxIds
    },
    addToRemoteBoxesSelected (update) {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      const isSelected = this.remoteBoxesSelected.find(box => {
        const boxIsSelected = box.boxId === update.boxId
        const selectedByUser = box.userId === update.userId
        return boxIsSelected && selectedByUser
      })
      if (isSelected) { return }
      this.remoteBoxesSelected.push(update)
    },
    removeFromRemoteBoxesSelected (update) {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      this.remoteBoxesSelected = this.remoteBoxesSelected.filter(box => {
        const boxIsSelected = box.boxId === update.boxId
        const selectedByUser = box.userId === update.userId
        const boxIsUpdate = boxIsSelected && selectedByUser
        return !boxIsUpdate
      })
    },
    updateRemoteBoxesSelected (update) {
      this.remoteBoxesSelected = this.remoteBoxesSelected.filter(box => box.userId !== update.userId)
      const updates = update.boxIds.map(boxId => {
        return {
          userId: update.userId,
          boxId
        }
      })
      this.remoteBoxesSelected = this.remoteBoxesSelected.concat(updates)
    },

    // selecting

    // isSelectingX (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.isSelectingX = value
    // },
    // isSelectingY (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.isSelectingY = value
    // },

    // Loading

    // isLoadingSpace (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.isLoadingSpace = value
    // },
    // isJoiningSpace (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.isJoiningSpace = value
    // },
    // isLoadingOtherItems (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.isLoadingOtherItems = value
    // },
    clearSpaceCollaboratorKeys () {
      this.spaceCollaboratorKeys = []
    },
    addToSpaceCollaboratorKeys (spaceCollaboratorKey) {
      utils.typeCheck({ value: spaceCollaboratorKey, type: 'object' })
      this.spaceCollaboratorKeys.push(spaceCollaboratorKey) // { spaceId, collaboratorKey }
    },
    updateRemotePendingUploads (update) {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      const existingUpload = this.remotePendingUploads.find(item => {
        const card = item.cardId === update.cardId
        const space = item.spaceId === update.spaceId
        return card || space
      })
      if (existingUpload) {
        this.remotePendingUploads = this.remotePendingUploads.map(item => {
          console.info('item', item, item.id, existingUpload.id, item.id === existingUpload.id)
          if (item.id === existingUpload.id) {
            item.percentComplete = update.percentComplete
          }
          return item
        })
      } else {
        this.remotePendingUploads.push(update)
      }
      this.remotePendingUploads = this.remotePendingUploads.filter(item => item.percentComplete !== 100)
    },
    // isLoadingFavorites (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.isLoadingFavorites = value
    // },
    // loadSpaceFocusOnCardId (cardId) {
    //   utils.typeCheck({ value: cardId, type: 'string' })
    //   this.loadSpaceFocusOnCardId = cardId
    // },
    // spaceUrlToLoad (spaceUrl) {
    //   utils.typeCheck({ value: spaceUrl, type: 'string' })
    //   this.spaceUrlToLoad = spaceUrl
    // },
    // spaceReadOnlyKey (value) {
    //   utils.typeCheck({ value, type: 'object' })
    //   this.spaceReadOnlyKey = value
    // },
    // groupToJoinOnLoad (value) {
    //   utils.typeCheck({ value, type: 'object' })
    //   this.groupToJoinOnLoad = value
    // },

    // Notifications

    addNotification (notification) {
      this.notifications = this.notifications.filter(item => item.message !== notification.message)
      notification.id = nanoid()
      this.notifications.push(notification)
    },
    removeNotificationByMessage (message) {
      this.notifications = this.notifications.filter(item => item.message !== message)
    },
    removePreviousNotification () {
      const removableNotifications = this.notifications.filter(notification => notification.isPersistentItem === false)
      const prevNotification = last(removableNotifications)
      if (!prevNotification) { return }
      this.notifications = this.notifications.filter(notification => notification.id !== prevNotification.id)
    },
    removeNotificationById (id) {
      this.notifications = this.notifications.filter(notification => notification.id !== id)
    },
    clearAllNotifications () {
      this.notifyConnectionError = false
      this.notifyServerCouldNotSave = false
      this.notifySignUpToEditSpace = false
      this.notifySignUpToJoinGroup = false
      this.notifyCardsCreatedIsNearLimit = false
      this.notifyCardsCreatedIsOverLimit = false
      this.notifyMoveOrCopyToSpace = false
      this.notificationsWithPosition = []
    },
    clearAllInteractingWithAndSelected () {
      this.currentUserIsDraggingCard = false
      this.currentUserIsDrawingConnection = false
      this.currentUserIsResizingCard = false
      this.currentUserIsResizingBox = false
      this.currentUserIsDraggingBox = false
      this.multipleCardsSelectedIds = []
      this.multipleConnectionsSelectedIds = []
      this.multipleBoxesSelectedIds = []
    },
    updateNotifySpaceNotFound (value) {
      utils.typeCheck({ value, type: 'boolean' })
      this.notifySpaceNotFound = value
      if (value) {
        postMessage.sendHaptics({ name: 'error' })
      }
    },
    updateNotifyConnectionError (value) {
      utils.typeCheck({ value, type: 'boolean' })
      this.notifyConnectionError = value
      if (value) {
        postMessage.sendHaptics({ name: 'error' })
      }
    },
    updateNotifyConnectionErrorName (value) {
      utils.typeCheck({ value, type: 'string' })
      this.notifyConnectionErrorName = value
      if (value) {
        postMessage.sendHaptics({ name: 'error' })
      }
    },
    updateNotifyServerCouldNotSave (value) {
      utils.typeCheck({ value, type: 'boolean' })
      this.notifyServerCouldNotSave = value
      if (value) {
        postMessage.sendHaptics({ name: 'error' })
      }
    },
    // notifySpaceIsRemoved (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.notifySpaceIsRemoved = value
    // },
    // notifyCurrentSpaceIsNowRemoved (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.notifyCurrentSpaceIsNowRemoved = value
    // },
    // notifySignUpToEditSpace (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.notifySignUpToEditSpace = value
    // },
    // notifySignUpToJoinGroup (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.notifySignUpToJoinGroup = value
    // },
    // notifyCardsCreatedIsNearLimit (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.notifyCardsCreatedIsNearLimit = value
    // },
    updateNotifyCardsCreatedIsOverLimit (value) {
      utils.typeCheck({ value, type: 'boolean' })
      this.notifyCardsCreatedIsOverLimit = value
      if (value === true) {
        this.notifyCardsCreatedIsNearLimit = false
      }
    },
    // notifyMoveOrCopyToSpace (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.notifyMoveOrCopyToSpace = value
    // },
    // notifyMoveOrCopyToSpaceDetails (value) {
    //   utils.typeCheck({ value, type: 'object' })
    //   this.notifyMoveOrCopyToSpaceDetails = value
    // },
    // hasNotifiedPressAndHoldToDrag (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.hasNotifiedPressAndHoldToDrag = value
    // },
    // notifySpaceIsHidden (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.notifySpaceIsHidden = value
    // },
    // notifyThanksForDonating (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.notifyThanksForDonating = value
    // },
    // notifyThanksForUpgrading (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.notifyThanksForUpgrading = value
    // },
    // shouldNotifyIsJoiningGroup (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.shouldNotifyIsJoiningGroup = value
    // },
    updateNotifyIsJoiningGroup (value) {
      utils.typeCheck({ value, type: 'boolean' })
      this.notifyIsJoiningGroup = value
      if (value) {
        this.shouldNotifyIsJoiningGroup = false
      }
    },
    // notifyIsDuplicatingSpace (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.notifyIsDuplicatingSpace = value
    // },
    // notifyBoxSnappingIsReady (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.notifyBoxSnappingIsReady = value
    // },

    // Notifications with Position

    addNotificationWithPosition (notification) {
      if (!notification.layer) {
        console.error('🚒 addNotificationWithPosition missing param layer')
        return
      }
      notification.id = nanoid()
      this.notificationsWithPosition.push(notification)
    },
    removeNotificationWithPosition () {
      this.notificationsWithPosition.shift()
    },
    clearNotificationsWithPosition () {
      this.notificationsWithPosition = []
    },

    // Filters

    clearSpaceFilters () {
      this.filteredConnectionTypeIds = []
      this.filteredFrameIds = []
      this.filteredTagNames = []
      this.filteredBoxIds = []
    },
    addToFilteredConnectionTypeId (id) {
      utils.typeCheck({ value: id, type: 'string' })
      this.filteredConnectionTypeIds.push(id)
    },
    removeFromFilteredConnectionTypeId (id) {
      utils.typeCheck({ value: id, type: 'string' })
      this.filteredConnectionTypeIds = this.filteredConnectionTypeIds.filter(typeId => typeId !== id)
    },
    addToFilteredFrameIds (id) {
      utils.typeCheck({ value: id, type: 'number' })
      this.filteredFrameIds.push(id)
    },
    removeFromFilteredFrameIds (id) {
      utils.typeCheck({ value: id, type: 'number' })
      this.filteredFrameIds = this.filteredFrameIds.filter(frameId => frameId !== id)
    },
    addToFilteredTagNames (name) {
      utils.typeCheck({ value: name, type: 'string' })
      this.filteredTagNames.push(name)
    },
    removeFromFilteredTagNames (name) {
      utils.typeCheck({ value: name, type: 'string' })
      this.filteredTagNames = this.filteredTagNames.filter(tagName => tagName !== name)
    },
    // spaceListFilterInfo (value) {
    //   utils.typeCheck({ value, type: 'object' })
    //   this.spaceListFilterInfo = value
    // },
    addToFilteredBoxId (id) {
      utils.typeCheck({ value: id, type: 'string' })
      this.filteredBoxIds.push(id)
    },
    removeFromFilteredBoxId (id) {
      utils.typeCheck({ value: id, type: 'string' })
      this.filteredBoxIds = this.filteredBoxIds.filter(typeId => typeId !== id)
    },

    // Session Data

    updateOtherUsers (updatedUser) {
      if (!updatedUser) { return }
      utils.typeCheck({ value: updatedUser, type: 'object' })
      this.otherUsers[updatedUser.id] = updatedUser
    },
    updateOtherItems ({ cards, spaces }) {
      utils.typeCheck({ value: cards, type: 'array' })
      utils.typeCheck({ value: spaces, type: 'array' })
      const otherItems = utils.clone(this.otherItems)
      if (cards.length) {
        otherItems.cards = otherItems.cards.concat(cards)
        otherItems.cards = uniqBy(otherItems.cards, 'id')
      }
      if (spaces.length) {
        otherItems.spaces = otherItems.spaces.concat(spaces)
        otherItems.spaces = uniqBy(otherItems.spaces, 'id')
      }
      this.otherItems = otherItems
    },
    updateCardNameInOtherItems ({ id, name }) {
      const cards = this.otherItems.cards
      const index = cards.findIndex(card => card.id === id)
      const card = cards[index]
      if (card) {
        card.name = name
      }
    },
    // currentUserIsInvitedButCannotEditCurrentSpace (value) {
    //   this.currentUserIsInvitedButCannotEditCurrentSpace = value
    // },

    // Sync Session Data

    // sendingQueue (value) {
    //   utils.typeCheck({ value, type: 'array' })
    //   this.sendingQueue = value
    //   // cache.saveSendingQueue(value)
    // },
    clearSendingQueue () {
      this.sendingQueue = []
      // cache.clearSendingQueue()
    },

    // Code Blocks

    // codeLanguagePickerIsVisible (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   this.codeLanguagePickerIsVisible = value
    // },
    // codeLanguagePickerPosition (position) {
    //   utils.typeCheck({ value: position, type: 'object' })
    //   this.codeLanguagePickerPosition = position
    // },
    // codeLanguagePickerCardId (cardId) {
    //   utils.typeCheck({ value: cardId, type: 'string' })
    //   this.codeLanguagePickerCardId = cardId
    // },

    // Snap Guide Lines

    // snapGuideLinesOrigin (position) {
    //   utils.typeCheck({ value: position, type: 'object' })
    //   this.snapGuideLinesOrigin = position
    // }

    async updateTags () {
      const tags = await cache.allTags()
      this.tags = tags
    },
    // async moveFailedSendingQueueOperationBackIntoQueue (operation) {
    //   // save to queue
    //   let queue = await cache.queue()
    //   queue.unshift(operation)
    //   cache.saveQueue(queue)
    //   // remove from sending queue
    //   let sendingQueue = this.sendingQueue
    //   sendingQueue = sendingQueue.filter(queueItem => queueItem.body.operationId !== operation.operationId)
    //   context.commit('sendingQueue', sendingQueue)
    // },
    // updatePrevSpaceIdInSession (id) {
    //   utils.typeCheck({ value: id, type: 'string' })
    //   const position = {
    //     x: window.scrollX,
    //     y: window.scrollY
    //   }
    //   this.prevSpaceIdInSession = id
    //   this.prevSpaceIdInSessionPagePosition = position
    // },
    updateIsOnline (isOnline) {
      utils.typeCheck({ value: isOnline, type: 'boolean' })
      const prevIsOnline = this.isOnline
      const reconnected = isOnline && !prevIsOnline
      const disconnected = !isOnline && prevIsOnline
      if (reconnected) {
        this.addNotification({ icon: 'offline', message: 'Reconnected to server', type: 'success' })
        this.isLoadingSpace = false
        this.triggerCheckIfShouldNotifySpaceOutOfSync()
      } else if (disconnected) {
        // this.addNotification({ icon: 'offline', message: 'Offline mode', type: 'info' })
      }
      this.isOnline = isOnline
    },
    async updateCurrentSpaceIsUnavailableOffline (spaceId) {
      const spaceStore = useSpaceStore()
      const isOffline = !this.isOnline
      const isNotCached = await spaceStore.getSpaceIsNotCached(spaceId)
      const isRemote = spaceStore.getSpaceIsRemote
      const value = isOffline && isNotCached && isRemote
      this.currentSpaceIsUnavailableOffline = value
    },
    updateSpaceAndCardUrlToLoad (path) {
      const matches = utils.spaceAndCardIdFromPath(path)
      if (!matches) { return }
      if (matches.cardId) {
        this.updateFocusOnCardId(matches.cardId)
      }
      this.spaceUrlToLoad = matches.spaceUrl
    },
    updateFocusOnCardId (cardId) {
      this.focusOnCardId = cardId
      if (cardId) {
        this.triggerScrollCardIntoView(cardId)
      }
    },
    updateFocusOnBoxId (boxId) {
      this.focusOnBoxId = boxId
      if (boxId) {
        const element = utils.boxElementFromId(boxId)
        this.scrollElementIntoView({ element, positionIsCenter: true })
      }
    },
    checkIfItemShouldIncreasePageSize (item) {
      if (!item) { return }
      item = utils.clone(item)
      item.width = item.width || item.resizeWidth
      item.height = item.height || item.resizeHeight
      const zoom = this.getSpaceZoomDecimal
      const thresholdHeight = (this.viewportHeight * zoom) / 2
      const thresholdWidth = (this.viewportWidth * zoom) / 2
      const pageWidth = this.pageWidth
      const pageHeight = this.pageHeight
      const shouldIncreasePageWidth = (item.x + item.width + thresholdWidth) > pageWidth
      const shouldIncreasePageHeight = (item.y + item.height + thresholdHeight) > pageHeight
      if (shouldIncreasePageWidth) {
        const width = pageWidth + thresholdWidth
        this.pageWidth = width
      }
      if (shouldIncreasePageHeight) {
        const height = pageHeight + thresholdHeight
        this.pageHeight = height
      }
    },
    clearAllFilters () {
      const userStore = useUserStore()
      this.clearSpaceFilters()
      userStore.clearUserFilters()
    },
    closeAllDialogs (origin = 'closeAllDialogs') {
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const broadcastStore = useBroadcastStore()
      const space = spaceStore.getSpaceAllState
      let user = userStore.getUserAllState
      user = utils.userMeta(user, space)
      broadcastStore.update({ updates: user, name: 'updateUserPresence' })
      broadcastStore.update({ updates: { userId: user.id }, action: 'clearRemoteCardDetailsVisible' })
      broadcastStore.update({ updates: { userId: user.id }, action: 'clearRemoteConnectionDetailsVisible' })
      broadcastStore.update({ updates: { userId: user.id }, action: 'clearRemoteBoxDetailsVisible' })
      this.passwordResetIsVisible = false
      this.updateFocusOnCardId('')
      this.updateFocusOnBoxId('')
      const dialogs = document.querySelectorAll('dialog')
      const dialogIsVisible = Boolean(dialogs.length)
      if (!dialogIsVisible) { return }
      if (utils.unpinnedDialogIsVisible()) {
        this.shouldAddCard = false
      }
      if (!this.searchIsPinned) {
        this.searchIsVisible = false
      }
      if (!this.userSettingsIsPinned) {
        this.userSettingsIsVisible = false
      }
      this.multipleSelectedActionsIsVisible = false
      this.cardDetailsIsVisibleForCardId = ''
      this.connectionDetailsIsVisibleForConnectionId = ''
      this.boxDetailsIsVisibleForBoxId = ''
      this.tagDetailsIsVisible = false
      this.tagDetailsIsVisibleFromTagList = false
      this.currentSelectedTag = {}
      this.otherCardDetailsIsVisible = false
      this.currentSelectedOtherItem = {}
      this.cardsWereDragged = false
      this.boxesWereDragged = false
      this.userDetailsIsVisible = false
      this.pricingIsVisible = false
      this.codeLanguagePickerIsVisible = false
      this.offlineIsVisible = false
      this.spaceUserListIsVisible = false
      this.importArenaChannelIsVisible = false
      this.groupsIsVisible = false
      this.shouldSnapToGrid = false
    },
    toggleCardSelected (cardId) {
      const previousMultipleCardsSelectedIds = this.previousMultipleCardsSelectedIds
      const cardIsSelected = previousMultipleCardsSelectedIds.includes(cardId)
      if (cardIsSelected) {
        this.removeFromMultipleCardsSelected(cardId)
      } else {
        this.addToMultipleCardsSelected(cardId)
      }
    },
    addToMultipleCardsSelected (cardId) {
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      utils.typeCheck({ value: cardId, type: 'string' })
      if (this.multipleCardsSelectedIds.includes(cardId)) { return }
      postMessage.sendHaptics({ name: 'selection' })
      this.multipleCardsSelectedIds.push(cardId)
      const updates = {
        userId: userStore.id,
        cardId
      }
      broadcastStore.update({ updates, action: 'addToRemoteCardsSelected' })
    },
    removeFromMultipleCardsSelected (cardId) {
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      utils.typeCheck({ value: cardId, type: 'string' })
      if (!this.multipleCardsSelectedIds.includes(cardId)) { return }
      this.multipleCardsSelectedIds = this.multipleCardsSelectedIds.filter(id => {
        return id !== cardId
      })
      const updates = {
        userId: userStore.id,
        cardId
      }
      broadcastStore.update({ updates, action: 'removeFromRemoteCardsSelected' })
    },
    addMultipleToMultipleCardsSelected (cardIds) {
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      utils.typeCheck({ value: cardIds, type: 'array' })
      if (!cardIds.length) { return }
      const set1 = new Set(cardIds)
      const set2 = new Set(this.multipleCardsSelectedIds)
      // Combine sets
      const combinedSet = new Set([...set1, ...set2])
      // Convert back to array
      cardIds = [...combinedSet]
      postMessage.sendHaptics({ name: 'selection' })
      this.multipleCardsSelectedIds = cardIds
      const updates = {
        userId: userStore.id,
        cardIds
      }
      broadcastStore.update({ updates, action: 'updateRemoteCardsSelected' })
    },
    updateMultipleCardsSelectedIds (cardIds) {
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      utils.typeCheck({ value: cardIds, type: 'array' })
      this.multipleCardsSelectedIds = cardIds
      const updates = {
        userId: userStore.id,
        cardIds
      }
      broadcastStore.update({ updates, action: 'updateRemoteCardsSelected' })
    },
    updateMultipleBoxesSelectedIds (boxIds) {
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      utils.typeCheck({ value: boxIds, type: 'array' })
      this.multipleBoxesSelectedIds = boxIds
      const updates = {
        userId: userStore.id,
        boxIds
      }
      broadcastStore.update({ updates, action: 'updateRemoteBoxesSelected' })
    },

    clearMultipleSelected () {
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const broadcastStore = useBroadcastStore()
      if (this.multipleCardsSelectedIds.length || this.multipleConnectionsSelectedIds.length || this.multipleBoxesSelectedIds.length) {
        this.multipleCardsSelectedIds = []
        this.multipleConnectionsSelectedIds = []
        this.multipleBoxesSelectedIds = []
      }
      const space = spaceStore.getSpaceAllState
      const user = userStore.getUserAllState
      broadcastStore.update({ user: utils.userMeta(user, space), action: 'clearRemoteMultipleSelected' })
    },
    toggleMultipleConnectionsSelected (connectionId) {
      utils.typeCheck({ value: connectionId, type: 'string' })
      const previousMultipleConnectionsSelectedIds = this.previousMultipleConnectionsSelectedIds
      const connectionIsSelected = previousMultipleConnectionsSelectedIds.includes(connectionId)
      if (connectionIsSelected) {
        this.removeFromMultipleConnectionsSelected(connectionId)
      } else {
        this.addToMultipleConnectionsSelected(connectionId)
      }
    },
    addToMultipleConnectionsSelected (connectionId) {
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      utils.typeCheck({ value: connectionId, type: 'string' })
      if (this.multipleConnectionsSelectedIds.includes(connectionId)) { return }
      postMessage.sendHaptics({ name: 'selection' })
      this.multipleConnectionsSelectedIds.push(connectionId)
      const updates = {
        userId: userStore.id,
        connectionId
      }
      broadcastStore.update({ updates, action: 'addToRemoteConnectionsSelected' })
    },
    removeFromMultipleConnectionsSelected (connectionId) {
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      utils.typeCheck({ value: connectionId, type: 'string' })
      if (!this.multipleConnectionsSelectedIds.includes(connectionId)) { return }
      this.multipleConnectionsSelectedIds = this.multipleConnectionsSelectedIds.filter(id => {
        return id !== connectionId
      })
      const updates = {
        userId: userStore.id,
        connectionId
      }
      broadcastStore.update({ updates, action: 'removeFromRemoteConnectionsSelected' })
    },
    updateMultipleConnectionsSelectedIds (connectionIds) {
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      utils.typeCheck({ value: connectionIds, type: 'array' })
      this.multipleConnectionsSelectedIds = connectionIds
      const updates = {
        userId: userStore.id,
        connectionIds
      }
      broadcastStore.update({ updates, action: 'updateRemoteConnectionsSelected' })
    },
    addMultipleToMultipleConnectionsSelected (connectionIds) {
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      utils.typeCheck({ value: connectionIds, type: 'array' })
      if (!connectionIds.length) { return }
      const set1 = new Set(connectionIds)
      const set2 = new Set(this.multipleConnectionsSelectedIds)
      // Combine sets
      const combinedSet = new Set([...set1, ...set2])
      // Convert back to array
      connectionIds = [...combinedSet]
      this.multipleConnectionsSelectedIds = connectionIds
      const updates = {
        userId: userStore.id,
        connectionIds
      }
      broadcastStore.update({ updates, action: 'updateRemoteConnectionsSelected' })
    },
    updateConnectionDetailsIsVisibleForConnectionId (connectionId) {
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      this.connectionDetailsIsVisibleForConnectionId = connectionId
      if (connectionId) {
        postMessage.sendHaptics({ name: 'lightImpact' })
      }
      const updates = {
        userId: userStore.id,
        connectionId
      }
      broadcastStore.update({ updates, action: 'addToRemoteConnectionDetailsVisible' })
    },
    addToMultipleBoxesSelected (boxId) {
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      utils.typeCheck({ value: boxId, type: 'string' })
      if (this.multipleBoxesSelectedIds.includes(boxId)) { return }
      postMessage.sendHaptics({ name: 'selection' })
      this.multipleBoxesSelectedIds.push(boxId)
      const updates = {
        userId: userStore.id,
        boxId
      }
      broadcastStore.update({ updates, action: 'addToRemoteBoxesSelected' })
    },
    addMultipleToMultipleBoxesSelected (boxIds) {
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      utils.typeCheck({ value: boxIds, type: 'array' })
      if (!boxIds.length) { return }
      const set1 = new Set(boxIds)
      const set2 = new Set(this.multipleBoxesSelectedIds)
      // Combine sets
      const combinedSet = new Set([...set1, ...set2])
      // Convert back to array
      boxIds = [...combinedSet]
      this.multipleBoxesSelectedIds = boxIds
      const updates = {
        userId: userStore.id,
        boxIds
      }
      broadcastStore.update({ updates, action: 'updateRemoteBoxesSelected' })
    },
    removeFromMultipleBoxesSelected (boxId) {
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      utils.typeCheck({ value: boxId, type: 'string' })
      if (!this.multipleBoxesSelectedIds.includes(boxId)) { return }
      this.multipleBoxesSelectedIds = this.multipleBoxesSelectedIds.filter(id => {
        return id !== boxId
      })
      const updates = {
        userId: userStore.id,
        boxId
      }
      broadcastStore.update({ updates, action: 'removeFromRemoteBoxesSelected' })
    },
    normalizeTriggerSonarPing (event) {
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      const ping = utils.cursorPositionInSpace(event)
      ping.color = userStore.color
      this.triggerSonarPing(ping)
      broadcastStore.update({ updates: ping, action: 'triggerSonarPing' })
    },
    updateCurrentUserIsPanning (value) {
      const prevValue = this.currentUserIsPanning
      if (!prevValue && value) {
        this.triggerPanningStart()
      }
      this.currentUserIsPanning = value
    },

    // current space

    async updateCurrentUserIsInvitedButCannotEditCurrentSpace (space) {
      const userStore = useUserStore()
      space = space || this.currentSpace
      const currentUserIsSignedIn = userStore.getUserIsSignedIn
      const invitedSpaces = await cache.invitedSpaces()
      const isInvitedToSpace = Boolean(invitedSpaces.find(invitedSpace => invitedSpace.id === space.id))
      const isReadOnlyInvitedToSpace = userStore.getUserIsReadOnlyInvitedToSpace(space)
      const inviteRequiresSignIn = !currentUserIsSignedIn && isInvitedToSpace
      const value = isReadOnlyInvitedToSpace || inviteRequiresSignIn
      this.currentUserIsInvitedButCannotEditCurrentSpace = value
    },

    // Pinned Dialogs

    // sidebarIsPinned (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   context.commit('sidebarIsPinned', value)
    // },
    // minimapIsPinned (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   context.commit('minimapIsPinned', value)
    // },
    // spaceDetailsIsPinned (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   context.commit('spaceDetailsIsPinned', value)
    // },
    // searchIsPinned (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   context.commit('searchIsPinned', value)
    // },
    // userSettingsIsPinned (value) {
    //   utils.typeCheck({ value, type: 'boolean' })
    //   context.commit('userSettingsIsPinned', value)
    // },

    // scrolling and zoom

    updateZoomOrigin (origin) {
      utils.typeCheck({ value: origin, type: 'object' })
      const prevOrigin = this.zoomOrigin
      const zoomOriginIsZero = !utils.objectHasKeys(prevOrigin) || (prevOrigin.x === 0 && prevOrigin.y === 0)
      if (zoomOriginIsZero) {
        this.zoomOrigin = origin
      } else {
        origin = utils.pointBetweenTwoPoints(prevOrigin, origin)
        this.zoomOrigin = origin
      }
    },
    zoomSpace ({ shouldZoomIn, shouldZoomOut, speed }) {
      let percent
      const currentPercent = this.spaceZoomPercent
      if (shouldZoomIn) {
        percent = currentPercent + speed
      } else if (shouldZoomOut) {
        percent = currentPercent - speed
      } else {
        return
      }
      percent = Math.max(percent, consts.spaceZoom.min)
      percent = Math.min(percent, consts.spaceZoom.max)
      this.spaceZoomPercent = percent
    },

    // toolbar mode

    updateCurrentUserToolbar (value) {
      const userStore = useUserStore()
      const canOnlyComment = userStore.getUserIsCommentOnly
      if (canOnlyComment) { return }
      this.currentUserToolbar = value
      this.drawingEraserIsActive = false
    },
    toggleCurrentUserToolbar (value) {
      const userStore = useUserStore()
      const canOnlyComment = userStore.getUserIsCommentOnly
      const prevValue = this.currentUserToolbar
      if (canOnlyComment) { return }
      if (value === prevValue) {
        this.currentUserToolbar = 'card'
      } else {
        this.currentUserToolbar = value
      }
      this.drawingEraserIsActive = false
    },
    toggleDrawingEraserIsActive () {
      const value = !this.drawingEraserIsActive
      this.drawingEraserIsActive = value
    }
  }
})
