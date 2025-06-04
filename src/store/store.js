import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useCardStore } from '@/stores/useCardStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'

import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'
import postMessage from '@/postMessage.js'
// store modules
// import broadcast from '@/store/broadcast.js'
import history from '@/store/history.js'
// import upload from '@/store/upload.js'
// import userNotifications from '@/store/userNotifications.js'
// import groups from '@/store/groups.js'
import themes from '@/store/themes.js'
// import analytics from '@/store/analytics.js'
// import api from '@/store/api.js'
// temp, converted to pinia
// import currentSpace from '@/store/currentSpace.js'
// import currentUser from '@/store/currentUser.js'
// import currentCards from '@/store/currentCards.js'
// import currentConnections from '@/store/currentConnections.js'
// import currentBoxes from '@/store/currentBoxes.js'
// store plugins
// import websocket from '@/store/plugins/websocket.js'

import { createStore } from 'vuex'
import { nextTick } from 'vue'
import { nanoid } from 'nanoid'
import uniqBy from 'lodash-es/uniqBy'
import last from 'lodash-es/last'
import dayjs from 'dayjs'

const store = createStore({
  strict: consts.isDevelopment(),
  state: {
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
  },
  mutations: {
    resetPageSizes: (state) => {
      state.pageWidth = 0
      state.pageHeight = 0
    },
    updatePageSizes: (state, itemsRect) => {
      if (!itemsRect) { return }
      const pageWidth = Math.max(state.viewportWidth, itemsRect.width, state.pageWidth)
      const pageHeight = Math.max(state.viewportHeight, itemsRect.height, state.pageHeight)
      state.pageWidth = Math.round(pageWidth)
      state.pageHeight = Math.round(pageHeight)
    },
    updateViewportSizes: (state, viewport) => {
      state.viewportWidth = Math.round(viewport.width)
      state.viewportHeight = Math.round(viewport.height)
    },
    pageHeight: (state, height) => {
      utils.typeCheck({ value: height, type: 'number' })
      state.pageHeight = height
    },
    pageWidth: (state, width) => {
      utils.typeCheck({ value: width, type: 'number' })
      state.pageWidth = width
    },
    scrollElementIntoView (state, { element, behavior, positionIsCenter }) {
      behavior = behavior || 'smooth'
      if (!element) { return }
      const sidebarIsVisible = document.querySelector('dialog#sidebar')
      const smallCardCharacterLimit = 300
      const isViewportNarrow = state.viewportWidth < (smallCardCharacterLimit * 2)
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
      if (window.scrollX + rect.x + rect.width > state.pageWidth) {
        state.pageWidth += rect.width
      }
      if (window.scrollY + rect.y + rect.height > state.pageHeight) {
        state.pageHeight += rect.height
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

    closeAllDialogs: (state) => {
      const dialogs = document.querySelectorAll('dialog')
      const dialogIsVisible = Boolean(dialogs.length)
      if (!dialogIsVisible) { return }
      if (utils.unpinnedDialogIsVisible()) {
        state.shouldAddCard = false
      }
      if (!state.searchIsPinned) {
        state.searchIsVisible = false
      }
      if (!state.userSettingsIsPinned) {
        state.userSettingsIsVisible = false
      }
      state.multipleSelectedActionsIsVisible = false
      state.cardDetailsIsVisibleForCardId = ''
      state.connectionDetailsIsVisibleForConnectionId = ''
      state.boxDetailsIsVisibleForBoxId = ''
      state.tagDetailsIsVisible = false
      state.tagDetailsIsVisibleFromTagList = false
      state.currentSelectedTag = {}
      state.otherCardDetailsIsVisible = false
      state.currentSelectedOtherItem = {}
      state.cardsWereDragged = false
      state.boxesWereDragged = false
      state.userDetailsIsVisible = false
      state.pricingIsVisible = false
      state.codeLanguagePickerIsVisible = false
      state.offlineIsVisible = false
      state.spaceUserListIsVisible = false
      state.importArenaChannelIsVisible = false
      state.groupsIsVisible = false
      state.shouldSnapToGrid = false
    },
    isOnline: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.isOnline = value
    },
    isReconnectingToBroadcast: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.isReconnectingToBroadcast = value
    },
    isBeta: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.isBeta = value
    },
    loadNewSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.loadNewSpace = value
    },
    loadInboxSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.loadInboxSpace = value
    },
    shouldResetDimensionsOnLoad: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.shouldResetDimensionsOnLoad = value
    },
    shouldShowExploreOnLoad: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.shouldShowExploreOnLoad = value
    },
    isLoadingGroups: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.isLoadingGroups = value
    },
    addUrlPreviewLoadingForCardIds: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string' })
      state.urlPreviewLoadingForCardIds.push(cardId)
    },
    removeUrlPreviewLoadingForCardIds: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string' })
      let cardIds = utils.clone(state.urlPreviewLoadingForCardIds)
      cardIds = cardIds.filter(id => cardId !== id) || []
      state.urlPreviewLoadingForCardIds = cardIds
    },
    shouldHideConnectionOutline: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.shouldHideConnectionOutline = value
    },
    changelogIsUpdated: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.changelogIsUpdated = value
    },
    changelog: (state, value) => {
      utils.typeCheck({ value, type: 'array' })
      state.changelog = value
    },
    stripeIsLoaded: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.stripeIsLoaded = value
    },
    shouldHideFooter: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.shouldHideFooter = value
    },
    shouldExplicitlyHideFooter: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.shouldExplicitlyHideFooter = value
    },
    isTouchDevice: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.isTouchDevice = value
    },
    prevCursorPosition: (state, cursor) => {
      state.prevCursorPosition = cursor
    },
    spaceZoomPercent: (state, value) => {
      utils.typeCheck({ value, type: 'number' })
      state.spaceZoomPercent = value
    },
    pinchCounterZoomDecimal: (state, value) => {
      utils.typeCheck({ value, type: 'number' })
      state.pinchCounterZoomDecimal = value
    },
    zoomOrigin: (state, value) => {
      state.zoomOrigin = value
    },
    isPinchZooming: (state, value) => {
      state.isPinchZooming = value
    },
    isTouchScrolling: (state, value) => {
      state.isTouchScrolling = value
    },
    currentSpacePath: (state, value) => {
      utils.typeCheck({ value, type: 'string' })
      state.currentSpacePath = value
    },
    webfontIsLoaded: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.webfontIsLoaded = value
    },
    userHasScrolled: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.userHasScrolled = value
    },
    shouldPreventNextEnterKey: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.shouldPreventNextEnterKey = value
    },
    shouldPreventNextFocusOnName: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.shouldPreventNextFocusOnName = value
    },
    isEmbedMode: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.isEmbedMode = value
    },
    isAddPage: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.isAddPage = value
    },
    isPresentationMode: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.isPresentationMode = value
    },
    isCommentMode: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.isCommentMode = value
    },
    pricingIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.pricingIsVisible = value
    },
    userSettingsIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.userSettingsIsVisible = value
    },
    disableViewportOptimizations: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', allowUndefined: true })
      state.disableViewportOptimizations = value
    },
    offlineIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.offlineIsVisible = value
    },
    spaceUserListIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.spaceUserListIsVisible = value
    },
    spaceUserListIsSpectators: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.spaceUserListIsSpectators = value
    },
    isFadingOutDuringTouch: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.isFadingOutDuringTouch = value
    },
    prevSpaceIdInSession: (state, value) => {
      if (value === state.prevSpaceIdInSession) {
        state.prevSpaceIdInSession = ''
      } else {
        state.prevSpaceIdInSession = value
      }
    },
    prevSpaceIdInSessionPagePosition: (state, value) => {
      utils.typeCheck({ value, type: 'object' })
      state.prevSpaceIdInSessionPagePosition = value
    },
    outsideSpaceBackgroundColor: (state, value) => {
      utils.typeCheck({ value, type: 'string' })
      state.outsideSpaceBackgroundColor = value
    },
    groupsIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.groupsIsVisible = value
    },
    dateImageUrl: (state, value) => {
      utils.typeCheck({ value, type: 'string' })
      state.dateImageUrl = value
    },
    currentSpaceIsUnavailableOffline: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.currentSpaceIsUnavailableOffline = value
    },
    searchIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.searchIsVisible = value
    },
    search: (state, value) => {
      utils.typeCheck({ value, type: 'string' })
      state.search = value
    },
    searchResultsCards: (state, results) => {
      utils.typeCheck({ value: results, type: 'array' })
      state.searchResultsCards = results
    },
    previousResultItem: (state, value) => {
      utils.typeCheck({ value, type: 'object' })
      state.previousResultItem = value
    },
    clearSearch: (state) => {
      if (state.searchIsVisible) { return }
      state.search = ''
      state.searchResultsCards = []
      state.previousResultItem = {}
    },
    updatePasswordApiKey: (state, apiKey) => {
      utils.typeCheck({ value: apiKey, type: 'string' })
      state.updatePasswordApiKey = apiKey
    },
    passwordResetIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.passwordResetIsVisible = value
    },
    importArenaChannelIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.importArenaChannelIsVisible = value
    },
    isAuthenticatingWithArena: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.isAuthenticatingWithArena = value
    },
    triggerSpaceDetailsVisible: () => {},
    triggerSpaceDetailsInfoIsVisible: () => {},
    triggerFocusResultsFilter: () => {},
    triggerFocusSpaceDetailsName: () => {},
    triggerSpaceDetailsUpdateLocalSpaces: () => {},
    triggerSignUpOrInIsVisible: () => {},
    triggerArenaAuthenticationError: () => {},
    triggerKeyboardShortcutsIsVisible: () => {},
    triggerReadOnlyJiggle: () => {},
    triggerSelectTemplateCategory: () => {},
    triggerUpdatePaintSelectCanvasPositionOffset: () => {},
    triggerPaintFramePosition: (state, event) => {},
    triggerAddRemotePaintingCircle: () => {},
    triggerUpdateRemoteUserCursor: () => {},
    triggerUpdateRemoteDropGuideLine: () => {},
    triggerUpdateStopRemoteUserDropGuideLine: () => {},
    triggerUpdateHeaderAndFooterPosition: () => {},
    triggerHideTouchInterface: () => {},
    triggerUpgradeUserIsVisible: () => {},
    triggerDonateIsVisible: () => {},
    triggerUploadComplete: () => {},
    triggerPauseAllAudio: () => {},
    triggerScrollCardIntoView: (state, cardId) => {},
    triggerPickerNavigationKey: (state, key) => {},
    triggerPickerSelect: () => {},
    triggerUpdateNotifications: () => {},
    triggerSpaceZoomReset: () => {},
    triggerSpaceZoomOutMax: (state, options) => {},
    triggerUnloadPage: () => {},
    triggerShowNextSearchCard: () => {},
    triggerShowPreviousSearchCard: () => {},
    triggerMoreFiltersIsNotVisible: () => {},
    triggerConnectionDetailsIsVisible: (state, options) => {},
    triggerUpdateWindowHistory: (state, options) => {},
    triggerAddCard: (state, options) => {},
    triggerAddChildCard: (state, options) => {},
    triggerTemplatesIsVisible: () => {},
    triggerImportIsVisible: () => {},
    triggerSplitCard: (state, cardId) => {},
    triggerUpdateUrlPreview: (state, cardId) => {},
    triggerUpdateUrlPreviewComplete: (state, cardId) => {},
    triggerRemovedIsVisible: () => {},
    triggerMinimapIsVisible: () => {},
    triggerClearAllSpaceFilters: () => {},
    triggerScrollUserDetailsIntoView: () => {},
    triggerUpdateLockedItemButtonPositionCardId: (state, cardId) => {},
    triggerCenterZoomOrigin: () => {},
    triggerRemoveCardFromCardList: (state, card) => {},
    triggerUpdateTheme: () => {},
    triggerUserIsLoaded: () => {},
    triggerSearchScopeIsRemote: () => {},
    triggerSearchScopeIsLocal: () => {},
    triggerCardIdUpdatePastedName: (state, options) => {},
    triggerExploreIsVisible: () => {},
    triggerDrawConnectionFrame: (state, event) => {},
    triggerCancelLocking: () => {},
    triggerUpdateOtherCard: (state, cardId) => {},
    triggerUpdateCardDetailsCardName: (state, options) => {},
    triggerCloseChildDialogs: () => {},
    triggerOfflineIsVisible: () => {},
    triggerAppsAndExtensionsIsVisible: () => {},
    triggerUpdateWindowTitle: () => {},
    triggerRestoreSpaceRemoteComplete: () => {},
    triggerCheckIfShouldNotifySpaceOutOfSync: () => {},
    triggerNotifyOffscreenCardCreated: (state, card) => {},
    triggerSonarPing: (state, event) => {},
    triggerUpdatePathWhileDragging: (state, connections) => {},
    triggerUpdateCardDimensionsAndPaths: (state, cardId) => {},
    triggerUpdateItemCurrentConnections: (state, itemId) => {},
    triggerCloseGroupDetailsDialog: () => {},
    triggerPanningStart: () => {},
    triggerClearUserNotifications: () => {},
    triggerAddBox: (state, event) => {},
    triggerUpdateDrawingBackground: () => {},

    // select all below
    triggerSelectAllItemsBelowCursor: (state, position) => {},
    triggerSelectAllItemsAboveCursor: (state, position) => {},

    // select all right

    triggerSelectAllItemsLeftOfCursor: (state, position) => {},
    triggerSelectAllItemsRightOfCursor: (state, position) => {},

    // Used by extensions only

    triggerSelectedCardsContainInBox: () => {},
    triggerSelectedItemsAlignLeft: () => {},

    // drawing
    triggerStartDrawing: (state, event) => {},
    triggerDraw: (state, event) => {},
    triggerDrawingUndo: () => {},
    triggerDrawingRedo: () => {},
    triggerAddRemoteDrawingStroke: () => {},
    triggerRemoveRemoteDrawingStroke: () => {},
    triggerDrawingRedraw: () => {},
    triggerEndDrawing: () => {},

    // Cards

    shouldExplicitlyRenderCardIds: (state, cardIds) => {
      utils.typeCheck({ value: cardIds, type: 'array' })
      const object = {}
      cardIds.forEach(cardId => {
        object[cardId] = true
      })
      state.shouldExplicitlyRenderCardIds = object
    },
    clearShouldExplicitlyRenderCardIds: (state) => {
      state.shouldExplicitlyRenderCardIds = {}
    },
    shouldAddCard: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.shouldAddCard = value
    },
    currentUserIsHoveringOverCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string' })
      state.currentUserIsHoveringOverCardId = cardId
    },
    currentUserIsHoveringOverCheckboxCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string' })
      state.currentUserIsHoveringOverCheckboxCardId = cardId
    },
    currentUserIsHoveringOverUrlButtonCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string' })
      state.currentUserIsHoveringOverUrlButtonCardId = cardId
    },
    cardDetailsIsVisibleForCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string' })
      state.cardDetailsIsVisibleForCardId = cardId
      if (cardId) {
        postMessage.sendHaptics({ name: 'lightImpact' })
      }
    },
    parentCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string' })
      state.parentCardId = cardId
    },
    childCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string' })
      state.childCardId = cardId
    },
    updateRemoteCardDetailsVisible: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      let cardDetailsVisible = utils.clone(state.remoteCardDetailsVisible)
      cardDetailsVisible = cardDetailsVisible.filter(card => card.id !== update.cardId) || []
      cardDetailsVisible.push(update)
      state.remoteCardDetailsVisible = cardDetailsVisible
    },
    clearRemoteCardDetailsVisible: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      state.remoteCardDetailsVisible = state.remoteCardDetailsVisible.filter(card => card.userId !== update.userId) || []
    },
    preventCardDetailsOpeningAnimation: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.preventCardDetailsOpeningAnimation = value
    },
    iframeIsVisibleForCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string' })
      state.iframeIsVisibleForCardId = cardId
    },
    focusOnCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string' })
      state.focusOnCardId = cardId
    },

    // Connections

    currentUserIsHoveringOverConnectorItemId: (state, itemId) => {
      utils.typeCheck({ value: itemId, type: 'string' })
      state.currentUserIsHoveringOverConnectorItemId = itemId
    },
    currentUserIsHoveringOverConnectionId: (state, connectionId) => {
      utils.typeCheck({ value: connectionId, type: 'string' })
      state.currentUserIsHoveringOverConnectionId = connectionId
    },
    currentUserIsDrawingConnection: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.currentUserIsDrawingConnection = value
      if (value) {
        postMessage.sendHaptics({ name: 'mediumImpact' })
      }
    },
    currentConnectionSuccess: (state, object) => {
      utils.typeCheck({ value: object, type: 'object', allowUndefined: true })
      state.currentConnectionSuccess = object
    },
    currentConnectionCursorStart: (state, object) => {
      utils.typeCheck({ value: object, type: 'object' })
      state.currentConnectionCursorStart = object
    },
    currentConnectionStartItemIds: (state, cardIds) => {
      utils.typeCheck({ value: cardIds, type: 'array' })
      state.currentConnectionStartItemIds = cardIds
    },
    updateRemoteCurrentConnection: (state, updates) => {
      utils.typeCheck({ value: updates, type: 'object' })
      const index = state.remoteCurrentConnections.findIndex(remoteConnection => {
        const isUserId = remoteConnection.userId === updates.userId
        const isStartCardId = remoteConnection.startItemId === updates.startItemId
        return isUserId && isStartCardId
      })
      if (index >= 0) {
        const connection = state.remoteCurrentConnections[index]
        const keys = Object.keys(updates)
        keys.forEach(key => {
          connection[key] = updates[key]
        })
        state.remoteCurrentConnections[index] = connection
      } else {
        state.remoteCurrentConnections.push(updates)
      }
    },
    removeRemoteCurrentConnection: (state, updates) => {
      state.remoteCurrentConnections = state.remoteCurrentConnections.filter(remoteConnection => remoteConnection.userId !== updates.userId)
    },
    updateCurrentCardConnections: (state, connections) => {
      connections = connections || []
      connections = connections.map(connection => connection.id)
      state.currentItemConnections = connections
    },

    // Connection Labels

    updateRemoteUserDraggingConnectionLabel: (state, update) => {
      state.remoteUserDraggingConnectionLabel = state.remoteUserDraggingConnectionLabel.filter(remoteUser => remoteUser.userId !== update.userId)
      state.remoteUserDraggingConnectionLabel = state.remoteUserDraggingConnectionLabel.concat(update)
    },
    removeRemoteUserDraggingConnectionLabel: (state, update) => {
      state.remoteUserDraggingConnectionLabel = state.remoteUserDraggingConnectionLabel.filter(remoteUser => remoteUser.userId !== update.userId)
    },

    // Painting

    currentUserIsPainting: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.currentUserIsPainting = value
    },
    currentUserIsPaintingLocked: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.currentUserIsPaintingLocked = value
    },

    // box selecting

    currentBoxIsNew: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.currentBoxIsNew = value
    },
    currentUserIsBoxSelecting: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.currentUserIsBoxSelecting = value
    },
    currentUserBoxSelectStart: (state, object) => {
      utils.typeCheck({ value: object, type: 'object' })
      state.currentUserBoxSelectStart = object
    },
    currentUserBoxSelectMove: (state, object) => {
      utils.typeCheck({ value: object, type: 'object' })
      state.currentUserBoxSelectMove = object
    },
    updateRemoteUserBoxSelectStyles: (state, object) => {
      utils.typeCheck({ value: object, type: 'object' })
      state.remoteUserBoxSelectStyles = state.remoteUserBoxSelectStyles.filter(styles => styles.currentBoxSelectId !== object.currentBoxSelectId)
      state.remoteUserBoxSelectStyles.push(object)
    },
    updateRemotePreviousBoxSelectStyles: (state, object) => {
      utils.typeCheck({ value: object, type: 'object' })
      state.remoteUserBoxSelectStyles = state.remoteUserBoxSelectStyles.filter(styles => styles.currentBoxSelectId !== object.currentBoxSelectId)
      state.remotePreviousUserBoxSelectStyles = state.remotePreviousUserBoxSelectStyles.filter(styles => styles.currentBoxSelectId !== object.currentBoxSelectId)
      state.remotePreviousUserBoxSelectStyles.push(object)
    },
    removeRemotePreviousBoxSelectStyle: (state) => {
      state.remotePreviousUserBoxSelectStyles.shift()
    },

    // Resizing Cards

    currentUserIsResizingCard: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.currentUserIsResizingCard = value
    },
    currentUserIsResizingCardIds: (state, cardIds) => {
      utils.typeCheck({ value: cardIds, type: 'array' })
      state.currentUserIsResizingCardIds = cardIds
    },
    removeRemoteUserResizingCards: (state, update) => {
      state.remoteUserResizingCards = state.remoteUserResizingCards.filter(remoteUser => remoteUser.userId !== update.userId)
    },
    updateRemoteUserResizingCards: (state, update) => {
      state.remoteUserResizingCards = state.remoteUserResizingCards.filter(remoteUser => remoteUser.userId !== update.userId)
      state.remoteUserResizingCards = state.remoteUserResizingCards.concat(update)
    },

    // Tilting Cards

    currentUserIsTiltingCard: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.currentUserIsTiltingCard = value
    },
    currentUserIsTiltingCardIds: (state, cardIds) => {
      utils.typeCheck({ value: cardIds, type: 'array' })
      state.currentUserIsTiltingCardIds = cardIds
    },
    removeRemoteUserTiltingCards: (state, update) => {
      state.remoteUserTiltingCards = state.remoteUserTiltingCards.filter(remoteUser => remoteUser.userId !== update.userId)
    },
    updateRemoteUserTiltingCards: (state, update) => {
      state.remoteUserTiltingCards = state.remoteUserTiltingCards.filter(remoteUser => remoteUser.userId !== update.userId)
      state.remoteUserTiltingCards = state.remoteUserTiltingCards.concat(update)
    },

    // Boxes

    currentUserIsHoveringOverBoxId: (state, boxId) => {
      utils.typeCheck({ value: boxId, type: 'string' })
      state.currentUserIsHoveringOverBoxId = boxId
    },
    focusOnBoxId: (state, boxId) => {
      utils.typeCheck({ value: boxId, type: 'string' })
      state.focusOnBoxId = boxId
    },
    boxDetailsIsVisibleForBoxId: (state, value) => {
      utils.typeCheck({ value, type: 'string' })
      state.boxDetailsIsVisibleForBoxId = value
      if (value) {
        postMessage.sendHaptics({ name: 'lightImpact' })
      }
    },
    currentUserIsResizingBox: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.currentUserIsResizingBox = value
    },
    currentUserIsResizingBoxIds: (state, cardIds) => {
      utils.typeCheck({ value: cardIds, type: 'array' })
      state.currentUserIsResizingBoxIds = cardIds
    },
    currentUserIsDraggingBox: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.currentUserIsDraggingBox = value
    },
    updateRemoteBoxDetailsVisible: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      let boxDetailsVisible = utils.clone(state.remoteBoxDetailsVisible)
      boxDetailsVisible = boxDetailsVisible.filter(box => box.id !== update.boxId) || []
      boxDetailsVisible.push(update)
      state.remoteBoxDetailsVisible = boxDetailsVisible
    },
    clearRemoteBoxDetailsVisible: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      state.remoteBoxDetailsVisible = state.remoteBoxDetailsVisible.filter(box => box.userId !== update.userId) || []
    },
    removeRemoteUserResizingBoxes: (state, update) => {
      state.remoteUserResizingBoxes = state.remoteUserResizingBoxes.filter(remoteUser => remoteUser.userId !== update.userId)
    },
    updateRemoteUserResizingBoxes: (state, update) => {
      state.remoteUserResizingBoxes = state.remoteUserResizingBoxes.filter(remoteUser => remoteUser.userId !== update.userId)
      state.remoteUserResizingBoxes = state.remoteUserResizingBoxes.concat(update)
    },

    // Toolbar Mode

    currentUserToolbar: (state, value) => {
      utils.typeCheck({ value, type: 'string' })
      state.currentUserToolbar = value
      state.drawingEraserIsActive = false
    },

    // drawing

    drawingEraserIsActive: (state, value) => {
      state.drawingEraserIsActive = value
    },
    addToDrawingStrokeColors: (state, color) => {
      if (state.drawingStrokeColors.includes(color)) { return }
      state.drawingStrokeColors.push(color)
    },

    // Dragging

    currentUserIsPanningReady: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.currentUserIsPanningReady = value
    },
    currentUserIsPanning: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.currentUserIsPanning = value
    },
    currentUserIsDraggingConnectionIdLabel: (state, value) => {
      utils.typeCheck({ value, type: 'string' })
      state.currentUserIsDraggingConnectionIdLabel = value
    },
    clipboardData: (state, data) => {
      utils.typeCheck({ value: data, type: 'object' })
      state.clipboardData = data
    },
    shouldCancelNextMouseUpInteraction: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.shouldCancelNextMouseUpInteraction = value
    },
    currentUserIsDrawing: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.currentUserIsDrawing = value
    },

    // Dragging Cards

    currentUserIsDraggingCard: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.currentUserIsDraggingCard = value
    },
    preventDraggedCardFromShowingDetails: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.preventDraggedCardFromShowingDetails = value
    },
    triggeredTouchCardDragPosition: (state, cursor) => {
      state.triggeredTouchCardDragPosition = cursor
    },
    cardsWereDragged: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.cardsWereDragged = value
    },
    currentDraggingCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string' })
      state.currentDraggingCardId = cardId
    },
    addToRemoteCardsDragging: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      let cards = utils.clone(state.remoteCardsDragging)
      cards = cards.filter(card => card.userId !== update.userId) || []
      cards.push(update)
      state.remoteCardsDragging = cards
    },
    clearRemoteCardsDragging: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      state.remoteCardsDragging = state.remoteCardsDragging.filter(card => card.userId !== update.userId)
    },
    addToRemoteUploadDraggedOverCards: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      let cards = utils.clone(state.remoteUploadDraggedOverCards)
      cards = cards.filter(card => card.userId !== update.userId) || []
      cards.push(update)
      state.remoteUploadDraggedOverCards = cards
    },
    clearRemoteUploadDraggedOverCards: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      state.remoteUploadDraggedOverCards = state.remoteUploadDraggedOverCards.filter(card => card.userId !== update.userId)
    },

    // Dragging Boxes

    currentDraggingBoxId: (state, boxId) => {
      utils.typeCheck({ value: boxId, type: 'string' })
      state.currentDraggingBoxId = boxId
    },
    boxesWereDragged: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.boxesWereDragged = value
    },
    addToRemoteBoxesDragging: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      let boxes = utils.clone(state.remoteBoxesDragging)
      boxes = boxes.filter(box => box.userId !== update.userId) || []
      boxes.push(update)
      state.remoteBoxesDragging = boxes
    },
    clearRemoteBoxesDragging: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      state.remoteBoxesDragging = state.remoteBoxesDragging.filter(box => box.userId !== update.userId)
    },
    preventDraggedBoxFromShowingDetails: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.preventDraggedBoxFromShowingDetails = value
    },

    // Dragging Items

    shouldSnapToGrid: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.shouldSnapToGrid = value
    },

    // User Details

    userDetailsIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.userDetailsIsVisible = value
    },
    userDetailsPosition: (state, position) => {
      utils.typeCheck({ value: position, type: 'object' })
      state.userDetailsPosition = position
    },
    userDetailsUser: (state, user) => {
      utils.typeCheck({ value: user, type: 'object' })
      state.userDetailsUser = user
    },

    // Tag Details

    tagDetailsIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.tagDetailsIsVisible = value
    },
    tagDetailsIsVisibleFromTagList: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.tagDetailsIsVisibleFromTagList = value
    },
    tagDetailsPosition: (state, position) => {
      utils.typeCheck({ value: position, type: 'object' })
      state.tagDetailsPosition = position
    },
    tagDetailsPositionShouldUpdate: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.tagDetailsPositionShouldUpdate = value
    },
    currentSelectedTag: (state, tag) => {
      utils.typeCheck({ value: tag, type: 'object' })
      state.currentSelectedTag = tag
    },
    remoteTags: (state, tags) => {
      utils.typeCheck({ value: tags, type: 'array' })
      state.remoteTags = tags
    },
    remoteTagsIsFetched: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.remoteTagsIsFetched = value
    },
    tags: (state, tags) => {
      utils.typeCheck({ value: tags, type: 'array' })
      state.tags = tags
    },

    // Link Details

    otherCardDetailsIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.otherCardDetailsIsVisible = value
    },
    otherItemDetailsPosition: (state, position) => {
      utils.typeCheck({ value: position, type: 'object' })
      state.otherItemDetailsPosition = position
    },
    currentSelectedOtherItem: (state, link) => {
      utils.typeCheck({ value: link, type: 'object' })
      state.currentSelectedOtherItem = link
    },

    // Pinned Dialogs

    sidebarIsPinned: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.sidebarIsPinned = value
    },
    minimapIsPinned: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.minimapIsPinned = value
    },
    spaceDetailsIsPinned: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.spaceDetailsIsPinned = value
    },
    searchIsPinned: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.searchIsPinned = value
    },
    userSettingsIsPinned: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.userSettingsIsPinned = value
    },

    // Connection Details

    connectionDetailsIsVisibleForConnectionId: (state, connectionId) => {
      utils.typeCheck({ value: connectionId, type: 'string' })
      state.connectionDetailsIsVisibleForConnectionId = connectionId
      if (connectionId) {
        postMessage.sendHaptics({ name: 'lightImpact' })
      }
    },
    currentConnectionColor: (state, color) => {
      utils.typeCheck({ value: color, type: 'string' })
      state.currentConnectionColor = color
    },
    connectionDetailsPosition: (state, position) => {
      utils.typeCheck({ value: position, type: 'object' })
      state.connectionDetailsPosition = position
    },
    addToRemoteConnectionDetailsVisible: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      let connections = utils.clone(state.remoteConnectionDetailsVisible)
      connections = connections.filter(connection => connection.userId !== update.userId) || []
      connections.push(update)
      state.remoteConnectionDetailsVisible = connections
    },
    clearRemoteConnectionDetailsVisible: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      state.remoteConnectionDetailsVisible = state.remoteConnectionDetailsVisible.filter(connection => connection.userId !== update.userId)
    },

    // Multiple Selection

    multipleSelectedActionsIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.multipleSelectedActionsIsVisible = value
      if (value) {
        postMessage.sendHaptics({ name: 'lightImpact' })
      }
    },
    preventMultipleSelectedActionsIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.preventMultipleSelectedActionsIsVisible = value
    },
    multipleSelectedActionsPosition: (state, position) => {
      utils.typeCheck({ value: position, type: 'object' })
      state.multipleSelectedActionsPosition = position
    },
    clearMultipleSelected: (state) => {
      state.multipleCardsSelectedIds = []
      state.multipleConnectionsSelectedIds = []
      state.multipleBoxesSelectedIds = []
    },
    clearDraggingItems: (state) => {
      state.currentDraggingCardId = ''
      state.currentDraggingBoxId = ''
    },
    multipleSelectedItemsToLoad: (state, items) => {
      utils.typeCheck({ value: items, type: 'object' })
      console.info('multipleSelectedItemsToLoad', items)
      state.multipleCardsSelectedIdsToLoad = items.cards.map(card => card.id)
      state.multipleConnectionsSelectedIdsToLoad = items.connections.map(connection => connection.id)
      state.multipleBoxesSelectedIdsToLoad = items.boxes.map(box => box.id)
      state.multipleConnectionTypesSelectedIdsToLoad = items.connectionTypes.map(type => type.id)
    },
    restoreMultipleSelectedItemsToLoad: (state) => {
      state.multipleCardsSelectedIds = state.multipleCardsSelectedIdsToLoad
      state.multipleConnectionsSelectedIds = state.multipleConnectionsSelectedIdsToLoad
      state.multipleBoxesSelectedIds = state.multipleBoxesSelectedIdsToLoad
      state.multipleCardsSelectedIdsToLoad = []
      state.multipleConnectionsSelectedIdsToLoad = []
      state.multipleConnectionTypesSelectedIdsToLoad = []
      state.multipleBoxesSelectedIdsToLoad = []
    },

    // multiple cards

    multipleCardsSelectedIds: (state, cardIds) => {
      utils.typeCheck({ value: cardIds, type: 'array' })
      state.multipleCardsSelectedIds = cardIds
    },
    addToMultipleCardsSelected: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string' })
      postMessage.sendHaptics({ name: 'selection' })
      state.multipleCardsSelectedIds.push(cardId)
    },
    addMultipleToMultipleCardsSelected: (state, cardIds) => {
      postMessage.sendHaptics({ name: 'selection' })
      state.multipleCardsSelectedIds = cardIds
    },
    removeFromMultipleCardsSelected: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string' })
      state.multipleCardsSelectedIds = state.multipleCardsSelectedIds.filter(id => {
        return id !== cardId
      })
    },
    addToRemoteCardsSelected: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      const isSelected = state.remoteCardsSelected.find(card => {
        const cardIsSelected = card.cardId === update.cardId
        const selectedByUser = card.userId === update.userId
        return cardIsSelected && selectedByUser
      })
      if (isSelected) { return }
      state.remoteCardsSelected.push(update)
    },
    removeFromRemoteCardsSelected: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      state.remoteCardsSelected = state.remoteCardsSelected.filter(card => {
        const cardIsSelected = card.cardId === update.cardId
        const selectedByUser = card.userId === update.userId
        const cardIsUpdate = cardIsSelected && selectedByUser
        return !cardIsUpdate
      })
    },
    updateRemoteCardsSelected: (state, update) => {
      state.remoteCardsSelected = state.remoteCardsSelected.filter(card => card.userId !== update.userId)
      const updates = update.cardIds.map(cardId => {
        return {
          userId: update.userId,
          cardId
        }
      })
      state.remoteCardsSelected = state.remoteCardsSelected.concat(updates)
    },
    previousMultipleCardsSelectedIds: (state, cardIds) => {
      utils.typeCheck({ value: cardIds, type: 'array' })
      state.previousMultipleCardsSelectedIds = cardIds
    },

    // muiltiple connections

    multipleConnectionsSelectedIds: (state, connectionIds) => {
      utils.typeCheck({ value: connectionIds, type: 'array' })
      state.multipleConnectionsSelectedIds = connectionIds
    },
    updateRemoteConnectionsSelected: (state, update) => {
      state.remoteConnectionsSelected = state.remoteConnectionsSelected.filter(connection => connection.userId !== update.userId)
      const updates = update.connectionIds.map(connectionId => {
        return {
          userId: update.userId,
          connectionId
        }
      })
      state.remoteConnectionsSelected = state.remoteConnectionsSelected.concat(updates)
    },
    addToMultipleConnectionsSelected: (state, connectionId) => {
      utils.typeCheck({ value: connectionId, type: 'string' })
      postMessage.sendHaptics({ name: 'selection' })
      state.multipleConnectionsSelectedIds.push(connectionId)
    },
    removeFromMultipleConnectionsSelected: (state, connectionId) => {
      utils.typeCheck({ value: connectionId, type: 'string' })
      state.multipleConnectionsSelectedIds = state.multipleConnectionsSelectedIds.filter(id => {
        return id !== connectionId
      })
    },
    addToRemoteConnectionsSelected: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      const isSelected = state.remoteConnectionsSelected.find(connection => {
        const connectionIsSelected = connection.connectionId === update.connectionId
        const selectedByUser = connection.userId === update.userId
        return connectionIsSelected && selectedByUser
      })
      if (isSelected) { return }
      state.remoteConnectionsSelected.push(update)
    },
    removeFromRemoteConnectionsSelected: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      state.remoteConnectionsSelected = state.remoteConnectionsSelected.filter(connection => {
        const connectionIsSelected = connection.connectionId === update.connectionId
        const selectedByUser = connection.userId === update.userId
        const connectionIsUpdate = connectionIsSelected && selectedByUser
        return !connectionIsUpdate
      })
    },
    clearRemoteMultipleSelected: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      const user = update.user || update.updates.user
      state.remoteCardsSelected = state.remoteCardsSelected.filter(card => card.userId !== user.id)
      state.remoteConnectionsSelected = state.remoteConnectionsSelected.filter(connection => connection.userId !== user.id)
      state.remoteBoxesSelected = state.remoteBoxesSelected.filter(box => box.userId !== user.id)
    },
    previousMultipleConnectionsSelectedIds: (state, connectionIds) => {
      utils.typeCheck({ value: connectionIds, type: 'array' })
      state.previousMultipleConnectionsSelectedIds = connectionIds
    },

    // multiple boxes

    multipleBoxesSelectedIds: (state, boxIds) => {
      utils.typeCheck({ value: boxIds, type: 'array' })
      state.multipleBoxesSelectedIds = boxIds
    },
    addToMultipleBoxesSelected: (state, boxId) => {
      utils.typeCheck({ value: boxId, type: 'string' })
      postMessage.sendHaptics({ name: 'selection' })
      state.multipleBoxesSelectedIds.push(boxId)
    },
    removeFromMultipleBoxesSelected: (state, boxId) => {
      utils.typeCheck({ value: boxId, type: 'string' })
      state.multipleBoxesSelectedIds = state.multipleBoxesSelectedIds.filter(id => {
        return id !== boxId
      })
    },
    previousMultipleBoxesSelectedIds: (state, boxIds) => {
      utils.typeCheck({ value: boxIds, type: 'array' })
      state.previousMultipleBoxesSelectedIds = boxIds
    },
    addToRemoteBoxesSelected: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      const isSelected = state.remoteBoxesSelected.find(box => {
        const boxIsSelected = box.boxId === update.boxId
        const selectedByUser = box.userId === update.userId
        return boxIsSelected && selectedByUser
      })
      if (isSelected) { return }
      state.remoteBoxesSelected.push(update)
    },
    removeFromRemoteBoxesSelected: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      state.remoteBoxesSelected = state.remoteBoxesSelected.filter(box => {
        const boxIsSelected = box.boxId === update.boxId
        const selectedByUser = box.userId === update.userId
        const boxIsUpdate = boxIsSelected && selectedByUser
        return !boxIsUpdate
      })
    },
    updateRemoteBoxesSelected: (state, update) => {
      state.remoteBoxesSelected = state.remoteBoxesSelected.filter(box => box.userId !== update.userId)
      const updates = update.boxIds.map(boxId => {
        return {
          userId: update.userId,
          boxId
        }
      })
      state.remoteBoxesSelected = state.remoteBoxesSelected.concat(updates)
    },

    // selecting

    isSelectingX: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.isSelectingX = value
    },
    isSelectingY: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.isSelectingY = value
    },

    // Loading

    isLoadingSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.isLoadingSpace = value
    },
    isJoiningSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.isJoiningSpace = value
    },
    isLoadingOtherItems: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.isLoadingOtherItems = value
    },
    clearSpaceCollaboratorKeys: (state) => {
      state.spaceCollaboratorKeys = []
    },
    addToSpaceCollaboratorKeys: (state, spaceCollaboratorKey) => {
      utils.typeCheck({ value: spaceCollaboratorKey, type: 'object' })
      state.spaceCollaboratorKeys.push(spaceCollaboratorKey) // { spaceId, collaboratorKey }
    },
    updateRemotePendingUploads: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      const existingUpload = state.remotePendingUploads.find(item => {
        const card = item.cardId === update.cardId
        const space = item.spaceId === update.spaceId
        return card || space
      })
      if (existingUpload) {
        state.remotePendingUploads = state.remotePendingUploads.map(item => {
          console.info('item', item, item.id, existingUpload.id, item.id === existingUpload.id)
          if (item.id === existingUpload.id) {
            item.percentComplete = update.percentComplete
          }
          return item
        })
      } else {
        state.remotePendingUploads.push(update)
      }
      state.remotePendingUploads = state.remotePendingUploads.filter(item => item.percentComplete !== 100)
    },
    isLoadingFavorites: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.isLoadingFavorites = value
    },
    loadSpaceFocusOnCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string' })
      state.loadSpaceFocusOnCardId = cardId
    },
    spaceUrlToLoad: (state, spaceUrl) => {
      utils.typeCheck({ value: spaceUrl, type: 'string' })
      state.spaceUrlToLoad = spaceUrl
    },
    spaceReadOnlyKey: (state, value) => {
      utils.typeCheck({ value, type: 'object' })
      state.spaceReadOnlyKey = value
    },
    groupToJoinOnLoad: (state, value) => {
      utils.typeCheck({ value, type: 'object' })
      state.groupToJoinOnLoad = value
    },

    // Notifications

    addNotification: (state, notification) => {
      state.notifications = state.notifications.filter(item => item.message !== notification.message)
      notification.id = nanoid()
      state.notifications.push(notification)
    },
    removeNotificationByMessage: (state, message) => {
      state.notifications = state.notifications.filter(item => item.message !== message)
    },
    removePreviousNotification: (state) => {
      const removableNotifications = state.notifications.filter(notification => notification.isPersistentItem === false)
      const prevNotification = last(removableNotifications)
      if (!prevNotification) { return }
      state.notifications = state.notifications.filter(notification => notification.id !== prevNotification.id)
    },
    removeNotificationById: (state, id) => {
      state.notifications = state.notifications.filter(notification => notification.id !== id)
    },
    clearAllNotifications: (state) => {
      state.notifyConnectionError = false
      state.notifyServerCouldNotSave = false
      state.notifySignUpToEditSpace = false
      state.notifySignUpToJoinGroup = false
      state.notifyCardsCreatedIsNearLimit = false
      state.notifyCardsCreatedIsOverLimit = false
      state.notifyMoveOrCopyToSpace = false
      state.notificationsWithPosition = []
    },
    clearAllInteractingWithAndSelected: (state) => {
      state.currentUserIsDraggingCard = false
      state.currentUserIsDrawingConnection = false
      state.currentUserIsResizingCard = false
      state.currentUserIsResizingBox = false
      state.currentUserIsDraggingBox = false
      state.multipleCardsSelectedIds = []
      state.multipleConnectionsSelectedIds = []
      state.multipleBoxesSelectedIds = []
    },
    notifySpaceNotFound: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.notifySpaceNotFound = value
      if (value) {
        postMessage.sendHaptics({ name: 'error' })
      }
    },
    notifyConnectionError: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.notifyConnectionError = value
      if (value) {
        postMessage.sendHaptics({ name: 'error' })
      }
    },
    notifyConnectionErrorName: (state, value) => {
      utils.typeCheck({ value, type: 'string' })
      state.notifyConnectionErrorName = value
      if (value) {
        postMessage.sendHaptics({ name: 'error' })
      }
    },
    notifyServerCouldNotSave: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.notifyServerCouldNotSave = value
      if (value) {
        postMessage.sendHaptics({ name: 'error' })
      }
    },
    notifySpaceIsRemoved: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.notifySpaceIsRemoved = value
    },
    notifyCurrentSpaceIsNowRemoved: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.notifyCurrentSpaceIsNowRemoved = value
    },
    notifySignUpToEditSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.notifySignUpToEditSpace = value
    },
    notifySignUpToJoinGroup: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.notifySignUpToJoinGroup = value
    },
    notifyCardsCreatedIsNearLimit: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.notifyCardsCreatedIsNearLimit = value
    },
    notifyCardsCreatedIsOverLimit: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.notifyCardsCreatedIsOverLimit = value
      if (value === true) {
        state.notifyCardsCreatedIsNearLimit = false
      }
    },
    notifyMoveOrCopyToSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.notifyMoveOrCopyToSpace = value
    },
    notifyMoveOrCopyToSpaceDetails: (state, value) => {
      utils.typeCheck({ value, type: 'object' })
      state.notifyMoveOrCopyToSpaceDetails = value
    },
    hasNotifiedPressAndHoldToDrag: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.hasNotifiedPressAndHoldToDrag = value
    },
    notifySpaceIsHidden: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.notifySpaceIsHidden = value
    },
    notifyThanksForDonating: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.notifyThanksForDonating = value
    },
    notifyThanksForUpgrading: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.notifyThanksForUpgrading = value
    },
    shouldNotifyIsJoiningGroup: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.shouldNotifyIsJoiningGroup = value
    },
    notifyIsJoiningGroup: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.notifyIsJoiningGroup = value
      if (value) {
        state.shouldNotifyIsJoiningGroup = false
      }
    },
    notifyIsDuplicatingSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.notifyIsDuplicatingSpace = value
    },
    notifyBoxSnappingIsReady: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.notifyBoxSnappingIsReady = value
    },

    // Notifications with Position

    addNotificationWithPosition: (state, notification) => {
      if (!notification.layer) {
        console.error('🚒 addNotificationWithPosition missing param layer')
        return
      }
      notification.id = nanoid()
      state.notificationsWithPosition.push(notification)
    },
    removeNotificationWithPosition: (state) => {
      state.notificationsWithPosition.shift()
    },
    clearNotificationsWithPosition: (state) => {
      state.notificationsWithPosition = []
    },

    // Filters

    clearSpaceFilters: (state) => {
      state.filteredConnectionTypeIds = []
      state.filteredFrameIds = []
      state.filteredTagNames = []
      state.filteredBoxIds = []
    },
    addToFilteredConnectionTypeId: (state, id) => {
      utils.typeCheck({ value: id, type: 'string' })
      state.filteredConnectionTypeIds.push(id)
    },
    removeFromFilteredConnectionTypeId: (state, id) => {
      utils.typeCheck({ value: id, type: 'string' })
      state.filteredConnectionTypeIds = state.filteredConnectionTypeIds.filter(typeId => typeId !== id)
    },
    addToFilteredFrameIds: (state, id) => {
      utils.typeCheck({ value: id, type: 'number' })
      state.filteredFrameIds.push(id)
    },
    removeFromFilteredFrameIds: (state, id) => {
      utils.typeCheck({ value: id, type: 'number' })
      state.filteredFrameIds = state.filteredFrameIds.filter(frameId => frameId !== id)
    },
    addToFilteredTagNames: (state, name) => {
      utils.typeCheck({ value: name, type: 'string' })
      state.filteredTagNames.push(name)
    },
    removeFromFilteredTagNames: (state, name) => {
      utils.typeCheck({ value: name, type: 'string' })
      state.filteredTagNames = state.filteredTagNames.filter(tagName => tagName !== name)
    },
    spaceListFilterInfo: (state, value) => {
      utils.typeCheck({ value, type: 'object' })
      state.spaceListFilterInfo = value
    },
    addToFilteredBoxId: (state, id) => {
      utils.typeCheck({ value: id, type: 'string' })
      state.filteredBoxIds.push(id)
    },
    removeFromFilteredBoxId: (state, id) => {
      utils.typeCheck({ value: id, type: 'string' })
      state.filteredBoxIds = state.filteredBoxIds.filter(typeId => typeId !== id)
    },

    // Session Data

    updateOtherUsers: (state, updatedUser) => {
      if (!updatedUser) { return }
      utils.typeCheck({ value: updatedUser, type: 'object' })
      state.otherUsers[updatedUser.id] = updatedUser
    },
    updateOtherItems: (state, { cards, spaces }) => {
      utils.typeCheck({ value: cards, type: 'array' })
      utils.typeCheck({ value: spaces, type: 'array' })
      const otherItems = utils.clone(state.otherItems)
      if (cards.length) {
        otherItems.cards = otherItems.cards.concat(cards)
        otherItems.cards = uniqBy(otherItems.cards, 'id')
      }
      if (spaces.length) {
        otherItems.spaces = otherItems.spaces.concat(spaces)
        otherItems.spaces = uniqBy(otherItems.spaces, 'id')
      }
      state.otherItems = otherItems
    },
    updateCardNameInOtherItems: (state, { id, name }) => {
      const cards = state.otherItems.cards
      const index = cards.findIndex(card => card.id === id)
      const card = cards[index]
      if (card) {
        card.name = name
      }
    },
    currentUserIsInvitedButCannotEditCurrentSpace: (state, value) => {
      state.currentUserIsInvitedButCannotEditCurrentSpace = value
    },

    // Sync Session Data

    sendingQueue: (state, value) => {
      utils.typeCheck({ value, type: 'array' })
      state.sendingQueue = value
      // cache.saveSendingQueue(value)
    },
    clearSendingQueue: (state) => {
      state.sendingQueue = []
      // cache.clearSendingQueue()
    },

    // Code Blocks

    codeLanguagePickerIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.codeLanguagePickerIsVisible = value
    },
    codeLanguagePickerPosition: (state, position) => {
      utils.typeCheck({ value: position, type: 'object' })
      state.codeLanguagePickerPosition = position
    },
    codeLanguagePickerCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string' })
      state.codeLanguagePickerCardId = cardId
    },

    // Snap Guide Lines

    snapGuideLinesOrigin: (state, position) => {
      utils.typeCheck({ value: position, type: 'object' })
      state.snapGuideLinesOrigin = position
    }
  },

  actions: {
    updateTags: async (context) => {
      const tags = await cache.allTags()
      context.commit('tags', tags)
    },
    // moveFailedSendingQueueOperationBackIntoQueue: async (context, operation) => {
    //   // save to queue
    //   let queue = await cache.queue()
    //   queue.unshift(operation)
    //   cache.saveQueue(queue)
    //   // remove from sending queue
    //   let sendingQueue = context.state.sendingQueue
    //   sendingQueue = sendingQueue.filter(queueItem => queueItem.body.operationId !== operation.operationId)
    //   context.commit('sendingQueue', sendingQueue)
    // },
    prevSpaceIdInSession: (context, id) => {
      utils.typeCheck({ value: id, type: 'string' })
      const position = {
        x: window.scrollX,
        y: window.scrollY
      }
      context.commit('prevSpaceIdInSession', id)
      context.commit('prevSpaceIdInSessionPagePosition', position)
    },
    isOnline: (context, isOnline) => {
      utils.typeCheck({ value: isOnline, type: 'boolean' })
      const prevIsOnline = context.state.isOnline
      const reconnected = isOnline && !prevIsOnline
      const disconnected = !isOnline && prevIsOnline
      if (reconnected) {
        context.commit('addNotification', { icon: 'offline', message: 'Reconnected to server', type: 'success' })
        context.commit('isLoadingSpace', false)
        context.commit('triggerCheckIfShouldNotifySpaceOutOfSync')
      } else if (disconnected) {
        // context.commit('addNotification', { icon: 'offline', message: 'Offline mode', type: 'info' })
      }
      context.commit('isOnline', isOnline)
    },
    updateCurrentSpaceIsUnavailableOffline: async (context, spaceId) => {
      const spaceStore = useSpaceStore()
      const isOffline = !context.state.isOnline
      const isNotCached = await spaceStore.getSpaceIsNotCached(spaceId)
      const isRemote = spaceStore.getSpaceIsRemote
      const value = isOffline && isNotCached && isRemote
      context.commit('currentSpaceIsUnavailableOffline', value)
    },
    updateSpaceAndCardUrlToLoad: (context, path) => {
      const matches = utils.spaceAndCardIdFromPath(path)
      if (!matches) { return }
      if (matches.cardId) {
        context.dispatch('focusOnCardId', matches.cardId)
      }
      context.commit('spaceUrlToLoad', matches.spaceUrl)
    },
    focusOnCardId: (context, cardId) => {
      context.commit('focusOnCardId', cardId)
      if (cardId) {
        context.commit('triggerScrollCardIntoView', cardId)
      }
    },
    focusOnBoxId: (context, boxId) => {
      context.commit('focusOnBoxId', boxId)
      if (boxId) {
        const element = utils.boxElementFromId(boxId)
        store.commit('scrollElementIntoView', { element, positionIsCenter: true })
      }
    },
    updatePageSizes: async (context) => {
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
      context.commit('updatePageSizes', rect)
    },
    updateViewportSizes: (context) => {
      const viewport = utils.visualViewport()
      context.commit('updateViewportSizes', viewport)
    },
    checkIfItemShouldIncreasePageSize: (context, item) => {
      if (!item) { return }
      item = utils.clone(item)
      item.width = item.width || item.resizeWidth
      item.height = item.height || item.resizeHeight
      const zoom = context.getters.spaceZoomDecimal
      const thresholdHeight = (context.state.viewportHeight * zoom) / 2
      const thresholdWidth = (context.state.viewportWidth * zoom) / 2
      const pageWidth = context.state.pageWidth
      const pageHeight = context.state.pageHeight
      const shouldIncreasePageWidth = (item.x + item.width + thresholdWidth) > pageWidth
      const shouldIncreasePageHeight = (item.y + item.height + thresholdHeight) > pageHeight
      if (shouldIncreasePageWidth) {
        const width = pageWidth + thresholdWidth
        context.commit('pageWidth', width)
      }
      if (shouldIncreasePageHeight) {
        const height = pageHeight + thresholdHeight
        context.commit('pageHeight', height)
      }
    },
    clearAllFilters: (context) => {
      context.commit('clearSpaceFilters')
      context.dispatch('currentUser/clearUserFilters')
    },
    clearSpaceFilters: (context) => {
      context.commit('clearSpaceFilters')
    },
    closeAllDialogs: (context, origin) => {
      const broadcastStore = useBroadcastStore()
      origin = origin || 'Store.closeAllDialogs'
      context.commit('closeAllDialogs', origin)
      const space = context.state.currentSpace
      const user = context.state.currentUser
      broadcastStore.updateUser({ user: utils.userMeta(user, space), type: 'updateUserPresence' })
      broadcastStore.updateStore({ updates: { userId: user.id }, type: 'clearRemoteCardDetailsVisible' })
      broadcastStore.updateStore({ updates: { userId: user.id }, type: 'clearRemoteConnectionDetailsVisible' })
      broadcastStore.updateStore({ updates: { userId: user.id }, type: 'clearRemoteBoxDetailsVisible' })
      context.commit('passwordResetIsVisible', false)
      context.dispatch('focusOnCardId', '')
      context.dispatch('focusOnBoxId', '')
    },
    toggleCardSelected: (context, cardId) => {
      const previousMultipleCardsSelectedIds = context.state.previousMultipleCardsSelectedIds
      const cardIsSelected = previousMultipleCardsSelectedIds.includes(cardId)
      if (cardIsSelected) {
        context.dispatch('removeFromMultipleCardsSelected', cardId)
      } else {
        context.dispatch('addToMultipleCardsSelected', cardId)
      }
    },
    addToMultipleCardsSelected: (context, cardId) => {
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      utils.typeCheck({ value: cardId, type: 'string' })
      if (context.state.multipleCardsSelectedIds.includes(cardId)) { return }
      context.commit('addToMultipleCardsSelected', cardId)
      const updates = {
        userId: userStore.id,
        cardId
      }
      broadcastStore.updateStore({ updates, type: 'addToRemoteCardsSelected' })
    },
    removeFromMultipleCardsSelected: (context, cardId) => {
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      utils.typeCheck({ value: cardId, type: 'string' })
      if (!context.state.multipleCardsSelectedIds.includes(cardId)) { return }
      context.commit('removeFromMultipleCardsSelected', cardId)
      const updates = {
        userId: userStore.id,
        cardId
      }
      broadcastStore.updateStore({ updates, type: 'removeFromRemoteCardsSelected' })
    },
    addMultipleToMultipleCardsSelected: (context, cardIds) => {
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      utils.typeCheck({ value: cardIds, type: 'array' })
      if (!cardIds.length) { return }
      const set1 = new Set(cardIds)
      const set2 = new Set(context.state.multipleCardsSelectedIds)
      // Combine sets
      const combinedSet = new Set([...set1, ...set2])
      // Convert back to array
      cardIds = [...combinedSet]
      context.commit('multipleCardsSelectedIds', cardIds)
      const updates = {
        userId: userStore.id,
        cardIds
      }
      broadcastStore.updateStore({ updates, type: 'updateRemoteCardsSelected' })
    },
    multipleCardsSelectedIds: (context, cardIds) => {
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      utils.typeCheck({ value: cardIds, type: 'array' })
      context.commit('multipleCardsSelectedIds', cardIds)
      const updates = {
        userId: userStore.id,
        cardIds
      }
      broadcastStore.updateStore({ updates, type: 'updateRemoteCardsSelected' })
    },
    multipleBoxesSelectedIds: (context, boxIds) => {
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      utils.typeCheck({ value: boxIds, type: 'array' })
      context.commit('multipleBoxesSelectedIds', boxIds)
      const updates = {
        userId: userStore.id,
        boxIds
      }
      broadcastStore.updateStore({ updates, type: 'updateRemoteBoxesSelected' })
    },
    clearMultipleSelected: (context) => {
      const broadcastStore = useBroadcastStore()
      if (context.state.multipleCardsSelectedIds.length || context.state.multipleConnectionsSelectedIds.length || context.state.multipleBoxesSelectedIds.length) {
        context.commit('clearMultipleSelected')
      }
      const space = context.state.currentSpace
      const user = context.state.currentUser
      broadcastStore.updateStore({ user: utils.userMeta(user, space), type: 'clearRemoteMultipleSelected' })
    },
    toggleMultipleConnectionsSelected: (context, connectionId) => {
      utils.typeCheck({ value: connectionId, type: 'string' })
      const previousMultipleConnectionsSelectedIds = context.state.previousMultipleConnectionsSelectedIds
      const connectionIsSelected = previousMultipleConnectionsSelectedIds.includes(connectionId)
      if (connectionIsSelected) {
        context.dispatch('removeFromMultipleConnectionsSelected', connectionId)
      } else {
        context.dispatch('addToMultipleConnectionsSelected', connectionId)
      }
    },
    addToMultipleConnectionsSelected: (context, connectionId) => {
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      utils.typeCheck({ value: connectionId, type: 'string' })
      if (context.state.multipleConnectionsSelectedIds.includes(connectionId)) { return }
      context.commit('addToMultipleConnectionsSelected', connectionId)
      const updates = {
        userId: userStore.id,
        connectionId
      }
      broadcastStore.updateStore({ updates, type: 'addToRemoteConnectionsSelected' })
    },
    removeFromMultipleConnectionsSelected: (context, connectionId) => {
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      utils.typeCheck({ value: connectionId, type: 'string' })
      if (!context.state.multipleConnectionsSelectedIds.includes(connectionId)) { return }
      context.commit('removeFromMultipleConnectionsSelected', connectionId)
      const updates = {
        userId: userStore.id,
        connectionId
      }
      broadcastStore.updateStore({ updates, type: 'removeFromRemoteConnectionsSelected' })
    },
    multipleConnectionsSelectedIds: (context, connectionIds) => {
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      utils.typeCheck({ value: connectionIds, type: 'array' })
      context.commit('multipleConnectionsSelectedIds', connectionIds)
      const updates = {
        userId: userStore.id,
        connectionIds
      }
      broadcastStore.updateStore({ updates, type: 'updateRemoteConnectionsSelected' })
    },
    addMultipleToMultipleConnectionsSelected: (context, connectionIds) => {
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      utils.typeCheck({ value: connectionIds, type: 'array' })
      if (!connectionIds.length) { return }
      const set1 = new Set(connectionIds)
      const set2 = new Set(context.state.multipleConnectionsSelectedIds)
      // Combine sets
      const combinedSet = new Set([...set1, ...set2])
      // Convert back to array
      connectionIds = [...combinedSet]
      context.commit('multipleConnectionsSelectedIds', connectionIds)
      const updates = {
        userId: userStore.id,
        connectionIds
      }
      broadcastStore.updateStore({ updates, type: 'updateRemoteConnectionsSelected' })
    },
    connectionDetailsIsVisibleForConnectionId: (context, connectionId) => {
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      context.commit('connectionDetailsIsVisibleForConnectionId', connectionId)
      const updates = {
        userId: userStore.id,
        connectionId
      }
      broadcastStore.updateStore({ updates, type: 'addToRemoteConnectionDetailsVisible' })
    },
    addToMultipleBoxesSelected: (context, boxId) => {
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      utils.typeCheck({ value: boxId, type: 'string' })
      if (context.state.multipleBoxesSelectedIds.includes(boxId)) { return }
      context.commit('addToMultipleBoxesSelected', boxId)
      const updates = {
        userId: userStore.id,
        boxId
      }
      broadcastStore.updateStore({ updates, type: 'addToRemoteBoxesSelected' })
    },
    addMultipleToMultipleBoxesSelected: (context, boxIds) => {
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      utils.typeCheck({ value: boxIds, type: 'array' })
      if (!boxIds.length) { return }
      const set1 = new Set(boxIds)
      const set2 = new Set(context.state.multipleBoxesSelectedIds)
      // Combine sets
      const combinedSet = new Set([...set1, ...set2])
      // Convert back to array
      boxIds = [...combinedSet]
      context.commit('multipleBoxesSelectedIds', boxIds)
      const updates = {
        userId: userStore.id,
        boxIds
      }
      broadcastStore.updateStore({ updates, type: 'updateRemoteBoxesSelected' })
    },
    removeFromMultipleBoxesSelected: (context, boxId) => {
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      utils.typeCheck({ value: boxId, type: 'string' })
      if (!context.state.multipleBoxesSelectedIds.includes(boxId)) { return }
      context.commit('removeFromMultipleBoxesSelected', boxId)
      const updates = {
        userId: userStore.id,
        boxId
      }
      broadcastStore.updateStore({ updates, type: 'removeFromRemoteBoxesSelected' })
    },
    triggerSonarPing: (context, event) => {
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      const ping = utils.cursorPositionInSpace(event)
      ping.color = userStore.color
      context.commit('triggerSonarPing', ping)
      broadcastStore.updateStore({ updates: ping, type: 'triggerSonarPing' })
    },
    currentUserIsPanning: (context, value) => {
      const prevValue = context.state.currentUserIsPanning
      if (!prevValue && value) {
        context.commit('triggerPanningStart')
      }
      context.commit('currentUserIsPanning', value)
    },

    // current space

    updateCurrentUserIsInvitedButCannotEditCurrentSpace: async (context, space) => {
      const userStore = useUserStore()
      space = space || context.state.currentSpace
      const currentUserIsSignedIn = userStore.getUserIsSignedIn
      const invitedSpaces = await cache.invitedSpaces()
      const isInvitedToSpace = Boolean(invitedSpaces.find(invitedSpace => invitedSpace.id === space.id))
      const isReadOnlyInvitedToSpace = userStore.getUserIsReadOnlyInvitedToSpace(space)
      const inviteRequiresSignIn = !currentUserIsSignedIn && isInvitedToSpace
      const value = isReadOnlyInvitedToSpace || inviteRequiresSignIn
      context.commit('currentUserIsInvitedButCannotEditCurrentSpace', value)
    },

    // Pinned Dialogs

    sidebarIsPinned: (context, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      context.commit('sidebarIsPinned', value)
    },
    minimapIsPinned: (context, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      context.commit('minimapIsPinned', value)
    },
    spaceDetailsIsPinned: (context, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      context.commit('spaceDetailsIsPinned', value)
    },
    searchIsPinned: (context, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      context.commit('searchIsPinned', value)
    },
    userSettingsIsPinned: (context, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      context.commit('userSettingsIsPinned', value)
    },

    // scrolling and zoom

    zoomOrigin: (context, origin) => {
      utils.typeCheck({ value: origin, type: 'object' })
      const prevOrigin = context.state.zoomOrigin
      const zoomOriginIsZero = !utils.objectHasKeys(prevOrigin) || (prevOrigin.x === 0 && prevOrigin.y === 0)
      if (zoomOriginIsZero) {
        context.commit('zoomOrigin', origin)
      } else {
        origin = utils.pointBetweenTwoPoints(prevOrigin, origin)
        context.commit('zoomOrigin', origin)
      }
    },
    zoomSpace: (context, { shouldZoomIn, shouldZoomOut, speed }) => {
      let percent
      const currentPercent = context.state.spaceZoomPercent
      if (shouldZoomIn) {
        percent = currentPercent + speed
      } else if (shouldZoomOut) {
        percent = currentPercent - speed
      } else {
        return
      }
      percent = Math.max(percent, consts.spaceZoom.min)
      percent = Math.min(percent, consts.spaceZoom.max)
      context.commit('spaceZoomPercent', percent)
    },

    // drawing

    currentUserToolbar: (context, value) => {
      const userStore = useUserStore()
      const canOnlyComment = userStore.getUserIsCommentOnly
      if (canOnlyComment) { return }
      context.commit('currentUserToolbar', value)
    },
    toggleCurrentUserToolbar: (context, value) => {
      const userStore = useUserStore()
      const canOnlyComment = userStore.getUserIsCommentOnly
      const prevValue = context.state.currentUserToolbar
      if (canOnlyComment) { return }
      if (value === prevValue) {
        context.commit('currentUserToolbar', 'card')
      } else {
        context.commit('currentUserToolbar', value)
      }
    },
    toggleDrawingEraserIsActive: (context) => {
      const value = !context.state.drawingEraserIsActive
      context.commit('drawingEraserIsActive', value)
    }
  },
  getters: {
    isSpacePage: (state) => {
      if (window.location.pathname === '/add') { return }
      return !state.isAddPage
    },
    shouldScrollAtEdges: (state, getters) => (event) => {
      if (window.visualViewport.scale > 1) { return }
      let isPainting
      if (event.touches) {
        isPainting = state.currentUserIsPaintingLocked
      } else {
        isPainting = state.currentUserIsPainting
      }
      const isDrawingConnection = state.currentUserIsDrawingConnection
      const isDraggingCard = state.currentUserIsDraggingCard
      const isDraggingBox = state.currentUserIsDraggingBox
      return isPainting || isDrawingConnection || isDraggingCard || isDraggingBox
    },
    otherUserById: (state, getters) => (userId) => {
      return state.otherUsers[userId]
    },
    otherSpaceById: (state, getters) => (spaceId) => {
      const otherSpaces = state.otherItems.spaces.filter(Boolean)
      const space = otherSpaces.find(otherSpace => otherSpace.id === spaceId)
      return space
    },
    otherCardById: (state, getters) => (cardId) => {
      const otherCards = state.otherItems.cards.filter(Boolean)
      const card = otherCards.find(otherCard => otherCard.id === cardId)
      return card
    },
    spaceZoomDecimal: (state) => {
      return state.spaceZoomPercent / 100
    },
    spaceCounterZoomDecimal: (state, getters) => {
      return 1 / getters.spaceZoomDecimal
    },
    isTouchDevice: (state) => {
      return state.isTouchDevice || utils.isMobile() || consts.isSecureAppContext
    },
    zoomTransform: (state, getters) => {
      const zoom = getters.spaceZoomDecimal
      const origin = state.zoomOrigin
      const transform = `translate(${origin.x}px, ${origin.y}px) scale(${zoom}) translate(-${origin.x}px, -${origin.y}px)`
      return transform
    },
    windowScrollWithSpaceOffset: (state) => () => {
      const scroll = { x: window.scrollX, y: window.scrollY }
      return utils.updatePositionWithSpaceOffset(scroll)
    },
    isInteractingWithItem: (state) => {
      return state.currentUserIsDraggingCard || state.currentUserIsDrawingConnection || state.currentUserIsResizingCard || state.currentUserIsResizingBox || state.currentUserIsDraggingBox
    },
    isMultipleItemsSelected: (state) => {
      return state.multipleCardsSelectedIds.length || state.multipleConnectionsSelectedIds.length || state.multipleBoxesSelectedIds.length
    },
    spaceShouldHaveBorderRadius: (state) => {
      const isNativeApp = consts.isSecureAppContext
      const isZoomedOut = state.spaceZoomPercent !== 100
      if (isNativeApp || isZoomedOut) { return true }
    },
    dateImageUrl: (state) => {
      if (state.dateImageUrl) {
        return state.dateImageUrl
      } else {
        const date = dayjs().format('MM-DD-YYYY') // 11-19-2024
        return `${consts.cdnHost}/date/${date}.jpg` // https://cdn.kinopio.club/date/11-19-24.jpg
      }
    },
    newTag: (state) => ({ name, defaultColor, cardId, spaceId }) => {
      let color
      const allTags = state.tags
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
    allTags: (state) => {
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const allTags = state.tags
      const userTags = userStore.tags
      const spaceTags = spaceStore.tags
      const tags = spaceTags.concat(userTags).concat(allTags)
      // tags = uniqBy(tags, 'name') // removed for perf reasons
      return tags || []
    },
    currentInteractingItem: (state, getters, rootState, rootGetters) => {
      const boxStore = useBoxStore()
      const cardStore = useCardStore()
      let boxId = state.currentDraggingBoxId
      if (state.currentUserIsResizingBox) {
        boxId = state.currentUserIsResizingBoxIds[0]
      }
      let cardId = state.currentDraggingCardId
      if (state.currentUserIsResizingCard) {
        cardId = state.currentUserIsResizingCardIds[0]
      }
      if (boxId) {
        return boxStore.getBox(boxId)
      }
      if (cardId) {
        return cardStore.getCard(cardId)
      }
    }
  },

  modules: {
    // api,
    // broadcast,
    history,
    // currentUser,
    // currentSpace,
    // currentCards,
    // currentConnections,
    // currentBoxes,
    // upload,
    // userNotifications,
    // groups,
    themes
    // analytics
  }
  // plugins: [websocket()]
})

export default store
