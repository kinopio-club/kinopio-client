<template lang="pug">
article#card(
  :style="positionStyles"
  :data-card-id="id"
  :data-is-hidden-by-comment-filter="isCardHiddenByCommentFilter"
  :data-is-visible-in-viewport="isVisibleInViewport"
  :data-should-reduce-details="shouldReduceDetails"
  :data-width="card.width"
  :key="id"
  ref="card"
  :class="{'is-resizing': currentUserIsResizingCard, 'is-hidden-by-opacity': isCardHiddenByCommentFilter}"
)
  .card(
    @mousedown.left.prevent="startDraggingCard"
    @mouseup.left="showCardDetails"

    @mouseenter="initStickToCursor"
    @mousemove="stickToCursor"
    @mouseleave="unstickToCursor"

    @touchstart="startLocking"
    @touchmove="updateCurrentTouchPosition"
    @touchend="showCardDetailsTouch"

    @keyup.stop.enter="showCardDetails"
    @keyup.stop.backspace="removeCard"

    :class="cardClasses"
    :style="cardStyle"
    :data-card-id="id"
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

    .locking-frame(v-if="isLocking" :style="lockingFrameStyle")
    Frames(:card="card")

    template(v-if="!isComment && shouldRender")
      //- Video
      video(v-if="Boolean(formats.video)" autoplay loop muted playsinline :key="formats.video" :class="{selected: isSelectedOrDragging}" @canplay="updateDimensions")
        source(:src="formats.video")
      //- Image
      img.image(v-if="pendingUploadDataUrl" :src="pendingUploadDataUrl" :class="{selected: isSelectedOrDragging}" @load="updateDimensions")
      img.image(v-else-if="Boolean(formats.image)" :src="formats.image" :class="{selected: isSelectedOrDragging}" @load="updateDimensions")

    .bottom-button-wrap(v-if="resizeIsVisible && shouldRender")
      //- resize
      .resize-button-wrap.inline-button-wrap(
        @mousedown.left.stop="startResizing"
        @touchstart.stop="startResizing"
        @dblclick="removeResize"
      )
        button.inline-button.resize-button(tabindex="-1")
          img.resize-icon.icon(src="@/assets/resize-corner.svg")

    .card-content-wrap(v-if="shouldRender" :style="{width: resizeWidth, 'max-width': resizeWidth }")
      //- Comment
      .card-comment(v-if="isComment && shouldRender" :class="{'extra-name-padding': !cardButtonsIsVisible}")
        //- [·]
        .checkbox-wrap(v-if="hasCheckbox" @mouseup.left="toggleCardChecked" @touchend.prevent="toggleCardChecked")
          label(:class="{active: isChecked, disabled: !canEditSpace}")
            input(type="checkbox" v-model="checkboxState")
        //- Name
        .badge.comment-badge
          .toggle-comment-wrap.inline-button-wrap(@mouseup.left="toggleCommentIsVisible" @touchend="toggleCommentIsVisible")
            button.inline-button(:class="{active: card.commentIsVisible}" tabindex="-1")
              img.icon.view(src="@/assets/comment.svg")
          //- User
          template(v-if="card.commentIsVisible")
            UserLabelInline(:user="createdByUser")
          template(v-if="!card.commentIsVisible")
            UserLabelInline(:user="createdByUser" :shouldHideName="true")
          p.comment.name-segments(v-if="card.commentIsVisible" :class="{'is-checked': isChecked}")
            template(v-for="segment in nameSegments")
              NameSegment(:segment="segment" @showTagDetailsIsVisible="showTagDetailsIsVisible" @showLinkDetailsIsVisible="showLinkDetailsIsVisible")
            //- Image
            img.image(v-if="pendingUploadDataUrl" :src="pendingUploadDataUrl" :class="{selected: isSelectedOrDragging}" @load="updateDimensions")
            img.image(v-else-if="Boolean(formats.image)" :src="formats.image" :class="{selected: isSelectedOrDragging}" @load="updateDimensions")
            //- Video
            video(v-if="Boolean(formats.video)" autoplay loop muted playsinline :key="formats.video" :class="{selected: isSelectedOrDragging}" @canplay="updateDimensions")
              source(:src="formats.video")

      //- Not Comment
      .card-content(v-if="!isComment && shouldRender" :class="{'extra-name-padding': !cardButtonsIsVisible}")
        //- Audio
        .audio-wrap(v-if="Boolean(formats.audio)")
          Audio(:visible="Boolean(formats.audio)" :url="formats.audio" @isPlaying="updateIsPlayingAudio" :selectedColor="selectedColor" :normalizedName="normalizedName")
        .name-wrap
          //- [·]
          .checkbox-wrap(v-if="hasCheckbox" @mouseup.left="toggleCardChecked" @touchend.prevent="toggleCardChecked")
            label(:class="{active: isChecked, disabled: !canEditSpace}")
              input(type="checkbox" v-model="checkboxState")
          //- Name
          p.name.name-segments(v-if="normalizedName" :style="{background: itemBackground}" :class="{'is-checked': isChecked, 'has-checkbox': hasCheckbox, 'badge badge-status': Boolean(formats.image || formats.video)}")
            template(v-for="segment in nameSegments")
              NameSegment(:segment="segment" @showTagDetailsIsVisible="showTagDetailsIsVisible" @showLinkDetailsIsVisible="showLinkDetailsIsVisible")
            Loader(:visible="isLoadingUrlPreview")

      //- Right buttons
      span.card-buttons-wrap
        //- Lock
        template(v-if="isLocked")
          // based on CardUnlockButton.vue
          //- .connector maintains connection paths when card is locked
          .lock-button-wrap.inline-button-wrap(@mouseup.left="unlockCard" @touchend="unlockCard" :data-card-id="id")
            button.inline-button(tabindex="-1" :style="{background: itemBackground}")
              img.icon.lock-icon(src="@/assets/lock.svg")
        template(v-else)
          //- Url →
          a.url-wrap(v-if="cardButtonUrl && !isComment" :href="cardButtonUrl" @click.left.stop="openUrl($event, cardButtonUrl)" @touchend.prevent="openUrl($event, cardButtonUrl)" :class="{'connector-is-visible': connectorIsVisible}")
            .url.inline-button-wrap
              button.inline-button(:style="{background: itemBackground}" :class="{'is-dark': backgroundColorIsDark}" tabindex="-1")
                img.icon.visit.arrow-icon(src="@/assets/visit.svg")
          //- Connector
          .connector.inline-button-wrap(
            v-if="connectorIsVisible"
            :data-card-id="id"
            @mousedown.left="startConnecting"
            @touchstart="startConnecting"
          )
            .connector-glow(:style="connectorGlowStyle" tabindex="-1")
            .connected-colors
              template(v-if="isConnectingTo || isConnectingFrom")
                .color(:style="{ background: currentConnectionColor}")
              template(v-else-if="isRemoteConnecting")
                .color(:style="{ background: remoteConnectionColor }")
              template(v-else v-for="type in connectionTypes")
                .color(:style="{ background: type.color}")

            button.inline-button.connector-button(:class="{ active: isConnectingTo || isConnectingFrom, 'is-dark': connectionTypeColorisDark}" :style="{background: connectorButtonBackground }" tabindex="-1" @keyup.stop.enter="showCardDetails")
              template(v-if="hasConnections || isConnectingFrom || isConnectingTo")
                img.connector-icon(src="@/assets/connector-closed-in-card.svg")
              //- template(v-else)
              //-   img.connector-icon(src="@/assets/connector-open-in-card.svg")
    .url-preview-wrap(v-if="cardUrlPreviewIsVisible && shouldRender")
      UrlPreview(
        :visible="cardUrlPreviewIsVisible"
        :card="card"
        :user="createdByUser"
        :isImageCard="isImageCard"
        :isSelected="isSelectedOrDragging"
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
    .error-container(v-if="error.sizeLimit" @animationend="clearErrors")
      span.badge.danger
        img.icon.cancel(src="@/assets/add.svg")
        span Too Big
    .error-container(v-if="error.unknownUploadError" @animationend="clearErrors")
      span.badge.danger
        img.icon.cancel(src="@/assets/add.svg")
        span Error
    .error-container(v-if="error.signUpToUpload" @animationend="clearErrors")
      span.badge.info
        img.icon.cancel(src="@/assets/add.svg")
        span Sign Up or In
    .error-container(v-if="error.spaceIsReadOnly" @animationend="clearErrors")
      span.badge.info
        img.icon.cancel(src="@/assets/add.svg")
        span Space is Read Only

  //- Meta Info
  .meta-container(v-if="filterShowUsers || filterShowDateUpdated || isInSearchResultsCards")
    //- Search result
    span.badge.search(v-if="isInSearchResultsCards")
      img.icon.search(src="@/assets/search.svg")
    //- Created Through API
    .badge.secondary(v-if="card.isCreatedThroughPublicApi" title="Created via public API")
      img.icon.system(src="@/assets/system.svg")
    //- User
    .badge-wrap
      template(v-if="filterShowUsers")
        UserLabelInline(:user="createdByUser" :isClickable="true")
    //- Date
    .badge.secondary.button-badge(v-if="filterShowDateUpdated" @click.left.prevent.stop="toggleFilterShowAbsoluteDates" @touchend.prevent.stop="toggleFilterShowAbsoluteDates")
      img.icon.time(src="@/assets/time.svg")
      .name {{dateUpdatedAt}}

</template>

<script>
import utils from '@/utils.js'
import Frames from '@/components/Frames.vue'
import Loader from '@/components/Loader.vue'
import Audio from '@/components/Audio.vue'
import NameSegment from '@/components/NameSegment.vue'
import UrlPreview from '@/components/UrlPreview.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'

import dayjs from 'dayjs'
import hexToRgba from 'hex-to-rgba'
import { mapState, mapGetters } from 'vuex'

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

export default {
  components: {
    Frames,
    Loader,
    Audio,
    NameSegment,
    UrlPreview,
    UserLabelInline
  },
  props: {
    card: Object
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      const { type, payload } = mutation
      if (type === 'updateRemoteCurrentConnection' || type === 'removeRemoteCurrentConnection') {
        this.updateRemoteConnections()
      } else if (type === 'triggerScrollCardIntoView') {
        if (payload === this.card.id) {
          const element = this.$refs.card
          this.$store.commit('triggerScrollIntoView', { element })
        }
      } else if (type === 'triggerUploadComplete') {
        let { cardId, url } = payload
        if (cardId !== this.card.id) { return }
        this.addFile({ url })
      } else if (type === 'triggerUpdateUrlPreview') {
        if (payload === this.card.id) {
          this.updateMediaUrls()
          this.updateUrlPreview()
        }
      }
    })
  },
  async mounted () {
    const cardIsMissingDimensions = Boolean(!this.card.width || !this.card.height)
    if (cardIsMissingDimensions) {
      let card = { id: this.card.id }
      card = utils.updateCardDimensions(card)
      this.$store.dispatch('currentCards/update', card)
    }
    const shouldShowDetails = this.loadSpaceShowDetailsForCardId === this.card.id
    if (shouldShowDetails) {
      this.$store.dispatch('closeAllDialogs', 'card.mounted')
      this.$store.commit('preventCardDetailsOpeningAnimation', false)
      this.$store.dispatch('currentCards/showCardDetails', this.card.id)
    }
    if (this.card.shouldUpdateUrlPreview) {
      this.updateMediaUrls()
      const isUpdatedSuccess = await this.updateUrlPreview()
      this.$store.dispatch('currentCards/update', {
        id: this.card.id,
        shouldUpdateUrlPreview: false
      })
      if (!isUpdatedSuccess) { return }
      this.$store.commit('triggerUpdateUrlPreviewComplete', this.card.id)
    }
  },
  data () {
    return {
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
      stickyStretchResistance: 6
    }
  },
  computed: {
    ...mapState([
      'currentUserIsResizingCard',
      'currentUserIsBoxSelecting',
      'searchResultsCards',
      'currentSelectedTag',
      'currentSelectedLink',
      'currentConnectionColor',
      'currentUser',
      'currentSpace',
      'preventDraggedCardFromShowingDetails',
      'cardsWereDragged',
      'search',
      'hasNotifiedPressAndHoldToDrag',
      'isLoadingSpace',
      'loadSpaceShowDetailsForCardId',
      'cardDetailsIsVisibleForCardId',
      'upload',
      'remoteCardsSelected',
      'remoteCardDetailsVisible',
      'remoteCardsDragging',
      'remoteUserResizingCards',
      'remoteUploadDraggedOverCards',
      'filteredTagNames',
      'filteredConnectionTypeIds',
      'filteredFrameIds',
      'urlPreviewLoadingForCardIds',
      'userDetailsIsVisible',
      'userDetailsUser',
      'disableViewportOptimizations',
      'multipleCardsSelectedIds',
      'currentDraggingCardId',
      'remoteCurrentConnections',
      'currentConnectionStartCardIds',
      'currentConnectionSuccess',
      'connectionDetailsIsVisibleForConnectionId',
      'remotePendingUploads',
      'currentUserIsDraggingCard',
      'currentUserIsDrawingConnection',
      'viewportHeight'
    ]),
    ...mapGetters([
      'spaceCounterZoomDecimal',
      'currentConnections/all',
      'currentUser/canEditSpace',
      'currentConnections/typesByCardId',
      'currentSpace/userById',
      'currentConnections/byId',
      'currentConnections/typeByTypeId',
      'currentUser/isSignedIn',
      'currentUser/canEditCard',
      'currentSpace/tagByName',
      'currentConnections/byCardId',
      'currentUser/totalCardFadingFiltersActive',
      'currentConnections/typeForNewConnections',
      'currentUser/isSpaceMember',
      'otherSpaceById',
      'currentScrollPosition',
      'shouldReduceDetails'
    ]),
    isVisibleInViewport () {
      return true
      // if (this.shouldJiggle) { return true }
      // const threshold = 100 * this.spaceCounterZoomDecimal
      // const viewport = this.viewportHeight * this.spaceCounterZoomDecimal
      // const min = this.currentScrollPosition.y - threshold
      // const max = this.currentScrollPosition.y + viewport + threshold
      // const isTopVisible = utils.isBetween({ value: this.y, min, max })
      // const height = this.card.resizeHeight || this.card.height
      // const isBottomVisible = utils.isBetween({ value: this.y + height, min, max })
      // return isTopVisible || isBottomVisible
    },
    isImageCard () { return Boolean(this.formats.image || this.formats.video) },
    itemBackground () {
      let background = 'transparent'
      if (this.isImageCard) {
        background = this.card.backgroundColor
      }
      return this.selectedColor || this.remoteSelectedColor || background
    },
    connectorButtonBackground () {
      if (this.hasConnections || this.isConnectingFrom || this.isConnectingTo) { return }
      return this.itemBackground
    },
    dataTags () {
      let tags = utils.tagsFromStringWithoutBrackets(this.card.name)
      if (!tags) { return }
      tags = tags.map(tag => utils.normalizeString(tag))
      tags = utils.arrayToString(tags)
      return tags
    },
    resizeWidth () {
      const resizeWidth = this.card.resizeWidth
      if (!resizeWidth) { return }
      return resizeWidth + 'px'
    },
    isLocked () {
      if (!this.card) { return }
      const isLocked = this.card.isLocked
      return isLocked
    },
    shouldJiggle () {
      if (this.currentUserIsBoxSelecting) { return }
      return this.isConnectingTo || this.isConnectingFrom || this.isRemoteConnecting || this.isBeingDragged || this.isRemoteCardDragging
    },
    isSelectedOrDragging () {
      return this.isSelected || this.isRemoteSelected || this.isRemoteCardDetailsVisible || this.isRemoteCardDragging || this.uploadIsDraggedOver || this.remoteUploadDraggedOverCardColor || this.remoteUserResizingCardsColor
    },
    isInSearchResultsCards () {
      if (!this.searchResultsCards.length) { return }
      return Boolean(this.searchResultsCards.find(card => this.card.id === card.id))
    },
    resizeIsVisible () {
      if (this.isLocked) { return }
      if (!this.canEditSpace) { return }
      return true
    },
    canEditSpace () { return this['currentUser/canEditSpace']() },
    id () { return this.card.id },
    x () {
      const x = this.card.x
      if (x === undefined || x === null) {
        return defaultCardPosition
      } else {
        return x
      }
    },
    y () {
      const y = this.card.y
      if (y === undefined || y === null) {
        return defaultCardPosition
      } else {
        return y
      }
    },
    z () { return this.card.z },
    connectionTypes () { return this['currentConnections/typesByCardId'](this.id) },
    connectionTypeColorisDark () {
      const lastType = this.connectionTypes[this.connectionTypes.length - 1]
      if (!lastType) {
        return utils.colorIsDark(this.backgroundColor)
      } else {
        return utils.colorIsDark(lastType.color)
      }
    },
    name () {
      this.updateMediaUrls()
      return this.card.name
    },
    frameId () { return this.card.frameId },
    filterShowUsers () { return this.currentUser.filterShowUsers },
    filterShowDateUpdated () { return this.currentUser.filterShowDateUpdated },
    createdByUser () {
      // same as userDetailsWrap.cardCreatedByUser
      const userId = this.card.userId
      let user = this['currentSpace/userById'](userId)
      if (!user) {
        user = {
          name: '',
          color: '#cdcdcd' // secondary-active-background
        }
      }
      return user
    },
    connectorIsVisible () {
      const spaceIsOpen = this.currentSpace.privacy === 'open' && this['currentUser/isSignedIn']
      let isVisible
      if (this.isRemoteConnecting) {
        isVisible = true
      } else if (spaceIsOpen || this.canEditCard || this.connectionTypes.length) {
        isVisible = true
      }
      return isVisible
    },
    cardButtonsIsVisible () {
      if (this.connectorIsVisible || this.isLocked || Boolean(this.formats.link || this.formats.file)) {
        return true
      } else {
        return false
      }
    },
    cardButtonUrl () {
      const link = this.formats.link
      const file = this.formats.file
      if (utils.urlIsValidTld(link) || utils.urlIsSpace(link)) {
        return link
      } else if (utils.urlHasProtocol(file)) {
        return file
      } else {
        return null
      }
    },
    webUrl () {
      const link = this.formats.link
      if (utils.urlIsValidTld(link) && !utils.urlIsSpace(link)) {
        return link
      } else {
        return null
      }
    },
    spaceUrl () {
      const link = this.formats.link
      if (utils.urlIsSpace(link)) {
        return link
      } else {
        return null
      }
    },
    isHiddenInComment () {
      if (this.isComment && !this.card.commentIsVisible) {
        return true
      } else {
        return false
      }
    },
    currentCardDetailsIsVisible () {
      return this.id === this.cardDetailsIsVisibleForCardId
    },
    shouldNotStick () {
      const shouldUseStickyCards = this.currentUser.shouldUseStickyCards
      if (!shouldUseStickyCards) { return true }
      const userIsConnecting = this.currentConnectionStartCardIds.length
      const currentUserIsDraggingBox = this.currentUserIsDraggingBox
      const currentUserIsResizingBox = this.currentUserIsResizingBox
      const currentUserIsPanning = this.currentUserIsPanningReady || this.currentUserIsPanning
      return userIsConnecting || currentUserIsDraggingBox || currentUserIsResizingBox || currentUserIsPanning || this.currentCardDetailsIsVisible || this.isRemoteCardDetailsVisible || this.isRemoteCardDragging || this.isBeingDragged || this.currentUserIsResizingCard || this.isLocked
    },
    cardClasses () {
      return {
        'jiggle': this.shouldJiggle,
        'active': this.isConnectingTo || this.isConnectingFrom || this.isRemoteConnecting || this.isBeingDragged || this.uploadIsDraggedOver,
        'filtered': this.isFiltered,
        'media-card': this.isVisualCard || this.pendingUploadDataUrl,
        'audio-card': this.isAudioCard,
        'is-playing-audio': this.isPlayingAudio,
        'is-locked': this.isLocked,
        'has-url-preview': this.cardUrlPreviewIsVisible,
        'is-dark': this.backgroundColorIsDark
      }
    },
    backgroundColor () {
      return this.selectedColor || this.remoteCardDetailsVisibleColor || this.remoteSelectedColor || this.selectedColorUpload || this.remoteCardDraggingColor || this.remoteUploadDraggedOverCardColor || this.remoteUserResizingCardsColor || this.card.backgroundColor
    },
    cardStyle () {
      const defaultColor = utils.cssVariable('secondary-background')
      let color
      if (!this.isVisualCard) {
        color = this.card.backgroundColor
      }
      color = this.selectedColor || this.remoteCardDetailsVisibleColor || this.remoteSelectedColor || this.selectedColorUpload || this.remoteCardDraggingColor || this.remoteUploadDraggedOverCardColor || this.remoteUserResizingCardsColor || color
      let styles = {
        background: color,
        width: this.resizeWidth,
        maxWidth: this.resizeWidth
      }
      if (this.isComment) {
        color = color || defaultColor
        styles.background = hexToRgba(color, 0.5) || color
      }
      if (!this.shouldRender) {
        styles.width = this.card.resizeWidth || this.card.width + 'px'
        styles.height = this.card.height + 'px'
        styles.background = styles.background || defaultColor
      }
      return styles
    },
    backgroundColorIsDark () {
      const color = this.backgroundColor
      return utils.colorIsDark(color)
    },
    connectorGlowStyle () {
      const color = this.connectedToCardDetailsVisibleColor || this.connectedToCardBeingDraggedColor || this.connectedToConnectionDetailsIsVisibleColor
      if (!color) { return }
      return { background: color }
    },
    connectedToConnectionDetailsIsVisibleColor () {
      const connectionId = this.connectionDetailsIsVisibleForConnectionId
      const connection = this['currentConnections/byId'](connectionId)
      if (!connection) { return }
      const isConnected = connection.startCardId === this.id || connection.endCardId === this.id
      if (!isConnected) { return }
      const connectionType = this['currentConnections/typeByTypeId'](connection.connectionTypeId)
      if (!connectionType) {
        const newType = this.updateTypeForConnection(connectionId)
        return newType.color
      }
      return connectionType.color
    },
    connectedToCardBeingDraggedColor () {
      if (!this.currentUserIsDraggingCard) { return }
      if (this.isBeingDragged) { return }
      let connections = this['currentConnections/all']
      connections = connections.filter(connection => this.connectionIsBeingDragged(connection))
      const connection = connections.find(connection => connection.startCardId === this.id || connection.endCardId === this.id)
      if (!connection) { return }
      const connectionType = this['currentConnections/typeByTypeId'](connection.connectionTypeId)
      if (!connectionType) {
        const newType = this.updateTypeForConnection(connection.id)
        return newType.color
      }
      return connectionType.color
    },
    connectedToCardDetailsVisibleColor () {
      if (this.currentCardDetailsIsVisible) { return }
      const visibleCardId = this.cardDetailsIsVisibleForCardId
      let connections = this['currentConnections/all']
      connections = connections.filter(connection => connection.startCardId === visibleCardId || connection.endCardId === visibleCardId)
      connections = connections.filter(connection => connection.startCardId === this.id || connection.endCardId === this.id)
      const connection = connections[0]
      if (!connection) { return }
      const connectionType = this['currentConnections/typeByTypeId'](connection.connectionTypeId)
      if (!connectionType) {
        const newType = this.updateTypeForConnection(connection.id)
        return newType.color
      }
      return connectionType.color
    },
    updatedAt () { return this.card.nameUpdatedAt || this.card.createdAt },
    dateUpdatedAt () {
      const date = this.updatedAt
      const showAbsoluteDate = this.currentUser.filterShowAbsoluteDates
      if (date) {
        if (showAbsoluteDate) {
          return new Date(date).toLocaleString()
        } else {
          return utils.shortRelativeTime(date)
        }
      } else {
        return 'Just now'
      }
    },
    cardPendingUpload () {
      const pendingUploads = this.upload.pendingUploads
      return pendingUploads.find(upload => upload.cardId === this.card.id)
    },
    remoteCardPendingUpload () {
      return this.remotePendingUploads.find(upload => {
        const inProgress = upload.percentComplete < 100
        const isCard = upload.cardId === this.card.id
        return inProgress && isCard
      })
    },
    pendingUploadDataUrl () {
      if (!this.cardPendingUpload || this.isComment) { return }
      return this.cardPendingUpload.imageDataUrl
    },
    urls () {
      const name = utils.removeMarkdownCodeblocksFromString(this.name)
      let urls = utils.urlsFromString(name)
      if (urls) {
        urls.reverse()
      }
      this.updateMediaUrls(urls)
      return urls || []
    },
    isComment () { return this.card.isComment || utils.isNameComment(this.name) },
    isVisualCard () {
      if (this.isComment) { return }
      return this.formats.image || this.formats.video
    },
    isAudioCard () {
      if (this.isComment) { return }
      return this.formats.audio
    },
    cardHasMedia () { return this.formats.image || this.formats.video || this.formats.audio },
    cardHasUrls () {
      if (!this.urls.length) {
        return false
      } else {
        return true
      }
    },
    isChecked () { return utils.nameIsChecked(this.name) },
    hasCheckbox () {
      if (this.isLocked) { return }
      return utils.checkboxFromString(this.name)
    },
    checkboxState: {
      get () {
        return this.isChecked
      }
    },
    shouldRender () {
      return true
      // if (this.shouldReduceDetails) { return }
      // return this.isVisibleInViewport
    },
    positionStyles () {
      let z = this.z
      let pointerEvents = 'auto'
      if (this.currentCardDetailsIsVisible) {
        z = 2147483646 // max z
      } else if (this.isLocked) {
        z = 0
        pointerEvents = 'none'
      }
      let styles = {
        left: `${this.x}px`,
        top: `${this.y}px`,
        zIndex: z,
        width: this.resizeWidth,
        maxWidth: this.resizeWidth,
        pointerEvents,
        transform: `translate(${this.stickyTranslateX}, ${this.stickyTranslateY})`
      }
      if (!this.shouldRender) {
        styles.width = this.card.resizeWidth || this.card.width + 'px'
      }
      return styles
    },
    canEditCard () { return this['currentUser/canEditCard'](this.card) },
    normalizedName () {
      // name without urls and checkbox text
      let name = this.name
      if (!name) { return }
      if (this.cardHasMedia) {
        name = name.replace(this.formats.image, '')
        name = name.replace(this.formats.video, '')
        name = name.replace(this.formats.audio, '')
      }
      // link hiding
      let link = this.formats.link
      let isHidden
      let markdownLinks = name.match(utils.markdown().linkPattern)
      if (markdownLinks) {
        const linkIsMarkdown = markdownLinks.find(markdownLink => markdownLink.includes(link))
        isHidden = !linkIsMarkdown
      } else if (link.includes('hidden=true')) {
        isHidden = true
      }
      if (isHidden) {
        name = name.replace(link, '')
        name = name.replace(utils.urlWithoutProtocol(link), '')
      }
      // checkboxes
      const checkbox = utils.checkboxFromString(name)
      if (checkbox) {
        name = name.replace(checkbox, '')
      }
      name = this.removeCommentBrackets(name)
      return name.trim()
    },
    nameSegments () {
      let segments = utils.cardNameSegments(this.normalizedName)
      segments = segments.map(segment => {
        segment.isDark = this.backgroundColorIsDark
        // tags
        if (segment.isTag) {
          let tag = this['currentSpace/tagByName'](segment.name)
          if (!tag) {
            tag = utils.newTag({
              name: segment.name,
              defaultColor: this.currentUser.color,
              cardId: this.id,
              spaceId: this.currentSpace.id
            })
            console.warn('🦋 create missing tag', segment.name, tag, this.card)
            this.$store.dispatch('currentSpace/addTag', tag)
          }
          segment.color = tag.color
          segment.id = tag.id
        // links
        } else if (segment.isLink) {
          const spaceId = utils.spaceIdFromUrl(segment.name)
          segment.space = this.spaceFromLinkSpaceId(spaceId, segment.name)
        } else if (segment.isText) {
          segment.markdown = utils.markdownSegments(segment.content)
        }
        return segment
      })
      return segments
    },
    cardUrlPreviewIsVisible () {
      if (!this.card) { return }
      if (!this.card.name) { return }
      let cardHasUrlPreviewInfo = Boolean(this.card.urlPreviewTitle || this.card.urlPreviewDescription || this.card.urlPreviewImage)
      // TEMP experiment: remove card.urlPreviewErrorUrl checking to eliminate false positives. Observe if there's a downside irl and if this attribute should be removed entirely?
      // const isErrorUrl = this.card.urlPreviewErrorUrl && (this.card.urlPreviewUrl === this.card.urlPreviewErrorUrl)
      let url = this.card.urlPreviewUrl
      url = utils.removeTrailingSlash(url)
      cardHasUrlPreviewInfo = Boolean(cardHasUrlPreviewInfo && url)
      const nameHasUrl = this.card.name.includes(url)
      return (this.card.urlPreviewIsVisible && cardHasUrlPreviewInfo && nameHasUrl) && !this.isHiddenInComment
      // return Boolean(this.card.urlPreviewIsVisible && this.card.urlPreviewUrl && cardHasUrlPreviewInfo) // && !isErrorUrl
    },
    tags () {
      return this.nameSegments.filter(segment => {
        if (segment.isTag) {
          return true
        }
      })
    },
    isConnectingTo () {
      if (utils.objectHasKeys(this.currentConnectionSuccess)) {
        return this.currentConnectionSuccess.id === this.id
      } else {
        return false
      }
    },
    isConnectingFrom () {
      if (utils.objectHasKeys(this.currentConnectionSuccess)) {
        return this.currentConnectionStartCardIds.find(cardId => cardId === this.id)
      } else {
        return false
      }
    },
    isBeingDragged () {
      let isCardId
      if (this.multipleCardsSelectedIds.includes(this.id) || this.currentDraggingCardId === this.id) {
        isCardId = true
      }
      return this.currentUserIsDraggingCard && isCardId
    },
    isSelected () {
      return this.multipleCardsSelectedIds.includes(this.id)
    },
    selectedColor () {
      const color = this.currentUser.color
      if (this.isSelected) {
        return color
      } else {
        return undefined
      }
    },
    selectedColorUpload () {
      if (this.uploadIsDraggedOver) {
        return this.currentUser.color
      } else {
        return undefined
      }
    },
    hasConnections () {
      const connections = this['currentConnections/byCardId'](this.id)
      return Boolean(connections.length)
    },

    // Remote

    isRemoteSelected () {
      const selectedCard = this.remoteCardsSelected.find(card => card.cardId === this.id)
      return Boolean(selectedCard)
    },
    isRemoteCardDetailsVisible () {
      const visibleCard = this.remoteCardDetailsVisible.find(card => card.cardId === this.id)
      return Boolean(visibleCard)
    },
    isRemoteCardDragging () {
      const isDragging = this.remoteCardsDragging.find(card => card.cardId === this.id)
      return Boolean(isDragging)
    },
    remoteCardDetailsVisibleColor () {
      const visibleCard = this.remoteCardDetailsVisible.find(card => card.cardId === this.id)
      if (visibleCard) {
        const user = this['currentSpace/userById'](visibleCard.userId)
        return user.color
      } else {
        return undefined
      }
    },
    remoteSelectedColor () {
      const selectedCard = this.remoteCardsSelected.find(card => card.cardId === this.id)
      if (selectedCard) {
        const user = this['currentSpace/userById'](selectedCard.userId)
        return user.color
      } else {
        return undefined
      }
    },
    remoteCardDraggingColor () {
      const draggingCard = this.remoteCardsDragging.find(card => card.cardId === this.id)
      if (draggingCard) {
        const user = this['currentSpace/userById'](draggingCard.userId)
        return user.color
      } else {
        return undefined
      }
    },
    remoteUserResizingCardsColor () {
      if (!this.remoteUserResizingCards.length) { return }
      let user = this.remoteUserResizingCards.find(user => user.cardIds.includes(this.id))
      if (user) {
        user = this['currentSpace/userById'](user.userId)
        return user.color
      } else {
        return undefined
      }
    },
    remoteUploadDraggedOverCardColor () {
      const draggedOverCard = this.remoteUploadDraggedOverCards.find(card => card.cardId === this.id)
      if (draggedOverCard) {
        const user = this['currentSpace/userById'](draggedOverCard.userId)
        return user.color
      } else {
        return undefined
      }
    },

    // Filters

    filtersIsActive () {
      return Boolean(this['currentUser/totalCardFadingFiltersActive'])
    },
    isCardFilteredByTags () {
      const tagNames = this.filteredTagNames
      if (!tagNames.length) { return }
      const hasTag = this.tags.find(tag => {
        if (tagNames.includes(tag.name)) {
          return true
        }
      })
      return hasTag
    },
    isConnectionFilteredByType () {
      if (!this.filteredConnectionTypeIds) { return }
      const filteredTypes = this.connectionTypes.filter(type => {
        return this.filteredConnectionTypeIds.includes(type.id)
      })
      return Boolean(filteredTypes.length)
    },
    isCardFilteredByFrame () {
      if (!this.filteredFrameIds.length) { return }
      const hasFrame = this.filteredFrameIds.includes(this.frameId)
      return hasFrame
    },
    isCardFilteredByUnchecked () {
      if (!this.currentUser.filterUnchecked) { return }
      return !this.isChecked && this.hasCheckbox
    },
    isCardHiddenByCommentFilter () {
      if (!this.currentUser.filterComments) { return }
      return this.isComment
    },
    isFiltered () {
      if (!this.filtersIsActive) { return }
      return this.isCardFilteredByTags || this.isConnectionFilteredByType || this.isCardFilteredByFrame || this.isCardFilteredByUnchecked
    },
    isLoadingUrlPreview () {
      let isLoading = this.urlPreviewLoadingForCardIds.find(cardId => cardId === this.card.id)
      isLoading = Boolean(isLoading)
      if (!isLoading) { return }
      const isErrorUrl = this.card.urlPreviewErrorUrl && (this.card.urlPreviewUrl === this.card.urlPreviewErrorUrl)
      return isLoading && !isErrorUrl
    },
    lockingFrameStyle () {
      const initialPadding = 65 // matches initialLockCircleRadius in magicPaint
      const initialBorderRadius = 50
      const padding = initialPadding * this.lockingPercent
      const userColor = this.currentUser.color
      const borderRadius = Math.max((this.lockingPercent * initialBorderRadius), 5) + 'px'
      const size = `calc(100% + ${padding}px)`
      const position = -(padding / 2) + 'px'
      return {
        width: size,
        height: size,
        left: position,
        top: position,
        background: userColor,
        opacity: this.lockingAlpha,
        borderRadius: borderRadius
      }
    },
    preventUpdatePrevPreview () {
      if (this.card.shouldUpdateUrlPreview) { return }
      const updateDelta = dayjs(this.updatedAt).diff(this.sessionStartDate, 'second')
      return updateDelta < 0
    },
    userDetailsIsUser () {
      if (!this.userDetailsIsVisible) { return }
      return this.createdByUser.id === this.userDetailsUser.id
    }

  },
  methods: {

    // sticky

    initStickToCursor () {
      preventSticking = false
      if (this.shouldNotStick || utils.userPrefersReducedMotion()) {
        preventSticking = true
      }
      stickyTimer = setTimeout(() => {
        stickyTimerComplete = true
      }, stickyTimerDuration)
      this.updateStickyStretchResistance()
    },
    clearStickyTimer () {
      clearTimeout(stickyTimer)
      stickyTimerComplete = false
    },
    isSize (width, height, min) {
      const isWidth = width > min
      const isHeight = height > min
      return isWidth || isHeight
    },
    updateStickyStretchResistance () {
      let { height, width } = this.card
      height = height * this.spaceZoomDecimal
      width = width * this.spaceZoomDecimal
      let stretchResistance = 6 // higher resistance moves less
      // larger sizes have higher resistance
      const size = {
        s: this.isSize(width, height, 250),
        m: this.isSize(width, height, 500),
        l: this.isSize(width, height, 1000),
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
      this.stickyStretchResistance = stretchResistance
    },
    stickToCursor (event) {
      if (this.isAnimationUnsticking) { return }
      if (preventSticking) { return }
      if (!stickyTimerComplete) { return }
      const classes = ['checkbox-wrap', 'button-wrap', 'progress-wrap', 'toggle-comment-wrap', 'inline-button', 'badge']
      const elements = ['button', 'progress', 'iframe']
      const isOverAction = classes.includes(event.target.className) || elements.includes(event.target.nodeName.toLowerCase())
      const isOverTag = event.target.className.includes('button-badge')
      if (this.shouldNotStick || isOverAction || isOverTag) {
        this.clearStickyPositionOffsets()
        preventSticking = true
        return
      }
      const isButtonHover = event.target.closest('.inline-button-wrap')
      if (isButtonHover) {
        this.clearStickyPositionOffsets()
        return
      }
      const stretchResistance = this.stickyStretchResistance
      const { height, width } = this.card
      const halfWidth = width / 2
      const halfHeight = height / 2
      let centerX = this.x + halfWidth
      let centerY = this.y + halfHeight
      let position = utils.cursorPositionInSpace({ event })
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
      this.stickyTranslateX = xOffset + 'px'
      this.stickyTranslateY = yOffset + 'px'
    },
    unstickToCursor () {
      this.clearStickyTimer()
      this.isAnimationUnsticking = true
      const xOffset = parseInt(this.stickyTranslateX)
      const yOffset = parseInt(this.stickyTranslateY)
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
      const element = this.$refs.card
      if (!element) { return }
      const animation = element.animate(keyframes, timing)
      animation.onfinish = () => {
        this.clearStickyPositionOffsets()
        this.isAnimationUnsticking = false
      }
    },
    clearStickyPositionOffsets () {
      this.stickyTranslateX = 0
      this.stickyTranslateY = 0
    },

    updateTypeForConnection (connectionId) {
      const newType = this['currentConnections/typeForNewConnections']
      console.warn('🚑 connection was missing type', { cardId: this.id, connectionId, newType })
      const connection = {
        id: connectionId,
        connectionTypeId: newType.id
      }
      this.$store.dispatch('currentConnections/update', connection)
      return newType
    },
    addFile (file) {
      let name = this.card.name
      const url = file.url
      const urlType = utils.urlType(url)
      const checkbox = utils.checkboxFromString(name)
      const previousUrls = utils.urlsFromString(name, true) || []
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
      this.$store.dispatch('currentCards/update', {
        id: this.card.id,
        name: utils.trim(name)
      })
    },
    unlockCard (event) {
      if (this.currentUserIsDrawingConnection) {
        return
      }
      event.stopPropagation()
      if (!this.canEditCard) {
        const position = utils.cursorPositionInSpace({ event })
        this.$store.commit('addNotificationWithPosition', { message: 'Card is Read Only', position, type: 'info', layer: 'space', icon: 'cancel' })
        return
      }
      this.$store.commit('currentUserIsDraggingCard', false)
      this.$store.dispatch('currentCards/update', {
        id: this.card.id,
        isLocked: false
      })
    },
    connectionIsBeingDragged (connection) {
      const cardIdsBeingDragged = this.multipleCardsSelectedIds.concat(this.currentDraggingCardId)
      return cardIdsBeingDragged.find(cardId => connection.startCardId === cardId || connection.endCardId === cardId)
    },
    checkIfShouldUpdateCardConnectionPaths (width) {
      this.$nextTick(() => {
        this.$nextTick(() => {
          if (this.prevNameLineMinWidth !== width) {
            this.$store.dispatch('currentConnections/updatePaths', { cardId: this.card.id, shouldUpdateApi: true })
          }
          this.prevNameLineMinWidth = width
        })
      })
    },
    selectAllConnectedCards (event) {
      const isMeta = event.metaKey || event.ctrlKey
      if (!isMeta) { return }
      if (!this.canEditSpace) { return }
      this.$store.dispatch('closeAllDialogs', 'Card.selectAllConnectedCards')
      const connections = this['currentConnections/all']
      let selectedCards = [this.card.id]
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
      this.$store.commit('multipleSelectedActionsIsVisible', false)
      this.$store.commit('multipleCardsSelectedIds', selectedCards)
    },
    updateMediaUrls (urls) {
      urls = urls || utils.urlsFromString(this.card.name)
      this.formats.image = ''
      this.formats.video = ''
      this.formats.audio = ''
      this.formats.link = ''
      if (!urls) { return }
      if (!urls.length) { return }
      urls.forEach(url => {
        if (utils.urlIsImage(url)) {
          this.formats.image = url
        } else if (utils.urlIsVideo(url)) {
          this.formats.video = url
        } else if (utils.urlIsAudio(url)) {
          this.formats.audio = url
        } else if (utils.urlIsFile(url)) {
          this.formats.file = url
        } else {
          this.formats.link = url
          this.linkToPreview = url
        }
      })
    },
    updateIsPlayingAudio (value) {
      this.isPlayingAudio = value
      this.cancelLocking()
    },
    clearErrors () {
      this.error.signUpToUpload = false
      this.error.sizeLimit = false
      this.error.unknownUploadError = false
      this.error.spaceIsReadOnly = false
    },
    checkIfUploadIsDraggedOver (event) {
      if (event.dataTransfer.types[0] === 'Files' || event.dataTransfer.items[0].kind === 'file') {
        this.uploadIsDraggedOver = true
        const updates = {
          cardId: this.card.id,
          userId: this.currentUser.id
        }
        this.$store.commit('broadcast/updateStore', { updates, type: 'addToRemoteUploadDraggedOverCards' })
      }
    },
    removeUploadIsDraggedOver () {
      this.uploadIsDraggedOver = false
      const userId = this.currentUser.id
      this.$store.commit('broadcast/updateStore', { updates: { userId }, type: 'clearRemoteUploadDraggedOverCards' })
    },
    async uploadFile (event) {
      this.removeUploadIsDraggedOver()
      this.$store.dispatch('currentCards/incrementZ', this.id)
      // pre-upload errors
      if (!this['currentUser/isSignedIn']) {
        this.error.signUpToUpload = true
        this.$store.commit('addNotification', { message: 'To upload files, you need to Sign Up or In', type: 'info' })
        return
      }
      if (!this.canEditSpace) {
        this.error.spaceIsReadOnly = true
        this.$store.commit('addNotification', { message: 'You can only upload files on spaces you can edit', type: 'info' })
        return
      }
      const file = event.dataTransfer.files[0]
      const cardId = this.card.id
      // upload
      try {
        await this.$store.dispatch('upload/uploadFile', { file, cardId })
      } catch (error) {
        console.warn('🚒', error)
        if (error.type === 'sizeLimit') {
          this.error.sizeLimit = true
        } else {
          this.error.unknownUploadError = true
        }
        this.$store.commit('addNotification', { message: error.message, type: 'danger' })
      }
    },
    toggleCardChecked () {
      if (this.preventDraggedCardFromShowingDetails) { return }
      if (!this.canEditSpace) { return }
      const value = !this.isChecked
      this.$store.dispatch('closeAllDialogs', 'Card.toggleCardChecked')
      this.$store.dispatch('currentCards/toggleChecked', { cardId: this.id, value })
      this.cancelLocking()
      this.$store.commit('currentUserIsDraggingCard', false)
      const userId = this.currentUser.id
      this.$store.commit('broadcast/updateStore', { updates: { userId }, type: 'clearRemoteCardsDragging' })
      event.stopPropagation()
    },
    toggleUserDetailsIsVisible (event) {
      if (isMultiTouch) { return }
      this.$store.dispatch('closeAllDialogs', 'Card.toggleUserDetailsIsVisible')
      this.$store.dispatch('currentCards/incrementZ', this.id)
      this.$store.commit('currentUserIsDraggingCard', false)
      const user = this.createdByUser
      const position = utils.childDialogPositionFromParent({ element: event.target, shouldIgnoreZoom: true })
      if (this.userDetailsIsUser) { return }
      // show dialog
      this.$store.commit('userDetailsUser', user)
      this.$store.commit('userDetailsPosition', position)
      this.$store.commit('userDetailsIsVisible', true)
      this.$store.commit('triggerScrollUserDetailsIntoView')
    },
    toggleFilterShowAbsoluteDates () {
      this.$store.dispatch('currentCards/incrementZ', this.id)
      this.$store.dispatch('closeAllDialogs', 'Card.toggleFilterShowAbsoluteDates')
      const value = !this.currentUser.filterShowAbsoluteDates
      this.$store.dispatch('currentUser/toggleFilterShowAbsoluteDates', value)
    },
    updateRemoteConnections () {
      const connection = this.remoteCurrentConnections.find(remoteConnection => {
        const isConnectedToStart = remoteConnection.startCardId === this.id
        const isConnectedToEnd = remoteConnection.endCardId === this.id
        return isConnectedToStart || isConnectedToEnd
      })
      if (connection) {
        this.isRemoteConnecting = true
        this.remoteConnectionColor = connection.color
      } else {
        this.isRemoteConnecting = false
      }
    },
    longestNameLineLength () {
      let name = ''
      this.nameSegments.forEach(segment => {
        if (segment.isTag) {
          name += segment.name
        }
        if (segment.markdown) {
          segment.markdown.forEach(markdown => {
            if (markdown.type === 'link') {
              name += markdown.result[1]
            } else if (markdown.type === 'code') {
              // truncate code characters to compensate for badge padding
              name += markdown.content.substring(4, markdown.content.length)
            } else {
              name += markdown.content
            }
          })
        }
      })
      name = name || '.'
      const nameLines = name.match(/[^\n]+/g)
      let longestLineLength = 0
      if (!nameLines) { return longestLineLength }
      nameLines.forEach(line => {
        if (line.length > longestLineLength) {
          longestLineLength = line.length
        }
      })
      return longestLineLength
    },
    removeCard () {
      if (this.isLocked) { return }
      if (this.canEditCard) {
        this.$store.dispatch('currentCards/remove', this.card)
      }
    },
    closeAllDialogs () {
      this.$store.dispatch('closeAllDialogs', 'Card.closeAllDialogs')
    },
    createCurrentConnection (event) {
      const cursor = utils.cursorPositionInViewport(event)
      let cardIds = [this.id]
      if (this.multipleCardsSelectedIds.length) {
        cardIds = this.multipleCardsSelectedIds
      }
      this.$store.commit('currentConnectionStartCardIds', cardIds)
      this.$store.commit('currentConnectionCursorStart', cursor)
    },
    addConnectionType (event) {
      const shouldUseLastConnectionType = this.currentUser.shouldUseLastConnectionType
      const shiftKey = event.shiftKey
      const connectionType = this['currentConnections/typeForNewConnections']
      if (!connectionType) {
        this.$store.dispatch('currentConnections/addType')
      }
      if (shouldUseLastConnectionType && shiftKey) {
        this.$store.dispatch('currentConnections/addType')
        return
      }
      if (shiftKey || shouldUseLastConnectionType) {
        return
      }
      this.$store.dispatch('currentConnections/addType')
    },
    startConnecting (event) {
      if (!this.canEditSpace) { return }
      if (utils.isMultiTouch(event)) { return }
      this.$store.dispatch('closeAllDialogs', 'Card.startConnecting')
      this.$store.commit('preventDraggedCardFromShowingDetails', true)
      if (!this.currentUserIsDrawingConnection) {
        this.addConnectionType(event)
        this.createCurrentConnection(event)
      }
      this.$store.commit('currentUserIsDrawingConnection', true)
    },
    startResizing (event) {
      if (!this.canEditSpace) { return }
      if (utils.isMultiTouch(event)) { return }
      this.$store.dispatch('history/pause')
      this.$store.dispatch('closeAllDialogs', 'Card.startResizing')
      this.$store.commit('preventDraggedCardFromShowingDetails', true)
      this.$store.dispatch('currentCards/incrementZ', this.id)
      this.$store.commit('currentUserIsResizingCard', true)
      let cardIds = [this.id]
      if (this.multipleCardsSelectedIds.length) {
        cardIds = this.multipleCardsSelectedIds
      }
      this.$store.commit('currentUserIsResizingCardIds', cardIds)
      const updates = {
        userId: this.currentUser.id,
        cardIds: cardIds
      }
      this.$store.commit('broadcast/updateStore', { updates, type: 'updateRemoteUserResizingCards' })
    },
    removeResize () {
      let cardIds = [this.id]
      if (this.multipleCardsSelectedIds.length) {
        cardIds = this.multipleCardsSelectedIds
      }
      this.$store.dispatch('currentCards/removeResize', { cardIds })
    },
    toggleCommentIsVisible (event) {
      if (this.preventDraggedCardFromShowingDetails) { return }
      if (utils.isMultiTouch(event)) { return }
      this.$store.dispatch('closeAllDialogs', 'Card.toggleComment')
      this.$store.commit('preventDraggedCardFromShowingDetails', true)
      this.$store.dispatch('clearMultipleSelected')
      const cardId = this.id
      const value = !this.card.commentIsVisible
      this.$store.dispatch('history/snapshots')
      this.$store.dispatch('currentCards/commentIsVisible', { cardId, value })
      this.$store.dispatch('currentCards/incrementZ', cardId)
      this.updateCardConnectionPathsIfOpenSpace()
    },
    updateCardConnectionPathsIfOpenSpace () {
      const spaceIsOpen = this.currentSpace.privacy === 'open'
      const isSpaceMember = this['currentUser/isSpaceMember']()
      if (spaceIsOpen && !isSpaceMember) {
        this.$nextTick(() => {
          this.$nextTick(() => {
            this.$store.dispatch('currentConnections/updatePaths', { cardId: this.id, shouldUpdateApi: true })
          })
        })
      }
    },
    checkIfShouldDragMultipleCards (event) {
      if (event.shiftKey) { return }
      // if the current dragging card is not already selected then clear selection
      if (!this.multipleCardsSelectedIds.includes(this.id)) {
        this.$store.dispatch('clearMultipleSelected')
      }
    },
    startDraggingCard (event) {
      isMultiTouch = false
      if (this.isLocked) { return }
      if (this.currentUserIsPanningReady) { return }
      if (!this.canEditCard) { return }
      if (utils.isMultiTouch(event)) {
        isMultiTouch = true
        return
      }
      event.preventDefault()
      if (this.currentUserIsDrawingConnection) { return }
      this.$store.dispatch('closeAllDialogs', 'Card.startDraggingCard')
      this.$store.commit('currentUserIsDraggingCard', true)
      this.$store.commit('currentDraggingCardId', this.id)
      const updates = {
        cardId: this.card.id,
        userId: this.currentUser.id
      }
      this.$store.commit('broadcast/updateStore', { updates, type: 'addToRemoteCardsDragging' })
      this.$store.commit('parentCardId', this.id)
      this.$store.commit('childCardId', '')
      this.checkIfShouldDragMultipleCards(event)
      this.$store.dispatch('currentCards/incrementSelectedZs')
    },
    showCardDetails (event) {
      this.$store.dispatch('currentCards/afterMove')
      if (this.isLocked) { return }
      if (this.currentUserIsPainting) { return }
      if (isMultiTouch) { return }
      if (this.currentUserIsPanningReady || this.currentUserIsPanning) { return }
      if (this.currentUserIsResizingBox || this.currentUserIsDraggingBox) { return }
      if (!this.canEditCard) { this.$store.commit('triggerReadOnlyJiggle') }
      const shouldToggleSelected = event.shiftKey && !this.cardsWereDragged && !this.isConnectingTo
      if (shouldToggleSelected) {
        this.$store.dispatch('toggleCardSelected', this.id)
        event.stopPropagation()
        this.$store.commit('currentUserIsDraggingCard', false)
        return
      }
      const userId = this.currentUser.id
      this.$store.commit('broadcast/updateStore', { updates: { userId }, type: 'clearRemoteCardsDragging' })
      this.preventDraggedButtonBadgeFromShowingDetails = this.preventDraggedCardFromShowingDetails
      if (this.preventDraggedCardFromShowingDetails) { return }
      this.$store.dispatch('closeAllDialogs', 'Card.showCardDetails')
      this.$store.dispatch('clearMultipleSelected')
      const nodeName = event.target.nodeName
      if (nodeName === 'LABEL') { return } // checkbox
      if (nodeName === 'A' && event.touches) {
        window.location = event.target.href
        return
      }
      this.$store.commit('cardDetailsIsVisibleForCardId', this.id)
      this.$store.commit('preventCardDetailsOpeningAnimation', true)
      this.$store.commit('parentCardId', this.id)
      event.stopPropagation() // only stop propagation if cardDetailsIsVisible
      this.$store.commit('currentUserIsDraggingCard', false)
      this.updatePreviousResultCardId()
      this.clearStickyPositionOffsets()
    },
    updatePreviousResultCardId () {
      if (!this.search) { return }
      if (!this.searchResultsCards.length) { return }
      if (this.searchResultsCards.find(card => card.id === this.card.id)) {
        this.$store.commit('previousResultCardId', this.card.id)
      }
    },
    showTagDetailsIsVisible ({ event, tag }) {
      if (isMultiTouch) { return }
      if (!this.canEditCard) { this.$store.commit('triggerReadOnlyJiggle') }
      if (this.preventDraggedButtonBadgeFromShowingDetails) { return }
      this.$store.dispatch('currentCards/incrementZ', this.id)
      this.$store.dispatch('closeAllDialogs', 'Card.showTagDetailsIsVisible')
      this.$store.commit('currentUserIsDraggingCard', false)
      const tagRect = event.target.getBoundingClientRect()
      this.$store.commit('tagDetailsPosition', {
        x: window.scrollX + tagRect.x + 2,
        y: window.scrollY + tagRect.y + tagRect.height - 2,
        pageX: window.scrollX,
        pageY: window.scrollY
      })
      tag.cardId = this.id
      this.$store.commit('currentSelectedTag', tag)
      this.$store.commit('tagDetailsIsVisible', true)
      this.cancelLocking()
      this.$store.commit('currentUserIsDraggingCard', false)
    },
    showLinkDetailsIsVisible ({ event, link }) {
      if (isMultiTouch) { return }
      if (this.preventDraggedButtonBadgeFromShowingDetails) { return }
      this.$store.dispatch('currentCards/incrementZ', this.id)
      this.$store.dispatch('closeAllDialogs', 'Card.showLinkDetailsIsVisible')
      this.$store.commit('currentUserIsDraggingCard', false)
      const linkRect = event.target.getBoundingClientRect()
      this.$store.commit('linkDetailsPosition', {
        x: window.scrollX + linkRect.x + 2,
        y: window.scrollY + linkRect.y + linkRect.height - 2
      })
      link.cardId = this.id
      this.$store.commit('currentSelectedLink', link)
      this.$store.commit('linkDetailsIsVisible', true)
      this.cancelLocking()
      this.$store.commit('currentUserIsDraggingCard', false)
    },
    spaceFromLinkSpaceId (spaceId, url) {
      let space = this.otherSpaceById(spaceId)
      if (!space) {
        space = {
          isLoadingOrInvalid: true,
          name: url,
          url: spaceId
        }
      }
      this.updateDimensions()
      return space
    },
    openUrl (event, url) {
      this.$store.dispatch('closeAllDialogs', 'Card.openUrl')
      const shouldOpenInNewTab = this.currentUser.shouldOpenLinksInNewTab
      if (shouldOpenInNewTab) {
        event.preventDefault()
        window.open(url) // opens url in new tab
      } else {
        if (utils.urlIsSpace(url)) {
          event.preventDefault()
          const spaceId = utils.spaceIdFromUrl(url)
          this.changeSpace({ id: spaceId })
        } else if (event.type === 'touchend') {
          window.location = url
        } else {
          // open url natively
        }
      }
    },
    changeSpace (space) {
      this.$store.dispatch('currentSpace/changeSpace', { space, isRemote: true })
      this.$store.dispatch('closeAllDialogs', 'spaceDetails.changeSpace')
    },
    removeCommentBrackets (name) {
      if (!this.isComment) { return name }
      if (this.card.isComment) { return name }
      const commentPattern = utils.commentPattern()
      const comments = name.match(commentPattern)
      comments.forEach(comment => {
        const content = comment.substring(2, comment.length - 2)
        name = name.replace(comment, content)
      })
      return name
    },

    // Touch

    notifyPressAndHoldToDrag () {
      if (this.isLocked) { return }
      if (this.currentUserIsDrawingConnection) { return }
      if (!this.hasNotifiedPressAndHoldToDrag) {
        this.$store.commit('addNotification', { message: 'Tap and hold to drag cards', icon: 'press-and-hold' })
      }
      this.$store.commit('hasNotifiedPressAndHoldToDrag', true)
    },
    cancelLocking () {
      shouldCancelLocking = true
    },
    cancelLockingAnimationFrame () {
      this.isLocking = false
      this.lockingPercent = 0
      this.lockingAlpha = 0
      shouldCancelLocking = false
    },
    startLocking (event) {
      if (this.isLocked) { return }
      this.updateTouchPosition(event)
      this.updateCurrentTouchPosition(event)
      if (this.isSelected) {
        this.isLocking = false
        this.startDraggingCard(event)
        return
      }
      this.isLocking = true
      shouldCancelLocking = false
      setTimeout(() => {
        if (!lockingAnimationTimer) {
          lockingAnimationTimer = window.requestAnimationFrame(this.lockingAnimationFrame)
        }
      }, lockingPreDuration)
    },
    lockingAnimationFrame (timestamp) {
      if (!lockingStartTime) {
        lockingStartTime = timestamp
      }
      const elaspedTime = timestamp - lockingStartTime
      const percentComplete = (elaspedTime / lockingDuration) // between 0 and 1
      if (!utils.cursorsAreClose(touchPosition, currentTouchPosition)) {
        this.notifyPressAndHoldToDrag()
        this.cancelLockingAnimationFrame()
      }
      if (shouldCancelLocking) {
        this.cancelLockingAnimationFrame()
      }
      if (this.isLocking && percentComplete <= 1) {
        // const minSize = circleRadius
        const percentRemaining = Math.abs(percentComplete - 1)
        this.lockingPercent = percentRemaining
        const alpha = utils.easeOut(percentComplete, elaspedTime, lockingDuration)
        this.lockingAlpha = alpha
        window.requestAnimationFrame(this.lockingAnimationFrame)
      } else if (this.isLocking && percentComplete > 1) {
        console.log('🔒🐢 card lockingAnimationFrame locked')
        lockingAnimationTimer = undefined
        lockingStartTime = undefined
        this.isLocking = false
        this.startDraggingCard(initialTouchEvent)
        this.$store.commit('triggeredTouchCardDragPosition', touchPosition)
      } else {
        window.cancelAnimationFrame(lockingAnimationTimer)
        lockingAnimationTimer = undefined
        lockingStartTime = undefined
        this.cancelLockingAnimationFrame()
      }
    },
    updateCurrentTouchPosition (event) {
      currentTouchPosition = utils.cursorPositionInViewport(event)
      if (this.isBeingDragged || this.currentUserIsResizingCard) {
        event.preventDefault() // allows dragging cards without scrolling
      }
    },
    updateTouchPosition (event) {
      initialTouchEvent = event
      isMultiTouch = false
      if (utils.isMultiTouch(event)) {
        isMultiTouch = true
        return
      }
      touchPosition = utils.cursorPositionInViewport(event)
      if (this.currentUserIsDrawingConnection) {
        event.preventDefault() // allows swipe to scroll, before card locked
      }
    },
    touchIsNearTouchPosition (event) {
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
    },
    showCardDetailsTouch (event) {
      this.cancelLocking()
      if (this.touchIsNearTouchPosition(event)) {
        this.showCardDetails(event)
      }
      const userId = this.currentUser.id
      this.$store.commit('broadcast/updateStore', { updates: { userId }, type: 'clearRemoteCardsDragging' })
    },

    updateUrlData () {
      this.updateSpaceLink()
      if (this.isLoadingSpace) { return }
      this.updateUrlPreview()
    },

    // space link

    updateSpaceLink () {
      let url = this.spaceUrl
      const shouldRemoveLink = this.card.linkToSpaceId && !url
      if (shouldRemoveLink) {
        const update = {
          id: this.card.id,
          linkToSpaceId: null
        }
        this.$store.dispatch('currentCards/update', update)
        return
      }
      if (!url) { return }
      const linkToSpaceId = utils.spaceIdFromUrl(url) || null
      const linkExists = linkToSpaceId === this.card.linkToSpaceId
      if (linkExists) { return }
      const update = {
        id: this.card.id,
        linkToSpaceId
      }
      this.$store.dispatch('currentCards/update', update)
      this.$store.dispatch('currentSpace/saveOtherSpace', { spaceId: linkToSpaceId })
    },

    // url preview

    async updateUrlPreview () {
      if (this.preventUpdatePrevPreview) { return }
      if (!this.canEditCard) { return }
      this.$store.commit('addUrlPreviewLoadingForCardIds', this.card.id)
      const cardId = this.card.id
      let url = this.webUrl
      if (!url) {
        this.$store.commit('removeUrlPreviewLoadingForCardIds', cardId)
        return
      }
      const shouldUpdate = this.shouldUpdateUrlPreview(url)
      if (!shouldUpdate) {
        this.$store.commit('removeUrlPreviewLoadingForCardIds', cardId)
        return
      }
      try {
        url = this.removeHiddenQueryString(url)
        let response = await this.$store.dispatch('api/urlPreview', url)
        this.$store.commit('removeUrlPreviewLoadingForCardIds', cardId)
        if (!response) { throw 'api/urlPreview' }
        let { data, host } = response
        console.log('🚗 link preview', host, data)
        const { links, meta } = data
        if (!links) { throw 'link preview error' }
        this.updateUrlPreviewSuccess({ links, meta, cardId, url })
        return true
      } catch (error) {
        console.warn('🚑', error, url)
        this.updateUrlPreviewErrorUrl(url)
      }
    },
    shouldUpdateUrlPreview (url) {
      const previewIsVisible = this.card.urlPreviewIsVisible
      const isNotPreviewUrl = url !== this.card.urlPreviewUrl
      const isNotErrorUrl = url !== this.card.urlPreviewErrorUrl
      const isNotKinopioUrl = !url.startsWith('https://kinopio.club')
      const isLocalhostUrl = url.match(utils.localhostUrlPattern())
      return previewIsVisible && isNotPreviewUrl && isNotErrorUrl && isNotKinopioUrl && !isLocalhostUrl
    },
    removeHiddenQueryString (url) {
      if (!url) { return }
      url = url.replace('?hidden=true', '')
      url = url.replace('&hidden=true', '')
      return url
    },
    nameIncludesUrl (url) {
      const name = this.card.name
      const normalizedUrl = utils.removeTrailingSlash(url)
      return name.includes(url) || name.includes(normalizedUrl)
    },
    previewImage ({ thumbnail }) {
      const minWidth = 200
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
    },
    previewFavicon ({ icon }) {
      if (!icon) { return '' }
      let image = icon.find(item => item.href)
      return image.href || ''
    },
    updateUrlPreviewSuccess ({ links, meta, cardId, url }) {
      if (!this.nameIncludesUrl(url)) { return }
      cardId = cardId || this.card.id
      if (!cardId) {
        console.warn('🚑 could not updateUrlPreviewSuccess', cardId, this.card)
        return
      }
      const update = {
        id: cardId,
        urlPreviewUrl: url,
        urlPreviewTitle: utils.truncated(meta.title || meta.site),
        urlPreviewDescription: utils.truncated(meta.description, 280),
        urlPreviewImage: this.previewImage(links),
        urlPreviewFavicon: this.previewFavicon(links)
      }
      this.$store.dispatch('currentCards/update', update)
      this.updateDimensions()
    },
    updateDimensions () {
      this.$store.dispatch('currentCards/updateDimensions', { cards: [this.card] })
    },
    updateUrlPreviewErrorUrl (url) {
      const cardId = this.card.id
      this.$store.commit('removeUrlPreviewLoadingForCardIds', cardId)
      const update = {
        id: cardId,
        urlPreviewErrorUrl: url,
        urlPreviewUrl: url
      }
      this.$store.dispatch('currentCards/update', update)
    }
  },
  watch: {
    linkToPreview (value) {
      this.updateUrlData()
    },
    isVisibleInViewport (newValue, prevValue) {
      const isChanged = newValue !== prevValue
      if (newValue && isChanged) {
        this.$store.commit('triggerUpdateLockedCardButtonPosition', this.card.id)
      }
    }
  }
}
</script>

<style lang="stylus">
article
  --card-width 235px
  pointer-events all
  position absolute
  max-width var(--card-width)
  -webkit-touch-callout none
  &.is-resizing
    *
      outline none
  .card
    border-radius var(--entity-radius)
    user-select none
    background-color var(--secondary-background)
    max-width var(--card-width)
    cursor pointer
    touch-action manipulation
    &:hover,
    &.hover
      box-shadow var(--hover-shadow)
    &:active,
    &.active
      box-shadow var(--active-shadow)
    &.is-dark
      .name
        color var(--primary-background)
    .card-comment
      > .badge
        margin 0
        margin-top 6px
        margin-left 6px
        margin-bottom 6px
      .comment
        &.is-checked
          text-decoration line-through
        .image
          margin-top 10px
          border-radius 3px
      .user-label-inline
        transform translateY(-1px)
        margin 0

    .card-content-wrap
      display flex
      align-items flex-start
      justify-content space-between
    .card-content
      min-width 28px
      width 100%
    .extra-name-padding
      margin-right 8px
    .card-buttons-wrap
      display flex
      margin-left auto
    .name-wrap,
    .card-comment
      display flex
      align-items flex-start
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
        &.is-checked
          text-decoration line-through
          h1,
          h2,
          h3
            text-decoration line-through
        &.has-checkbox
          .audio
            width 132px
        .loader
          margin-left 5px
          width 14px
          height 14px
          vertical-align -3px

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
          border-color var(--primary)
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
      border 1px solid var(--primary)
      &.is-dark
        border-color var(--primary-background)
    .connector-icon
      position absolute
      left -1px
      top -1px
      width 10px

    .resize-icon
      position absolute
      left 5px
      top 5.5px
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
      .image,
      video
        border-radius var(--entity-radius)
        display block
        -webkit-touch-callout none // prevents safari mobile press-and-hold from interrupting
        &.selected
          mix-blend-mode color-burn
      .card-content-wrap
        position absolute
        top 0
        width 100%
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

  .bottom-button-wrap
    position absolute
    right 0px
    bottom 0px
    display flex
    .resize-button-wrap
      z-index 1
      cursor ew-resize
      button
        cursor ew-resize
    img
      -webkit-user-drag none

  .lock-button-wrap
    pointer-events all
    cursor pointer
    position relative
    button
      cursor pointer

  .meta-container
    margin-top -6px
    display flex
    padding 8px
    padding-top 0
    .user-badge
      display flex
      margin 0
      .label-badge
        padding 0 10px
        left -2px
        bottom initial
        top 12px
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

  .toggle-comment-wrap
    display initial
    cursor pointer
    padding-left 0
    padding-right 6px
    padding-bottom 6px
    padding-top 6px
    button
      cursor pointer
    .icon
      width 12px
      position absolute
      left 3px
      top 2px

  .comment-user-badge
    display inline
    .user
      vertical-align bottom
  .comment-badge
    padding-left 0
    padding-right 0
    padding-bottom 0
    .user-badge,
    .user
      margin-right 0

  .url-preview-wrap
    padding 8px
    padding-top 0

  .locking-frame
    position absolute
    z-index -1
    pointer-events none

  .selected-user-avatar
    padding 0 3px
    border-radius 3px
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
@media (prefers-reduced-motion)
  .jiggle
    animation none

@keyframes jiggle
  0%
    transform rotate(0deg)
  25%
    transform rotate(-3deg)
  50%
    transform rotate(3deg)
  75%
    transform rotate(-3deg)
  100%
    transform rotate(0deg)

</style>
