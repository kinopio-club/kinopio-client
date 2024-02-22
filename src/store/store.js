import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'
import postMessage from '@/postMessage.js'
// store modules
import themes from '@/store/themes.js'
import api from '@/store/api.js'
import broadcast from '@/store/broadcast.js'
import history from '@/store/history.js'
import currentUser from '@/store/currentUser.js'
import currentSpace from '@/store/currentSpace.js'
import currentCards from '@/store/currentCards.js'
import currentConnections from '@/store/currentConnections.js'
import currentBoxes from '@/store/currentBoxes.js'
import upload from '@/store/upload.js'
import userNotifications from '@/store/userNotifications.js'
// store plugins
import websocket from '@/store/plugins/websocket.js'

import { createStore } from 'vuex'
import { nanoid } from 'nanoid'
import uniqBy from 'lodash-es/uniqBy'
import last from 'lodash-es/last'

const store = createStore({
  strict: import.meta.env.MODE !== 'production',
  state: {
    pageHeight: 0,
    pageWidth: 0,
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
    isEmbedMode: false,
    isAddPage: false,
    disableViewportOptimizations: false, // for urlbox
    isPresentationMode: false,
    pricingIsVisible: false,
    userSettingsIsVisible: false,
    offlineIsVisible: false,
    isFadingOutDuringTouch: false,
    prevSpaceIdInSession: '',
    outsideSpaceBackgroundColor: '',

    // zoom and scroll
    spaceZoomPercent: 100,
    pinchCounterZoomDecimal: 1,
    windowScroll: {},
    zoomOrigin: { x: 0, y: 0 },

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
    currentUserIsPanningReady: false,
    currentUserIsPanning: false,
    currentUserToolbar: 'card', // card, box
    currentUserIsDraggingConnectionIdLabel: '',

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
    embedIsVisibleForCardId: '',
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
    currentDraggingConnectedCardIds: [],
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
    previousMultipleBoxesSelectedIds: [],

    // connections
    currentConnectionStartCardIds: [],
    currentConnectionSuccess: {},
    currentConnectionCursorStart: {},
    connectionDetailsPosition: {}, // x, y, pageX, pageY
    connectionDetailsIsVisibleForConnectionId: '',
    currentConnectionColor: '',
    remoteConnectionDetailsVisible: [],
    remoteCurrentConnections: [],
    currentCardConnections: [],
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

    // other items (links)
    otherCardDetailsIsVisible: false,
    otherItemDetailsPosition: {}, // x, y
    currentSelectedOtherItem: {},

    // pinned dialogs
    spaceDetailsIsPinned: false,
    sidebarIsPinned: false,
    searchIsPinned: false,
    userSettingsIsPinned: false,

    // loading
    isLoadingSpace: false,
    isJoiningSpace: false, // broadcast
    isLoadingOtherItems: false,
    spaceUrlToLoad: '',
    spaceReadOnlyKey: {}, //  { spaceId, key }
    spaceCollaboratorKeys: [],
    remotePendingUploads: [],
    isLoadingFavorites: false,
    loadSpaceShowDetailsForCardId: '',
    loadJournalSpace: false,
    loadJournalSpaceTomorrow: false,
    loadNewSpace: false,
    urlPreviewLoadingForCardIds: [],
    loadInboxSpace: false,
    shouldResetDimensionsOnLoad: false,
    shouldShowExploreOnLoad: false,

    // referral
    validateUserReferralUserId: '',
    shouldValidateUserReferralFromSpaceInvite: false,
    validateAdvocateReferralName: '',
    validateFromAdvocateReferralName: '',

    // notifications
    notifications: [],
    notifySpaceNotFound: false,
    notifyConnectionError: false,
    notifyConnectionErrorName: '',
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
    notifyThanksForUpgrading: false,
    notifyReferralSuccessUser: null,
    notifyEarnedCredits: false,
    notifyReferralSuccessReferrerName: null,

    // notifications with position
    notificationsWithPosition: [],

    // filters
    filteredConnectionTypeIds: [],
    filteredFrameIds: [],
    filteredTagNames: [],
    spaceListFilterInfo: {},

    // session data
    otherUsers: [], // { id, name color }
    otherItems: { spaces: [], cards: [] },
    otherTags: [],

    // codeblocks

    codeLanguagePickerIsVisible: false,
    codeLanguagePickerPosition: {}, // x, y
    codeLanguagePickerCardId: ''

  },
  mutations: {
    resetPageSizes: (state) => {
      state.pageWidth = 0
      state.pageHeight = 0
    },
    updatePageSizes: (state, itemsRect) => {
      if (!itemsRect) { return }
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
      utils.typeCheck({ value: height, type: 'number' })
      state.pageHeight = height
    },
    pageWidth: (state, width) => {
      utils.typeCheck({ value: width, type: 'number' })
      state.pageWidth = width
    },
    closeAllDialogs: (state) => {
      let dialogs = document.querySelectorAll('dialog')
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
    loadJournalSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.loadJournalSpace = value
    },
    loadJournalSpaceTomorrow: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.loadJournalSpaceTomorrow = value
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
    validateUserReferralUserId: (state, userId) => {
      utils.typeCheck({ value: userId, type: 'string' })
      state.validateUserReferralUserId = userId
    },
    shouldValidateUserReferralFromSpaceInvite: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.shouldValidateUserReferralFromSpaceInvite = value
    },
    validateAdvocateReferralName: (state, value) => {
      utils.typeCheck({ value, type: 'string' })
      state.validateAdvocateReferralName = value
    },
    validateFromAdvocateReferralName: (state, value) => {
      utils.typeCheck({ value, type: 'string' })
      state.validateFromAdvocateReferralName = value
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
    newStuffIsUpdated: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.newStuffIsUpdated = value
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
    windowScroll: (state, value) => {
      utils.typeCheck({ value, type: 'object' })
      state.windowScroll = value
    },
    zoomOrigin: (state, value) => {
      state.zoomOrigin = value
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
    disableViewportOptimizations: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', allowUndefined: true })
      state.disableViewportOptimizations = value
    },
    isPresentationMode: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.isPresentationMode = value
    },
    pricingIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.pricingIsVisible = value
    },
    userSettingsIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.userSettingsIsVisible = value
    },
    offlineIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.offlineIsVisible = value
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
    outsideSpaceBackgroundColor: (state, value) => {
      utils.typeCheck({ value, type: 'string' })
      state.outsideSpaceBackgroundColor = value
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
    triggerUpdateMagicPaintPositionOffset: () => {},
    triggerPaintFramePosition: (state, event) => {},
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
    triggerEarnCreditsIsVisible: () => {},
    triggerImportIsVisible: () => {},
    triggerSelectAllItemsBelowCursor: (state, position) => {},
    triggerSplitCard: (state, cardId) => {},
    triggerUpdateUrlPreview: (state, cardId) => {},
    triggerUpdateUrlPreviewComplete: (state, cardId) => {},
    triggerRemovedIsVisible: () => {},
    triggerAIImagesIsVisible: () => {},
    triggerClearAllSpaceFilters: () => {},
    triggerScrollUserDetailsIntoView: () => {},
    triggerUpdateLockedItemButtonsPositions: () => {},
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
    triggerAddSpaceIsVisible: () => {},
    triggerOfflineIsVisible: () => {},
    triggerAppsAndExtensionsIsVisible: () => {},
    triggerUpdateWindowTitle: () => {},
    triggerRestoreSpaceRemoteComplete: () => {},
    triggerCheckIfShouldNotifySpaceOutOfSync: () => {},

    // Used by extensions only

    triggerSelectedCardsContainInBox: () => {},
    triggerSelectedItemsAlignLeft: () => {},

    // Cards

    shouldAddCard: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.shouldAddCard = value
    },
    currentUserIsHoveringOverCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string' })
      state.currentUserIsHoveringOverCardId = cardId
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
    embedIsVisibleForCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string' })
      state.embedIsVisibleForCardId = cardId
    },

    // Connections

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
    currentConnectionStartCardIds: (state, cardIds) => {
      utils.typeCheck({ value: cardIds, type: 'array' })
      state.currentConnectionStartCardIds = cardIds
    },
    updateRemoteCurrentConnection: (state, updates) => {
      utils.typeCheck({ value: updates, type: 'object' })
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
    currentUserBoxSelectEnd: (state, object) => {
      utils.typeCheck({ value: object, type: 'object' })
      state.currentUserBoxSelectEnd = object
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
    currentDraggingConnectedCardIds: (state, cardIds) => {
      utils.typeCheck({ value: cardIds, type: 'array' })
      state.currentDraggingConnectedCardIds = cardIds
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
    newTweetCards: (state, cards) => {
      utils.typeCheck({ value: cards, type: 'array' })
      state.newTweetCards = cards
    },
    clearNewTweetCards: (state) => {
      state.prevNewTweetCards = state.newTweetCards
      state.newTweetCards = []
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
    removeFromMultipleCardsSelected: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string' })
      state.multipleCardsSelectedIds = state.multipleCardsSelectedIds.filter(id => {
        return id !== cardId
      })
    },
    multipleConnectionsSelectedIds: (state, connectionIds) => {
      utils.typeCheck({ value: connectionIds, type: 'array' })
      state.multipleConnectionsSelectedIds = connectionIds
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

    multipleBoxesSelectedIds: (state, cardIds) => {
      utils.typeCheck({ value: cardIds, type: 'array' })
      state.multipleBoxesSelectedIds = cardIds
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
    isLoadingFavorites: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.isLoadingFavorites = value
    },
    loadSpaceShowDetailsForCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string' })
      state.loadSpaceShowDetailsForCardId = cardId
    },
    spaceUrlToLoad: (state, spaceUrl) => {
      utils.typeCheck({ value: spaceUrl, type: 'string' })
      state.spaceUrlToLoad = spaceUrl
    },
    spaceReadOnlyKey: (state, value) => {
      utils.typeCheck({ value, type: 'object' })
      state.spaceReadOnlyKey = value
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
      state.notifyCardsCreatedIsNearLimit = false
      state.notifyCardsCreatedIsOverLimit = false
      state.notifyMoveOrCopyToSpace = false
      state.notificationsWithPosition = []
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
    notifyKinopioUpdatesAreAvailable: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.notifyKinopioUpdatesAreAvailable = value
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
    notifyReferralSuccessUser: (state, user) => {
      utils.typeCheck({ value: user, type: 'object' })
      state.notifyReferralSuccessUser = user
    },
    notifyEarnedCredits: (state, user) => {
      utils.typeCheck({ value: user, type: 'boolean' })
      state.notifyEarnedCredits = user
    },
    notifyReferralSuccessReferrerName: (state, user) => {
      utils.typeCheck({ value: user, type: 'boolean' })
      state.notifyReferralSuccessReferrerName = user
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

    // Session Data

    updateOtherUsers: (state, updatedUser) => {
      if (!updatedUser) { return }
      utils.typeCheck({ value: updatedUser, type: 'object' })
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
    updateOtherItems: (state, { cards, spaces }) => {
      utils.typeCheck({ value: cards, type: 'array' })
      utils.typeCheck({ value: spaces, type: 'array' })
      let otherItems = utils.clone(state.otherItems)
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
      state.otherItems.cards = state.otherItems.cards.map(card => {
        if (card.id === id) {
          card.name = name
        }
        return card
      })
    },
    otherTags: (state, remoteTags) => {
      remoteTags = uniqBy(remoteTags, 'name')
      state.otherTags = remoteTags
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
    }

  },

  actions: {
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
    updateSpaceAndCardUrlToLoad: (context, path) => {
      const matches = utils.spaceAndCardIdFromPath(path)
      if (!matches) { return }
      if (matches.cardId) {
        context.commit('loadSpaceShowDetailsForCardId', matches.cardId)
      }
      context.commit('spaceUrlToLoad', matches.spaceUrl)
    },
    updatePageSizes: (context) => {
      const cards = context.getters['currentCards/all']
      const boxes = context.getters['currentBoxes/all']
      let items = cards.concat(boxes)
      items.shift({
        x: 0, y: 0, width: 500, height: 500
      })
      let itemsRect = utils.pageSizeFromItems(items)
      context.commit('resetPageSizes')
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
      context.commit('passwordResetIsVisible', false)
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
      utils.typeCheck({ value: cardId, type: 'string' })
      if (context.state.multipleCardsSelectedIds.includes(cardId)) { return }
      context.commit('addToMultipleCardsSelected', cardId)
      const updates = {
        userId: context.rootState.currentUser.id,
        cardId
      }
      context.commit('broadcast/updateStore', { updates, type: 'addToRemoteCardsSelected' }, { root: true })
    },
    removeFromMultipleCardsSelected: (context, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string' })
      if (!context.state.multipleCardsSelectedIds.includes(cardId)) { return }
      context.commit('removeFromMultipleCardsSelected', cardId)
      const updates = {
        userId: context.rootState.currentUser.id,
        cardId
      }
      context.commit('broadcast/updateStore', { updates, type: 'removeFromRemoteCardsSelected' }, { root: true })
    },
    multipleCardsSelectedIds: (context, cardIds) => {
      utils.typeCheck({ value: cardIds, type: 'array' })
      context.commit('multipleCardsSelectedIds', cardIds)
      const updates = {
        userId: context.rootState.currentUser.id,
        cardIds
      }
      context.commit('broadcast/updateStore', { updates, type: 'updateRemoteCardsSelected' }, { root: true })
    },
    multipleBoxesSelectedIds: (context, boxIds) => {
      utils.typeCheck({ value: boxIds, type: 'array' })
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
      utils.typeCheck({ value: connectionId, type: 'string' })
      if (context.state.multipleConnectionsSelectedIds.includes(connectionId)) { return }
      context.commit('addToMultipleConnectionsSelected', connectionId)
      const updates = {
        userId: context.rootState.currentUser.id,
        connectionId
      }
      context.commit('broadcast/updateStore', { updates, type: 'addToRemoteConnectionsSelected' }, { root: true })
    },
    removeFromMultipleConnectionsSelected: (context, connectionId) => {
      utils.typeCheck({ value: connectionId, type: 'string' })
      if (!context.state.multipleConnectionsSelectedIds.includes(connectionId)) { return }
      context.commit('removeFromMultipleConnectionsSelected', connectionId)
      const updates = {
        userId: context.rootState.currentUser.id,
        connectionId
      }
      context.commit('broadcast/updateStore', { updates, type: 'removeFromRemoteConnectionsSelected' }, { root: true })
    },
    multipleConnectionsSelectedIds: (context, connectionIds) => {
      utils.typeCheck({ value: connectionIds, type: 'array' })
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
      utils.typeCheck({ value: boxId, type: 'string' })
      if (context.state.multipleBoxesSelectedIds.includes(boxId)) { return }
      context.commit('addToMultipleBoxesSelected', boxId)
      const updates = {
        userId: context.rootState.currentUser.id,
        boxId
      }
      context.commit('broadcast/updateStore', { updates, type: 'addToRemoteBoxesSelected' }, { root: true })
    },
    removeFromMultipleBoxesSelected: (context, boxId) => {
      utils.typeCheck({ value: boxId, type: 'string' })
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
      utils.typeCheck({ value, type: 'boolean' })
      context.commit('sidebarIsPinned', value)
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

    updateWindowScroll: (context) => {
      context.commit('windowScroll', { x: window.scrollX, y: window.scrollY })
    },
    zoomOrigin: (context, origin) => {
      utils.typeCheck({ value: origin, type: 'object' })
      const prevOrigin = context.state.zoomOrigin
      const zoomOriginIsZero = !utils.objectHasKeys(prevOrigin) || prevOrigin === { x: 0, y: 0 }
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
    }
  },
  getters: {
    isSpacePage: (state) => {
      if (window.location.pathname === '/add') { return }
      return !state.isAddPage
    },
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
      const otherSpaces = state.otherItems.spaces.filter(Boolean)
      const space = otherSpaces.find(otherSpace => otherSpace.id === spaceId)
      return space
    },
    otherCardById: (state, getters) => (cardId) => {
      const otherCards = state.otherItems.cards.filter(Boolean)
      const card = otherCards.find(otherCard => otherCard.id === cardId)
      return card
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
    spaceIsNotCached: (state) => (spaceId) => {
      const spaceCardsCount = cache.space(spaceId).cards?.length
      return Boolean(!spaceCardsCount)
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
    windowScrollWithSpaceOffset: (state) => {
      let scroll = state.windowScroll
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
    }
  },

  modules: {
    themes,
    api,
    broadcast,
    history,
    currentUser,
    currentSpace,
    currentCards,
    currentConnections,
    currentBoxes,
    upload,
    userNotifications
  },
  plugins: [websocket()]
})

export default store
