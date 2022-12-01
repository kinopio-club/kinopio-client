import utils from '@/utils.js'
import cache from '@/cache.js'
// store modules
import api from '@/store/api.js'
import broadcast from '@/store/broadcast.js'
import history from '@/store/history.js'
import currentUser from '@/store/currentUser.js'
import currentSpace from '@/store/currentSpace.js'
import currentCards from '@/store/currentCards.js'
import currentConnections from '@/store/currentConnections.js'
import currentBoxes from '@/store/currentBoxes.js'
import upload from '@/store/upload.js'
// store plugins
import websocket from '@/store/plugins/websocket.js'

import { createStore } from 'vuex'
import { nanoid } from 'nanoid'
import uniqBy from 'lodash-es/uniqBy'

const store = createStore({
  strict: import.meta.env.MODE !== 'production',
  state: {
    pageHeight: 0,
    pageWidth: 0,
    maxPageSizeHeight: 0,
    maxPageSizeWidth: 0,
    viewportHeight: 0,
    viewportWidth: 0,
    isOnline: true,
    isReconnectingToBroadcast: false,
    isBeta: false,
    shouldHideConnectionOutline: false,
    newStuffIsUpdated: false,
    stripeIsLoaded: false,
    shouldHideFooter: false,
    shouldExplicitlyHideFooter: false,
    isTouchDevice: false,
    cardsCreatedLimit: 100,
    prevCursorPosition: { x: 0, y: 0 },
    currentSpacePath: '/',
    webfontIsLoaded: false,
    userHasScrolled: false,
    shouldPreventNextEnterKey: false,
    shouldPreventNextFocusOnName: false,
    isEmbed: false,
    isAddPage: false,
    isAppStoreView: false,
    disableViewportOptimizations: false, // for urlbox

    // zooming
    spaceZoomPercent: 100,
    zoomOrigin: { x: 0, y: 0 },

    // search
    searchIsVisible: false,
    search: '',
    searchResultsCards: [],
    previousResultCardId: '',

    // reset password
    resetPasswordApiKey: '',
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
    currentUserIsPanningReady: false,
    currentUserIsPanning: false,
    currentUserToolbar: 'card', // card, box

    // minimap
    minimapIsVisible: false,

    // box-selecting
    currentUserIsBoxSelecting: false,
    currentUserBoxSelectStart: {},
    currentUserBoxSelectEnd: {},
    remoteUserBoxSelectStyles: [],
    remotePreviousUserBoxSelectStyles: [],

    // boxes
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
    shouldAddCard: false,
    cardDetailsIsVisibleForCardId: '',
    parentCardId: '',
    childCardId: '',
    remoteCardDetailsVisible: [],
    preventCardDetailsOpeningAnimation: true,
    multipleCardsSelectedIds: [],
    newTweetCards: [],
    prevNewTweetCards: [],
    // resizing card
    currentUserIsResizingCard: false,
    currentUserIsResizingCardIds: [],
    remoteUserResizingCards: [],
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
    triggeredPaintFramePosition: {},
    previousMultipleBoxesSelectedIds: [],

    // connecting
    currentConnectionStartCardIds: [],
    currentConnectionSuccess: {},
    currentConnectionCursorStart: {},
    connectionDetailsPosition: {}, // x, y, pageX, pageY
    connectionDetailsIsVisibleForConnectionId: '',
    currentConnectionColor: '',
    triggeredDrawConnectionFrame: {},
    remoteConnectionDetailsVisible: [],
    remoteCurrentConnections: [],
    currentCardConnections: [],

    // tags
    tagDetailsIsVisible: false,
    tagDetailsIsVisibleFromTagList: false,
    tagDetailsPosition: {}, // x, y
    tagDetailsPositionShouldUpdate: false,
    currentSelectedTag: {},
    remoteTags: [],
    remoteTagsIsFetched: false,

    // links
    linkDetailsIsVisible: false,
    linkDetailsPosition: {}, // x, y
    currentSelectedLink: {},

    // pinned dialogs
    spaceDetailsIsPinned: false,
    sidebarIsPinned: false,

    // loading
    isLoadingSpace: false,
    isJoiningSpace: false, // broadcast
    spaceUrlToLoad: '',
    spaceCollaboratorKeys: [],
    remotePendingUploads: [],
    hasRestoredFavorites: false,
    loadSpaceShowDetailsForCardId: '',
    loadJournalSpace: false,
    loadJournalSpaceTomorrow: false,
    loadNewSpace: false,
    urlPreviewLoadingForCardIds: [],
    loadInboxSpace: false,

    // notifications
    notifications: [],
    notifySpaceNotFound: false,
    notifyConnectionError: false,
    notifyServerCouldNotSave: false,
    notifySpaceIsRemoved: false,
    notifyCurrentSpaceIsNowRemoved: false,
    notifySignUpToEditSpace: false,
    notifyCardsCreatedIsNearLimit: false,
    notifyCardsCreatedIsOverLimit: false,
    notifyKinopioUpdatesAreAvailable: false,
    notifyMoveOrCopyToSpace: false,
    notifyMoveOrCopyToSpaceDetails: {},
    hasNotifiedPressAndHoldToDrag: false,
    notifySpaceIsHidden: false,
    notifyThanksForDonating: false,

    // notifications with position
    notificationsWithPosition: [],

    // filters
    filteredConnectionTypeIds: [],
    filteredFrameIds: [],
    filteredTagNames: [],

    // session data
    otherUsers: [], // { id, name color }
    otherSpaces: [], // { {user}, name, id }
    otherTags: []
  },
  mutations: {
    resetPageSizes: (state) => {
      state.pageWidth = 0
      state.pageHeight = 0
    },
    updatePageSizes: (state, itemsRect) => {
      const viewportWidth = utils.visualViewport().width
      let viewportHeight = utils.visualViewport().height
      state.viewportWidth = Math.round(viewportWidth)
      state.viewportHeight = Math.round(viewportHeight)
      let pageWidth = Math.max(viewportWidth, itemsRect.width, state.pageWidth)
      let pageHeight = Math.max(viewportHeight, itemsRect.height, state.pageHeight)
      state.pageWidth = Math.round(pageWidth)
      state.pageHeight = Math.round(pageHeight)
    },
    updateSpacePageSize: (state) => {
      const extraScrollArea = 160
      state.pageWidth = extraScrollArea
      state.pageHeight = extraScrollArea
    },
    pageHeight: (state, height) => {
      utils.typeCheck({ value: height, type: 'number', origin: 'pageHeight' })
      state.pageHeight = height
    },
    pageWidth: (state, width) => {
      utils.typeCheck({ value: width, type: 'number', origin: 'pageWidth' })
      state.pageWidth = width
    },
    closeAllDialogs: (state) => {
      let dialogs = document.querySelectorAll('dialog')
      const dialogIsVisible = Boolean(dialogs.length)
      if (!dialogIsVisible) { return }
      if (utils.unpinnedDialogIsVisible()) {
        state.shouldAddCard = false
      }
      state.multipleSelectedActionsIsVisible = false
      state.cardDetailsIsVisibleForCardId = ''
      state.connectionDetailsIsVisibleForConnectionId = ''
      state.boxDetailsIsVisibleForBoxId = ''
      state.tagDetailsIsVisible = false
      state.tagDetailsIsVisibleFromTagList = false
      state.currentSelectedTag = {}
      state.linkDetailsIsVisible = false
      state.currentSelectedLink = {}
      state.searchIsVisible = false
      state.cardsWereDragged = false
      state.boxesWereDragged = false
      state.userDetailsIsVisible = false
    },
    isOnline: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'isOnline' })
      state.isOnline = value
    },
    isReconnectingToBroadcast: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'isReconnectingToBroadcast' })
      state.isReconnectingToBroadcast = value
    },
    isBeta: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'isBeta' })
      state.isBeta = value
    },
    loadJournalSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'loadJournalSpace' })
      state.loadJournalSpace = value
    },
    loadJournalSpaceTomorrow: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'loadJournalSpaceTomorrow' })
      state.loadJournalSpaceTomorrow = value
    },
    loadNewSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'loadNewSpace' })
      state.loadNewSpace = value
    },
    loadInboxSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'loadInboxSpace' })
      state.loadInboxSpace = value
    },
    addUrlPreviewLoadingForCardIds: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'addUrlPreviewLoadingForCardIds' })
      state.urlPreviewLoadingForCardIds.push(cardId)
    },
    removeUrlPreviewLoadingForCardIds: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'removeUrlPreviewLoadingForCardIds' })
      let cardIds = utils.clone(state.urlPreviewLoadingForCardIds)
      cardIds = cardIds.filter(id => cardId !== id) || []
      state.urlPreviewLoadingForCardIds = cardIds
    },
    shouldHideConnectionOutline: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'shouldHideConnectionOutline' })
      state.shouldHideConnectionOutline = value
    },
    newStuffIsUpdated: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'newStuffIsUpdated' })
      state.newStuffIsUpdated = value
    },
    stripeIsLoaded: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'stripeIsLoaded' })
      state.stripeIsLoaded = value
    },
    shouldHideFooter: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'shouldHideFooter' })
      state.shouldHideFooter = value
    },
    shouldExplicitlyHideFooter: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'shouldExplicitlyHideFooter' })
      state.shouldExplicitlyHideFooter = value
    },
    isTouchDevice: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'isTouchDevice' })
      state.isTouchDevice = value
    },
    prevCursorPosition: (state, cursor) => {
      state.prevCursorPosition = cursor
    },
    currentSpacePath: (state, value) => {
      utils.typeCheck({ value, type: 'string', origin: 'currentSpacePath' })
      state.currentSpacePath = value
    },
    webfontIsLoaded: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'webfontIsLoaded' })
      state.webfontIsLoaded = value
    },
    userHasScrolled: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'userHasScrolled' })
      state.userHasScrolled = value
    },
    shouldPreventNextEnterKey: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'shouldPreventNextEnterKey' })
      state.shouldPreventNextEnterKey = value
    },
    shouldPreventNextFocusOnName: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'shouldPreventNextFocusOnName' })
      state.shouldPreventNextFocusOnName = value
    },
    isEmbed: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'isEmbed' })
      state.isEmbed = value
    },
    isAddPage: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'isAddPage' })
      state.isAddPage = value
    },
    isAppStoreView: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'isAppStoreView' })
      state.isAppStoreView = value
    },
    disableViewportOptimizations: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'disableViewportOptimizations' })
      state.disableViewportOptimizations = value
    },
    searchIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'searchIsVisible' })
      state.searchIsVisible = value
    },
    search: (state, value) => {
      utils.typeCheck({ value, type: 'string', origin: 'search' })
      state.search = value
    },
    searchResultsCards: (state, results) => {
      utils.typeCheck({ value: results, type: 'array', origin: 'searchResultsCards' })
      state.searchResultsCards = results
    },
    previousResultCardId: (state, value) => {
      utils.typeCheck({ value, type: 'string', origin: 'previousResultCardId' })
      state.previousResultCardId = value
    },
    clearSearch: (state) => {
      state.search = ''
      state.searchResultsCards = []
      state.previousResultCardId = ''
    },
    resetPasswordApiKey: (state, apiKey) => {
      utils.typeCheck({ value: apiKey, type: 'string', origin: 'resetPasswordApiKey' })
      state.resetPasswordApiKey = apiKey
    },
    passwordResetIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'passwordResetIsVisible' })
      state.passwordResetIsVisible = value
    },
    importArenaChannelIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'importArenaChannelIsVisible' })
      state.importArenaChannelIsVisible = value
    },
    isAuthenticatingWithArena: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'isAuthenticatingWithArena' })
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
    triggerUpdateMagicPaintPositionOffset: () => {},
    triggeredPaintFramePosition: (state, cursor) => {
      state.triggeredPaintFramePosition = cursor
    },
    triggerAddRemotePaintingCircle: () => {},
    triggerUpdateRemoteUserCursor: () => {},
    triggerUpdateRemoteDropGuideLine: () => {},
    triggerUpdateStopRemoteUserDropGuideLine: () => {},
    triggerUpdatePositionInVisualViewport: () => {},
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
    triggerSpaceZoomOut: (state, options) => {},
    triggerSpaceZoomIn: (state, options) => {},
    triggerUnloadPage: () => {},
    triggerShowNextSearchCard: () => {},
    triggerShowPreviousSearchCard: () => {},
    triggerMoreFiltersIsNotVisible: () => {},
    triggerShowConnectionDetails: (state, options) => {},
    triggerUpdateWindowHistory: (state, options) => {},
    triggerAddCard: () => {},
    triggerCardDetailsCloseDialogs: () => {},
    triggerSpaceDetailsCloseDialogs: () => {},
    triggerTemplatesIsVisible: () => {},
    triggerImportIsVisible: () => {},
    triggerSelectAllItemsBelowCursor: (state, position) => {},
    triggerSplitCard: (state, cardId) => {},
    triggerUpdateUrlPreview: (state, cardId) => {},
    triggerUpdateUrlPreviewComplete: (state, cardId) => {},
    triggerRemovedIsVisible: () => {},
    triggerAIImagesIsVisible: () => {},
    triggerClearAllSpaceFilters: () => {},
    triggerNotifyUnlockedStickyCards: () => {},
    triggerAddToInboxIsVisible: () => {},
    triggerCheckIfUseHasInboxSpace: () => {},
    triggerScrollUserDetailsIntoView: () => {},
    triggerUpdateLockedItemButtonsPositions: () => {},
    triggerLoadBackground: () => {},

    // Zoom

    spaceZoomPercent: (state, value) => {
      utils.typeCheck({ value, type: 'number', origin: 'spaceZoomPercent' })
      state.spaceZoomPercent = value
    },
    zoomOrigin: (state, position) => {
      utils.typeCheck({ value: position, type: 'object', origin: 'zoomOrigin' })
      state.zoomOrigin = position
    },

    // Cards

    shouldAddCard: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'shouldAddCard' })
      state.shouldAddCard = value
    },
    currentUserIsHoveringOverConnectionId: (state, connectionId) => {
      utils.typeCheck({ value: connectionId, type: 'string', origin: 'currentUserIsHoveringOverConnectionId' })
      state.currentUserIsHoveringOverConnectionId = connectionId
    },
    cardDetailsIsVisibleForCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'cardDetailsIsVisibleForCardId' })
      state.cardDetailsIsVisibleForCardId = cardId
    },
    parentCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'parentCardId' })
      state.parentCardId = cardId
    },
    childCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'childCardId' })
      state.childCardId = cardId
    },
    updateRemoteCardDetailsVisible: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'updateRemoteCardDetailsVisible' })
      delete update.type
      let cardDetailsVisible = utils.clone(state.remoteCardDetailsVisible)
      cardDetailsVisible = cardDetailsVisible.filter(card => card.id !== update.cardId) || []
      cardDetailsVisible.push(update)
      state.remoteCardDetailsVisible = cardDetailsVisible
    },
    clearRemoteCardDetailsVisible: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'clearRemoteCardDetailsVisible' })
      state.remoteCardDetailsVisible = state.remoteCardDetailsVisible.filter(card => card.userId !== update.userId) || []
    },
    preventCardDetailsOpeningAnimation: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'preventCardDetailsOpeningAnimation' })
      state.preventCardDetailsOpeningAnimation = value
    },

    // Connecting

    currentUserIsDrawingConnection: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'currentUserIsDrawingConnection' })
      state.currentUserIsDrawingConnection = value
    },
    currentConnectionSuccess: (state, object) => {
      utils.typeCheck({ value: object, type: 'object', allowUndefined: true, origin: 'currentConnectionSuccess' })
      state.currentConnectionSuccess = object
    },
    currentConnectionCursorStart: (state, object) => {
      utils.typeCheck({ value: object, type: 'object', origin: 'currentConnectionCursorStart' })
      state.currentConnectionCursorStart = object
    },
    currentConnectionStartCardIds: (state, cardIds) => {
      utils.typeCheck({ value: cardIds, type: 'array', origin: 'currentConnectionStartCardIds' })
      state.currentConnectionStartCardIds = cardIds
    },
    updateRemoteCurrentConnection: (state, updates) => {
      utils.typeCheck({ value: updates, type: 'object', origin: 'updateRemoteCurrentConnection' })
      const index = state.remoteCurrentConnections.findIndex(remoteConnection => {
        const isUserId = remoteConnection.userId === updates.userId
        const isStartCardId = remoteConnection.startCardId === updates.startCardId
        return isUserId && isStartCardId
      })
      if (index >= 0) {
        let connection = state.remoteCurrentConnections[index]
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
      state.currentCardConnections = connections
    },

    // Painting

    currentUserIsPainting: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'currentUserIsPainting' })
      state.currentUserIsPainting = value
    },
    currentUserIsPaintingLocked: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'currentUserIsPaintingLocked' })
      state.currentUserIsPaintingLocked = value
    },

    // box selecting

    currentBoxIsNew: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'currentBoxIsNew' })
      state.currentBoxIsNew = value
    },
    currentUserIsBoxSelecting: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'currentUserIsBoxSelecting' })
      state.currentUserIsBoxSelecting = value
    },
    currentUserBoxSelectStart: (state, object) => {
      utils.typeCheck({ value: object, type: 'object', origin: 'currentUserBoxSelectStart' })
      state.currentUserBoxSelectStart = object
    },
    currentUserBoxSelectEnd: (state, object) => {
      utils.typeCheck({ value: object, type: 'object', origin: 'currentUserBoxSelectEnd' })
      state.currentUserBoxSelectEnd = object
    },
    updateRemoteUserBoxSelectStyles: (state, object) => {
      utils.typeCheck({ value: object, type: 'object', origin: 'updateRemoteUserBoxSelectStyles' })
      state.remoteUserBoxSelectStyles = state.remoteUserBoxSelectStyles.filter(styles => styles.currentBoxSelectId !== object.currentBoxSelectId)
      state.remoteUserBoxSelectStyles.push(object)
    },
    updateRemotePreviousBoxSelectStyles: (state, object) => {
      utils.typeCheck({ value: object, type: 'object', origin: 'updateRemotePreviousBoxSelectStyles' })
      state.remoteUserBoxSelectStyles = state.remoteUserBoxSelectStyles.filter(styles => styles.currentBoxSelectId !== object.currentBoxSelectId)
      state.remotePreviousUserBoxSelectStyles = state.remotePreviousUserBoxSelectStyles.filter(styles => styles.currentBoxSelectId !== object.currentBoxSelectId)
      state.remotePreviousUserBoxSelectStyles.push(object)
    },
    removeRemotePreviousBoxSelectStyle: (state) => {
      state.remotePreviousUserBoxSelectStyles.shift()
    },

    // Resizing Cards

    currentUserIsResizingCard: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'currentUserIsResizingCard' })
      state.currentUserIsResizingCard = value
    },
    currentUserIsResizingCardIds: (state, cardIds) => {
      utils.typeCheck({ value: cardIds, type: 'array', origin: 'currentUserIsResizingCardIds' })
      state.currentUserIsResizingCardIds = cardIds
    },
    removeRemoteUserResizingCards: (state, update) => {
      state.remoteUserResizingCards = state.remoteUserResizingCards.filter(remoteUser => remoteUser.userId !== update.userId)
    },
    updateRemoteUserResizingCards: (state, update) => {
      state.remoteUserResizingCards = state.remoteUserResizingCards.filter(remoteUser => remoteUser.userId !== update.userId)
      state.remoteUserResizingCards = state.remoteUserResizingCards.concat(update)
    },

    // Boxes

    boxDetailsIsVisibleForBoxId: (state, value) => {
      utils.typeCheck({ value, type: 'string', origin: 'boxDetailsIsVisibleForBoxId' })
      state.boxDetailsIsVisibleForBoxId = value
    },
    currentUserIsResizingBox: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'currentUserIsResizingBox' })
      state.currentUserIsResizingBox = value
    },
    currentUserIsResizingBoxIds: (state, cardIds) => {
      utils.typeCheck({ value: cardIds, type: 'array', origin: 'currentUserIsResizingBoxIds' })
      state.currentUserIsResizingBoxIds = cardIds
    },
    currentUserIsDraggingBox: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'currentUserIsDraggingBox' })
      state.currentUserIsDraggingBox = value
    },
    updateRemoteBoxDetailsVisible: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'updateRemoteBoxDetailsVisible' })
      delete update.type
      let boxDetailsVisible = utils.clone(state.remoteBoxDetailsVisible)
      boxDetailsVisible = boxDetailsVisible.filter(box => box.id !== update.boxId) || []
      boxDetailsVisible.push(update)
      state.remoteBoxDetailsVisible = boxDetailsVisible
    },
    clearRemoteBoxDetailsVisible: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'clearRemoteBoxDetailsVisible' })
      state.remoteBoxDetailsVisible = state.remoteBoxDetailsVisible.filter(box => box.userId !== update.userId) || []
    },
    removeRemoteUserResizingBoxes: (state, update) => {
      state.remoteUserResizingBoxes = state.remoteUserResizingBoxes.filter(remoteUser => remoteUser.userId !== update.userId)
    },
    updateRemoteUserResizingBoxes: (state, update) => {
      state.remoteUserResizingBoxes = state.remoteUserResizingBoxes.filter(remoteUser => remoteUser.userId !== update.userId)
      state.remoteUserResizingBoxes = state.remoteUserResizingBoxes.concat(update)
    },

    // Minimap

    minimapIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'minimapIsVisible' })
      state.minimapIsVisible = value
    },

    // Toolbar Mode

    currentUserToolbar: (state, value) => {
      utils.typeCheck({ value, type: 'string', origin: 'currentUserToolbar' })
      state.currentUserToolbar = value
    },

    // Dragging

    currentUserIsPanningReady: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'currentUserIsPanningReady' })
      state.currentUserIsPanningReady = value
    },
    currentUserIsPanning: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'currentUserIsPanning' })
      state.currentUserIsPanning = value
    },

    // Dragging Cards

    currentUserIsDraggingCard: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'currentUserIsDraggingCard' })
      state.currentUserIsDraggingCard = value
    },
    preventDraggedCardFromShowingDetails: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'preventDraggedCardFromShowingDetails' })
      state.preventDraggedCardFromShowingDetails = value
    },
    triggeredTouchCardDragPosition: (state, cursor) => {
      state.triggeredTouchCardDragPosition = cursor
    },
    cardsWereDragged: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'cardsWereDragged' })
      state.cardsWereDragged = value
    },
    currentDraggingCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'currentDraggingCardId' })
      state.currentDraggingCardId = cardId
    },
    addToRemoteCardsDragging: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'addToRemoteCardsDragging' })
      delete update.type
      let cards = utils.clone(state.remoteCardsDragging)
      cards = cards.filter(card => card.userId !== update.userId) || []
      cards.push(update)
      state.remoteCardsDragging = cards
    },
    clearRemoteCardsDragging: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'clearRemoteCardsDragging' })
      state.remoteCardsDragging = state.remoteCardsDragging.filter(card => card.userId !== update.userId)
    },
    addToRemoteUploadDraggedOverCards: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'addToRemoteUploadDraggedOverCards' })
      delete update.type
      let cards = utils.clone(state.remoteUploadDraggedOverCards)
      cards = cards.filter(card => card.userId !== update.userId) || []
      cards.push(update)
      state.remoteUploadDraggedOverCards = cards
    },
    clearRemoteUploadDraggedOverCards: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'clearRemoteUploadDraggedOverCards' })
      state.remoteUploadDraggedOverCards = state.remoteUploadDraggedOverCards.filter(card => card.userId !== update.userId)
    },

    // Dragging Boxes

    currentDraggingBoxId: (state, boxId) => {
      utils.typeCheck({ value: boxId, type: 'string', origin: 'currentDraggingBoxId' })
      state.currentDraggingBoxId = boxId
    },
    boxesWereDragged: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'boxesWereDragged' })
      state.boxesWereDragged = value
    },
    addToRemoteBoxesDragging: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'addToRemoteBoxesDragging' })
      delete update.type
      let boxes = utils.clone(state.remoteBoxesDragging)
      boxes = boxes.filter(box => box.userId !== update.userId) || []
      boxes.push(update)
      state.remoteBoxesDragging = boxes
    },
    clearRemoteBoxesDragging: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'clearRemoteBoxesDragging' })
      state.remoteBoxesDragging = state.remoteBoxesDragging.filter(box => box.userId !== update.userId)
    },
    preventDraggedBoxFromShowingDetails: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'preventDraggedBoxFromShowingDetails' })
      state.preventDraggedBoxFromShowingDetails = value
    },

    // User Details

    userDetailsIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'userDetailsIsVisible' })
      state.userDetailsIsVisible = value
    },
    userDetailsPosition: (state, position) => {
      utils.typeCheck({ value: position, type: 'object', origin: 'userDetailsPosition' })
      state.userDetailsPosition = position
    },
    userDetailsUser: (state, user) => {
      utils.typeCheck({ value: user, type: 'object', origin: 'userDetailsUser' })
      state.userDetailsUser = user
    },

    // Tag Details

    tagDetailsIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'tagDetailsIsVisible' })
      state.tagDetailsIsVisible = value
    },
    tagDetailsIsVisibleFromTagList: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'tagDetailsIsVisibleFromTagList' })
      state.tagDetailsIsVisibleFromTagList = value
    },
    tagDetailsPosition: (state, position) => {
      utils.typeCheck({ value: position, type: 'object', origin: 'tagDetailsPosition' })
      state.tagDetailsPosition = position
    },
    tagDetailsPositionShouldUpdate: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'tagDetailsPositionShouldUpdate' })
      state.tagDetailsPositionShouldUpdate = value
    },
    currentSelectedTag: (state, tag) => {
      utils.typeCheck({ value: tag, type: 'object', origin: 'currentSelectedTag' })
      state.currentSelectedTag = tag
    },
    remoteTags: (state, tags) => {
      utils.typeCheck({ value: tags, type: 'array', origin: 'remoteTags' })
      state.remoteTags = tags
    },
    remoteTagsIsFetched: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'remoteTagsIsFetched' })
      state.remoteTagsIsFetched = value
    },

    // Link Details

    linkDetailsIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'linkDetailsIsVisible' })
      state.linkDetailsIsVisible = value
    },
    linkDetailsPosition: (state, position) => {
      utils.typeCheck({ value: position, type: 'object', origin: 'linkDetailsPosition' })
      state.linkDetailsPosition = position
    },
    currentSelectedLink: (state, link) => {
      utils.typeCheck({ value: link, type: 'object', origin: 'currentSelectedLink' })
      state.currentSelectedLink = link
    },

    // Pinned Dialogs

    sidebarIsPinned: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'sidebarIsPinned' })
      state.sidebarIsPinned = value
    },
    spaceDetailsIsPinned: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'spaceDetailsIsPinned' })
      state.spaceDetailsIsPinned = value
    },

    // Connection Details

    connectionDetailsIsVisibleForConnectionId: (state, connectionId) => {
      utils.typeCheck({ value: connectionId, type: 'string', origin: 'connectionDetailsIsVisibleForConnectionId' })
      state.connectionDetailsIsVisibleForConnectionId = connectionId
    },
    currentConnectionColor: (state, color) => {
      utils.typeCheck({ value: color, type: 'string', origin: 'currentConnectionColor' })
      state.currentConnectionColor = color
    },
    connectionDetailsPosition: (state, position) => {
      utils.typeCheck({ value: position, type: 'object', origin: 'connectionDetailsPosition' })
      state.connectionDetailsPosition = position
    },
    triggeredDrawConnectionFrame: (state, cursor) => {
      state.triggeredDrawConnectionFrame = cursor
    },
    addToRemoteConnectionDetailsVisible: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'addToRemoteConnectionDetailsVisible' })
      delete update.type
      let connections = utils.clone(state.remoteConnectionDetailsVisible)
      connections = connections.filter(connection => connection.userId !== update.userId) || []
      connections.push(update)
      state.remoteConnectionDetailsVisible = connections
    },
    clearRemoteConnectionDetailsVisible: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'clearRemoteConnectionDetailsVisible' })
      state.remoteConnectionDetailsVisible = state.remoteConnectionDetailsVisible.filter(connection => connection.userId !== update.userId)
    },

    // Multiple Selection

    multipleSelectedActionsIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'multipleSelectedActionsIsVisible' })
      state.multipleSelectedActionsIsVisible = value
    },
    preventMultipleSelectedActionsIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'preventMultipleSelectedActionsIsVisible' })
      state.preventMultipleSelectedActionsIsVisible = value
    },
    multipleSelectedActionsPosition: (state, position) => {
      utils.typeCheck({ value: position, type: 'object', origin: 'multipleSelectedActionsPosition' })
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
    newTweetCards: (state, cards) => {
      utils.typeCheck({ value: cards, type: 'array', origin: 'newTweetCards' })
      state.newTweetCards = cards
    },
    clearNewTweetCards: (state) => {
      state.prevNewTweetCards = state.newTweetCards
      state.newTweetCards = []
    },

    // multiple cards

    multipleCardsSelectedIds: (state, cardIds) => {
      utils.typeCheck({ value: cardIds, type: 'array', origin: 'multipleCardsSelectedIds' })
      state.multipleCardsSelectedIds = cardIds
    },
    addToMultipleCardsSelected: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'addToMultipleCardsSelected' })
      state.multipleCardsSelectedIds.push(cardId)
    },
    removeFromMultipleCardsSelected: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'removeFromMultipleCardsSelected' })
      state.multipleCardsSelectedIds = state.multipleCardsSelectedIds.filter(id => {
        return id !== cardId
      })
    },
    multipleConnectionsSelectedIds: (state, connectionIds) => {
      utils.typeCheck({ value: connectionIds, type: 'array', origin: 'multipleConnectionsSelectedIds' })
      state.multipleConnectionsSelectedIds = connectionIds
    },
    addToRemoteCardsSelected: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'addToRemoteCardsSelected' })
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
      utils.typeCheck({ value: update, type: 'object', origin: 'removeFromRemoteCardsSelected' })
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
      utils.typeCheck({ value: cardIds, type: 'array', origin: 'previousMultipleCardsSelectedIds' })
      state.previousMultipleCardsSelectedIds = cardIds
    },

    // muiltiple connections

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
      state.multipleConnectionsSelectedIds.push(connectionId)
    },
    removeFromMultipleConnectionsSelected: (state, connectionId) => {
      utils.typeCheck({ value: connectionId, type: 'string', origin: 'removeFromMultipleConnectionsSelected' })
      state.multipleConnectionsSelectedIds = state.multipleConnectionsSelectedIds.filter(id => {
        return id !== connectionId
      })
    },
    addToRemoteConnectionsSelected: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'addToRemoteConnectionsSelected' })
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
      utils.typeCheck({ value: update, type: 'object', origin: 'removeFromRemoteConnectionsSelected' })
      delete update.type
      state.remoteConnectionsSelected = state.remoteConnectionsSelected.filter(connection => {
        const connectionIsSelected = connection.connectionId === update.connectionId
        const selectedByUser = connection.userId === update.userId
        const connectionIsUpdate = connectionIsSelected && selectedByUser
        return !connectionIsUpdate
      })
    },
    clearRemoteMultipleSelected: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'clearRemoteMultipleSelected' })
      const user = update.user || update.updates.user
      state.remoteCardsSelected = state.remoteCardsSelected.filter(card => card.userId !== user.id)
      state.remoteConnectionsSelected = state.remoteConnectionsSelected.filter(connection => connection.userId !== user.id)
      state.remoteBoxesSelected = state.remoteBoxesSelected.filter(box => box.userId !== user.id)
    },
    previousMultipleConnectionsSelectedIds: (state, connectionIds) => {
      utils.typeCheck({ value: connectionIds, type: 'array', origin: 'previousMultipleConnectionsSelectedIds' })
      state.previousMultipleConnectionsSelectedIds = connectionIds
    },

    // multiple boxes

    multipleBoxesSelectedIds: (state, cardIds) => {
      utils.typeCheck({ value: cardIds, type: 'array', origin: 'multipleBoxesSelectedIds' })
      state.multipleBoxesSelectedIds = cardIds
    },
    addToMultipleBoxesSelected: (state, boxId) => {
      utils.typeCheck({ value: boxId, type: 'string', origin: 'addToMultipleBoxesSelected' })
      state.multipleBoxesSelectedIds.push(boxId)
    },
    removeFromMultipleBoxesSelected: (state, boxId) => {
      utils.typeCheck({ value: boxId, type: 'string', origin: 'removeFromMultipleBoxesSelected' })
      state.multipleBoxesSelectedIds = state.multipleBoxesSelectedIds.filter(id => {
        return id !== boxId
      })
    },
    previousMultipleBoxesSelectedIds: (state, boxIds) => {
      utils.typeCheck({ value: boxIds, type: 'array', origin: 'previousMultipleBoxesSelectedIds' })
      state.previousMultipleBoxesSelectedIds = boxIds
    },
    addToRemoteBoxesSelected: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'addToRemoteBoxesSelected' })
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
      utils.typeCheck({ value: update, type: 'object', origin: 'removeFromRemoteBoxesSelected' })
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

    // Loading

    isLoadingSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'isLoadingSpace' })
      state.isLoadingSpace = value
    },
    isJoiningSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'isJoiningSpace' })
      state.isJoiningSpace = value
    },
    addToSpaceCollaboratorKeys: (state, spaceCollaboratorKey) => {
      utils.typeCheck({ value: spaceCollaboratorKey, type: 'object', origin: 'addToSpaceCollaboratorKeys' })
      state.spaceCollaboratorKeys.push(spaceCollaboratorKey) // { spaceId, collaboratorKey }
    },
    updateRemotePendingUploads: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'updateRemotePendingUploads' })
      delete update.type
      const existingUpload = state.remotePendingUploads.find(item => {
        const card = item.cardId === update.cardId
        const space = item.spaceId === update.spaceId
        return card || space
      })
      if (existingUpload) {
        state.remotePendingUploads = state.remotePendingUploads.map(item => {
          console.log('item', item, item.id, existingUpload.id, item.id === existingUpload.id)
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
    hasRestoredFavorites: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'hasRestoredFavorites' })
      state.hasRestoredFavorites = value
    },
    loadSpaceShowDetailsForCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'loadSpaceShowDetailsForCardId' })
      state.loadSpaceShowDetailsForCardId = cardId
    },
    spaceUrlToLoad: (state, spaceUrl) => {
      utils.typeCheck({ value: spaceUrl, type: 'string', origin: 'spaceUrlToLoad' })
      state.spaceUrlToLoad = spaceUrl
    },

    // Notifications

    addNotification: (state, notification) => {
      notification.id = nanoid()
      state.notifications.push(notification)
    },
    removeNotification: (state) => {
      state.notifications.shift()
    },
    clearAllNotifications: (state) => {
      state.notifyConnectionError = false
      state.notifyServerCouldNotSave = false
      state.notifySignUpToEditSpace = false
      state.notifyCardsCreatedIsNearLimit = false
      state.notifyCardsCreatedIsOverLimit = false
      state.notifyMoveOrCopyToSpace = false
      state.notificationsWithPosition = []
    },
    notifySpaceNotFound: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifySpaceNotFound' })
      state.notifySpaceNotFound = value
    },
    notifyConnectionError: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifyConnectionError' })
      state.notifyConnectionError = value
    },
    notifyServerCouldNotSave: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifyServerCouldNotSave' })
      state.notifyServerCouldNotSave = value
    },
    notifySpaceIsRemoved: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifySpaceIsRemoved' })
      state.notifySpaceIsRemoved = value
    },
    notifyCurrentSpaceIsNowRemoved: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifyCurrentSpaceIsNowRemoved' })
      state.notifyCurrentSpaceIsNowRemoved = value
    },
    notifySignUpToEditSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifySignUpToEditSpace' })
      state.notifySignUpToEditSpace = value
    },
    notifyCardsCreatedIsNearLimit: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifyCardsCreatedIsNearLimit' })
      state.notifyCardsCreatedIsNearLimit = value
    },
    notifyCardsCreatedIsOverLimit: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifyCardsCreatedIsOverLimit' })
      state.notifyCardsCreatedIsOverLimit = value
      if (value === true) {
        state.notifyCardsCreatedIsNearLimit = false
      }
    },
    notifyKinopioUpdatesAreAvailable: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifyKinopioUpdatesAreAvailable' })
      state.notifyKinopioUpdatesAreAvailable = value
    },
    notifyMoveOrCopyToSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifyMoveOrCopyToSpace' })
      state.notifyMoveOrCopyToSpace = value
    },
    notifyMoveOrCopyToSpaceDetails: (state, value) => {
      utils.typeCheck({ value, type: 'object', origin: 'notifyMoveOrCopyToSpaceDetails' })
      state.notifyMoveOrCopyToSpaceDetails = value
    },
    hasNotifiedPressAndHoldToDrag: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'hasNotifiedPressAndHoldToDrag' })
      state.hasNotifiedPressAndHoldToDrag = value
    },
    notifySpaceIsHidden: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifySpaceIsHidden' })
      state.notifySpaceIsHidden = value
    },
    notifyThanksForDonating: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifyThanksForDonating' })
      state.notifyThanksForDonating = value
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
    },
    addToFilteredConnectionTypeId: (state, id) => {
      utils.typeCheck({ value: id, type: 'string', origin: 'addToFilteredConnectionTypeId' })
      state.filteredConnectionTypeIds.push(id)
    },
    removeFromFilteredConnectionTypeId: (state, id) => {
      utils.typeCheck({ value: id, type: 'string', origin: 'addToFilteredConnectionTypeId' })
      state.filteredConnectionTypeIds = state.filteredConnectionTypeIds.filter(typeId => typeId !== id)
    },
    addToFilteredFrameIds: (state, id) => {
      utils.typeCheck({ value: id, type: 'number', origin: 'addToFilteredFrameIds' })
      state.filteredFrameIds.push(id)
    },
    removeFromFilteredFrameIds: (state, id) => {
      utils.typeCheck({ value: id, type: 'number', origin: 'removeFromFilteredFrameIds' })
      state.filteredFrameIds = state.filteredFrameIds.filter(frameId => frameId !== id)
    },
    addToFilteredTagNames: (state, name) => {
      utils.typeCheck({ value: name, type: 'string', origin: 'addToFilteredTagNames' })
      state.filteredTagNames.push(name)
    },
    removeFromFilteredTagNames: (state, name) => {
      utils.typeCheck({ value: name, type: 'string', origin: 'removeFromFilteredTagNames' })
      state.filteredTagNames = state.filteredTagNames.filter(tagName => tagName !== name)
    },

    // Session Data

    updateOtherUsers: (state, updatedUser) => {
      if (!updatedUser) { return }
      utils.typeCheck({ value: updatedUser, type: 'object', origin: 'updateOtherUsers' })
      let users = utils.clone(state.otherUsers)
      users = users.filter(Boolean)
      users = users.filter(user => {
        if (user.id !== updatedUser.id) {
          return user
        }
      })
      users.push(updatedUser)
      state.otherUsers = users
    },
    updateOtherSpaces: (state, updatedSpace) => {
      utils.typeCheck({ value: updatedSpace, type: 'object', origin: 'updateOtherSpaces' })
      let spaces = utils.clone(state.otherSpaces)
      spaces = spaces.filter(space => {
        if (space.id !== updatedSpace.id) {
          return space
        }
      })
      spaces.push(updatedSpace)
      state.otherSpaces = spaces
    },
    otherTags: (state, remoteTags) => {
      remoteTags = uniqBy(remoteTags, 'name')
      state.otherTags = remoteTags
    }
  },

  actions: {
    updateSpaceAndCardUrlToLoad: (context, path) => {
      const matches = utils.spaceAndCardIdFromUrl(path)
      if (!matches) { return }
      if (matches.cardId) {
        context.commit('loadSpaceShowDetailsForCardId', matches.cardId)
      }
      context.commit('spaceUrlToLoad', matches.spaceUrl)
    },
    updatePageSizes: (context) => {
      const padding = 250
      const cards = context.getters['currentCards/all']
      const boxes = context.getters['currentBoxes/all']
      const items = cards.concat(boxes)
      let itemsRect = utils.boundaryRectFromItems(items)
      itemsRect = {
        width: itemsRect.x + itemsRect.width + padding,
        height: itemsRect.y + itemsRect.height + padding
      }
      context.commit('updatePageSizes', itemsRect)
    },
    checkIfItemShouldIncreasePageSize: (context, item) => {
      if (!item) { return }
      item = utils.clone(item)
      item.width = item.width || item.resizeWidth
      item.height = item.height || item.resizeHeight
      const zoom = context.getters.spaceZoomDecimal
      let thresholdHeight = (context.state.viewportHeight * zoom) / 4
      let thresholdWidth = (context.state.viewportWidth * zoom) / 4
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
      origin = origin || 'Store.closeAllDialogs'
      context.commit('closeAllDialogs', origin)
      const space = utils.clone(context.rootState.currentSpace)
      const user = utils.clone(context.rootState.currentUser)
      context.commit('broadcast/updateUser', { user: utils.userMeta(user, space), type: 'updateUserPresence' }, { root: true })
      context.commit('broadcast/updateStore', { updates: { userId: user.id }, type: 'clearRemoteCardDetailsVisible' })
      context.commit('broadcast/updateStore', { updates: { userId: user.id }, type: 'clearRemoteConnectionDetailsVisible' })
      context.commit('broadcast/updateStore', { updates: { userId: user.id }, type: 'clearRemoteBoxDetailsVisible' })
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
      utils.typeCheck({ value: cardId, type: 'string', origin: 'addToMultipleCardsSelected' })
      if (context.state.multipleCardsSelectedIds.includes(cardId)) { return }
      context.commit('addToMultipleCardsSelected', cardId)
      const updates = {
        userId: context.rootState.currentUser.id,
        cardId
      }
      context.commit('broadcast/updateStore', { updates, type: 'addToRemoteCardsSelected' }, { root: true })
    },
    removeFromMultipleCardsSelected: (context, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'removeFromMultipleCardsSelected' })
      if (!context.state.multipleCardsSelectedIds.includes(cardId)) { return }
      context.commit('removeFromMultipleCardsSelected', cardId)
      const updates = {
        userId: context.rootState.currentUser.id,
        cardId
      }
      context.commit('broadcast/updateStore', { updates, type: 'removeFromRemoteCardsSelected' }, { root: true })
    },
    multipleCardsSelectedIds: (context, cardIds) => {
      utils.typeCheck({ value: cardIds, type: 'array', origin: 'multipleCardsSelectedIds' })
      context.commit('multipleCardsSelectedIds', cardIds)
      const updates = {
        userId: context.rootState.currentUser.id,
        cardIds
      }
      context.commit('broadcast/updateStore', { updates, type: 'updateRemoteCardsSelected' }, { root: true })
    },
    multipleBoxesSelectedIds: (context, boxIds) => {
      utils.typeCheck({ value: boxIds, type: 'array', origin: 'multipleBoxesSelectedIds' })
      context.commit('multipleBoxesSelectedIds', boxIds)
      const updates = {
        userId: context.rootState.currentUser.id,
        boxIds
      }
      context.commit('broadcast/updateStore', { updates, type: 'updateRemoteBoxesSelected' }, { root: true })
    },
    clearMultipleSelected: (context) => {
      if (context.state.multipleCardsSelectedIds.length || context.state.multipleConnectionsSelectedIds.length || context.state.multipleBoxesSelectedIds.length) {
        context.commit('clearMultipleSelected')
      }
      const space = context.rootState.currentSpace
      const user = context.rootState.currentUser
      context.commit('broadcast/updateStore', { user: utils.userMeta(user, space), type: 'clearRemoteMultipleSelected' }, { root: true })
    },
    toggleMultipleConnectionsSelected: (context, connectionId) => {
      utils.typeCheck({ value: connectionId, type: 'string', origin: 'toggleMultipleConnectionsSelected' })
      const previousMultipleConnectionsSelectedIds = context.state.previousMultipleConnectionsSelectedIds
      const connectionIsSelected = previousMultipleConnectionsSelectedIds.includes(connectionId)
      if (connectionIsSelected) {
        context.dispatch('removeFromMultipleConnectionsSelected', connectionId)
      } else {
        context.dispatch('addToMultipleConnectionsSelected', connectionId)
      }
    },
    addToMultipleConnectionsSelected: (context, connectionId) => {
      utils.typeCheck({ value: connectionId, type: 'string', origin: 'addToMultipleConnectionsSelected' })
      if (context.state.multipleConnectionsSelectedIds.includes(connectionId)) { return }
      context.commit('addToMultipleConnectionsSelected', connectionId)
      const updates = {
        userId: context.rootState.currentUser.id,
        connectionId
      }
      context.commit('broadcast/updateStore', { updates, type: 'addToRemoteConnectionsSelected' }, { root: true })
    },
    removeFromMultipleConnectionsSelected: (context, connectionId) => {
      utils.typeCheck({ value: connectionId, type: 'string', origin: 'removeFromMultipleConnectionsSelected' })
      if (!context.state.multipleConnectionsSelectedIds.includes(connectionId)) { return }
      context.commit('removeFromMultipleConnectionsSelected', connectionId)
      const updates = {
        userId: context.rootState.currentUser.id,
        connectionId
      }
      context.commit('broadcast/updateStore', { updates, type: 'removeFromRemoteConnectionsSelected' }, { root: true })
    },
    multipleConnectionsSelectedIds: (context, connectionIds) => {
      utils.typeCheck({ value: connectionIds, type: 'array', origin: 'multipleConnectionsSelectedIds' })
      context.commit('multipleConnectionsSelectedIds', connectionIds)
      const updates = {
        userId: context.rootState.currentUser.id,
        connectionIds
      }
      context.commit('broadcast/updateStore', { updates, type: 'updateRemoteConnectionsSelected' }, { root: true })
    },
    connectionDetailsIsVisibleForConnectionId: (context, connectionId) => {
      context.commit('connectionDetailsIsVisibleForConnectionId', connectionId)
      const updates = {
        userId: context.rootState.currentUser.id,
        connectionId
      }
      context.commit('broadcast/updateStore', { updates, type: 'addToRemoteConnectionDetailsVisible' }, { root: true })
    },
    addToMultipleBoxesSelected: (context, boxId) => {
      utils.typeCheck({ value: boxId, type: 'string', origin: 'addToMultipleBoxesSelected' })
      if (context.state.multipleBoxesSelectedIds.includes(boxId)) { return }
      context.commit('addToMultipleBoxesSelected', boxId)
      const updates = {
        userId: context.rootState.currentUser.id,
        boxId
      }
      context.commit('broadcast/updateStore', { updates, type: 'addToRemoteBoxesSelected' }, { root: true })
    },
    removeFromMultipleBoxesSelected: (context, boxId) => {
      utils.typeCheck({ value: boxId, type: 'string', origin: 'removeFromMultipleBoxesSelected' })
      if (!context.state.multipleBoxesSelectedIds.includes(boxId)) { return }
      context.commit('removeFromMultipleBoxesSelected', boxId)
      const updates = {
        userId: context.rootState.currentUser.id,
        boxId
      }
      context.commit('broadcast/updateStore', { updates, type: 'removeFromRemoteBoxesSelected' }, { root: true })
    },

    // Pinned Dialogs

    sidebarIsPinned: (context, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'sidebarIsPinned' })
      context.commit('sidebarIsPinned', value)
    },
    spaceDetailsIsPinned: (context, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'spaceDetailsIsPinned' })
      context.commit('spaceDetailsIsPinned', value)
    }
  },
  getters: {
    shouldScrollAtEdges: (state, getters) => (event) => {
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
      const otherUsers = state.otherUsers.filter(Boolean)
      const user = otherUsers.find(otherUser => otherUser.id === userId)
      return user
    },
    otherSpaceById: (state, getters) => (spaceId) => {
      const otherSpaces = state.otherSpaces.filter(Boolean)
      const space = otherSpaces.find(otherSpace => otherSpace.id === spaceId)
      return space
    },
    cachedOrOtherSpaceById: (state, getters) => (spaceId) => {
      const currentSpace = state.currentSpace
      const cachedSpace = cache.space(spaceId)
      if (spaceId === currentSpace.id) {
        return utils.clone(currentSpace)
      } else if (utils.objectHasKeys(cachedSpace)) {
        return cachedSpace
      } else {
        return getters.otherSpaceById(spaceId)
      }
    },
    spaceZoomDecimal: (state) => {
      return state.spaceZoomPercent / 100
    },
    spaceCounterZoomDecimal: (state, getters) => {
      return 1 / getters.spaceZoomDecimal
    },
    isTouchDevice: (state) => {
      return state.isTouchDevice || utils.isMobile()
    },
    transformZoom: (state, getters) => {
      const zoom = getters.spaceZoomDecimal
      const origin = state.zoomOrigin
      // https://stackoverflow.com/questions/51077632/simulating-transform-origin-using-translate
      // let transform
      // if (zoom !== 1) {
      // transform = `translate(${origin.x}px, ${origin.y}px) scale(${zoom}) translate(-${origin.x}px, -${origin.y}px)`
      // } else {
      // temp, doesn't handle both zoom and touch scroll together,
      // new var for touchScrollCursorPosition
      const transform = `translate(${origin.x}px, ${origin.y}px) scale(${zoom})`
      // }

      return transform
    }
  },

  modules: {
    api,
    broadcast,
    history,
    currentUser,
    currentSpace,
    currentCards,
    currentConnections,
    currentBoxes,
    upload
  },
  plugins: [websocket()]
})

export default store
