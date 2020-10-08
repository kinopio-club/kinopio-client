<template lang="pug">
article(:style="position" :data-card-id="id" ref="card")
  .card(
    @mousedown.left.prevent="startDraggingCard"
    @touchstart="startDraggingCard"
    @mouseup.left="showCardDetails"
    @touchend="showCardDetails"
    @keyup.stop.enter="showCardDetails"
    @keyup.stop.backspace="removeCard"
    :class="{jiggle: isConnectingTo || isConnectingFrom || isRemoteConnecting || isBeingDragged || isRemoteCardDragging, active: isConnectingTo || isConnectingFrom || isRemoteConnecting || isBeingDragged || uploadIsDraggedOver, 'filtered': isFiltered, 'media-card': isVisualCard || pendingUploadDataUrl, 'audio-card': Boolean(formats.audio), 'is-playing-audio': isPlayingAudio}",
    :style="{background: selectedColor || remoteCardDetailsVisibleColor || remoteSelectedColor || selectedColorUpload || remoteCardDraggingColor || remoteUploadDraggedOverCardColor }"
    :data-card-id="id"
    :data-card-x="x"
    :data-card-y="y"
    tabindex="0"
    :data-droppable="true"
    @dragenter="checkIfUploadIsDraggedOver"
    @dragover.prevent="checkIfUploadIsDraggedOver"
    @dragleave="removeUploadIsDraggedOver"
    @dragend="removeUploadIsDraggedOver"
    @drop.prevent.stop="uploadFile"
    @click="selectAllConnectedCards"
  )
    Frames(:card="card")

    //- Video
    video(v-if="Boolean(formats.video)" autoplay loop muted playsinline :key="formats.video" :class="{selected: isSelected || isRemoteSelected || isRemoteCardDetailsVisible || isRemoteCardDragging || uploadIsDraggedOver || remoteUploadDraggedOverCardColor}")
      source(:src="formats.video")
    //- Image
    img.image(v-if="pendingUploadDataUrl" :src="pendingUploadDataUrl" :class="{selected: isSelected || isRemoteSelected || isRemoteCardDetailsVisible || isRemoteCardDragging || uploadIsDraggedOver || remoteUploadDraggedOverCardColor}")
    img.image(v-else-if="Boolean(formats.image)" :src="formats.image" :class="{selected: isSelected || isRemoteSelected || isRemoteCardDetailsVisible || isRemoteCardDragging || uploadIsDraggedOver || remoteUploadDraggedOverCardColor}")

    span.card-content-wrap
      .card-content
        .audio-wrap(v-if="Boolean(formats.audio)")
          Audio(:visible="Boolean(formats.audio)" :url="formats.audio" @isPlaying="updateIsPlayingAudio" :selectedColor="selectedColor" :normalizedName="normalizedName")
        .name-wrap
          //- [·]
          .checkbox-wrap(v-if="hasCheckbox" @click.left.prevent.stop="toggleCardChecked" @touchend.prevent.stop="toggleCardChecked")
            label(:class="{active: isChecked, disabled: !canEditSpace}")
              input(type="checkbox" v-model="checkboxState")

          //- Name
          p.name.name-segments(v-if="normalizedName" :style="{background: selectedColor, minWidth: nameLineMinWidth + 'px'}" :class="{'is-checked': isChecked, 'has-checkbox': hasCheckbox}")
            template(v-for="segment in nameSegments")
              span(v-if="segment.isText && segment.content") {{segment.content}}
              //- Tags
              span.badge.button-badge(
                v-if="segment.isTag"
                :style="{backgroundColor: segment.color}"
                :class="{ active: currentSelectedTag.name === segment.name }"
                @click.left="showTagDetailsIsVisible($event, segment)"
                @touchend="showTagDetailsIsVisible($event, segment)"
                @keyup.stop.enter="showTagDetailsIsVisible($event, segment)"
                :data-tag-id="segment.id"
              ) {{segment.name}}

      //- Right buttons
      span.card-buttons-wrap
        //- Link
        a.link-wrap(:href="linkOrUrl" @click.left.stop="closeAllDialogs" @touchend="openUrl(linkOrUrl)" v-if="linkOrUrl")
          .link
            button(:style="{background: selectedColor}" tabindex="-1")
              img.icon.visit.arrow-icon(src="@/assets/visit.svg")
        //- Connector
        .connector(
          :data-card-id="id"
          @mousedown.left="startConnecting"
          @touchstart="startConnecting"
        )
          button(:class="{ active: isConnectingTo || isConnectingFrom}" :style="{background: selectedColor}" tabindex="-1")
            .connected-colors
              template(v-if="isConnectingTo || isConnectingFrom")
                .color(:style="{ background: newConnectionColor}")
              template(v-else-if="isRemoteConnecting")
                .color(:style="{ background: remoteConnectionColor }")
              template(v-else v-for="type in connectionTypes")
                .color(:style="{ background: type.color}")

            template(v-if="hasConnections")
              img.connector-icon(src="@/assets/connector-closed.svg")
            template(v-else)
              img.connector-icon(src="@/assets/connector-open.svg")

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

  CardDetails(:card="card" @broadcastShowCardDetails="broadcastShowCardDetails")

  //- Meta Info
  .meta-container(v-if="filterShowUsers || filterShowDateUpdated")
    //- User
    .badge-wrap
      .badge.user-badge.button-badge(
        v-if="filterShowUsers"
        :style="{background: updatedByUser.color}"
        @mouseup.left.stop
        @touchend.stop
        @click.left.prevent.stop="toggleUserDetailsIsVisible"
        @touchend.prevent.stop="toggleUserDetailsIsVisible"
      )
        User(:user="updatedByUser" :isClickable="false")
        .name {{updatedByUser.name}}
      UserDetails(:visible="userDetailsIsVisible" :user="updatedByUser" :dialogIsReadOnly="true")
    //- Date
    .badge.secondary.button-badge(v-if="filterShowDateUpdated" @click.left.prevent.stop="toggleFilterShowAbsoluteDates" @touchend.prevent.stop="toggleFilterShowAbsoluteDates")
      img.icon.time(src="@/assets/time.svg")
      .name {{dateUpdatedAt}}

</template>

<script>
import utils from '@/utils.js'
import CardDetails from '@/components/dialogs/CardDetails.vue'
import Frames from '@/components/Frames.vue'
import Loader from '@/components/Loader.vue'
import Audio from '@/components/Audio.vue'
import scrollIntoView from '@/scroll-into-view.js'
import User from '@/components/User.vue'
import UserDetails from '@/components/dialogs/UserDetails.vue'

import fromNow from 'fromnow'

let isMultiTouch

export default {
  components: {
    CardDetails,
    Frames,
    Loader,
    Audio,
    User,
    UserDetails
  },
  props: {
    card: Object
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updateRemoteCurrentConnection' || mutation.type === 'removeRemoteCurrentConnection') {
        this.updateRemoteConnections()
      }
      if (mutation.type === 'triggerScrollCardIntoView') {
        if (mutation.payload === this.card.id) {
          const element = this.$refs.card
          const isTouchDevice = this.$store.state.isTouchDevice
          scrollIntoView.scroll(element, isTouchDevice)
          scrollIntoView.scroll(element, isTouchDevice)
        }
      }
      if (mutation.type === 'closeAllDialogs') {
        this.userDetailsIsVisible = false
      }
    })
  },
  data () {
    return {
      isRemoteConnecting: false,
      remoteConnectionColor: '',
      uploadIsDraggedOver: false,
      isPlayingAudio: false,
      userDetailsIsVisible: false,
      preventDraggedTagFromShowingDetails: false,
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
        link: ''
      }
    }
  },
  computed: {
    currentSelectedTag () { return this.$store.state.currentSelectedTag },
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    id () { return this.card.id },
    x () { return this.card.x },
    y () { return this.card.y },
    z () { return this.card.z },
    connectionTypes () { return this.$store.getters['currentSpace/cardConnectionTypes'](this.id) },
    newConnectionColor () { return this.$store.state.currentConnectionColor },
    name () { return this.card.name },
    frameId () { return this.card.frameId },
    filterShowUsers () { return this.$store.state.currentUser.filterShowUsers },
    filterShowDateUpdated () { return this.$store.state.currentUser.filterShowDateUpdated },
    updatedByUser () {
      const userId = this.card.nameUpdatedByUserId || this.card.userId
      const user = this.$store.getters['currentSpace/memberById'](userId)
      if (user) {
        return user
      } else {
        return {
          name: '',
          color: '#cdcdcd' // secondary-active-background
        }
      }
    },
    dateUpdatedAt () {
      const date = this.card.nameUpdatedAt
      const showAbsoluteDate = this.$store.state.currentUser.filterShowAbsoluteDates
      if (date) {
        if (showAbsoluteDate) {
          return new Date(date).toLocaleString()
        } else {
          return fromNow(date, { max: 1, suffix: true })
        }
      } else {
        return 'Just now'
      }
    },
    cardPendingUpload () {
      const pendingUploads = this.$store.state.upload.pendingUploads
      return pendingUploads.find(upload => upload.cardId === this.card.id)
    },
    remoteCardPendingUpload () {
      const remotePendingUploads = this.$store.state.remotePendingUploads
      return remotePendingUploads.find(upload => {
        const inProgress = upload.percentComplete < 100
        const isCard = upload.cardId === this.card.id
        return inProgress && isCard
      })
    },
    pendingUploadDataUrl () {
      if (!this.cardPendingUpload) { return }
      return this.cardPendingUpload.imageDataUrl
    },
    linkOrUrl () {
      if (!this.urls.length) { return }
      if (this.formats.link) {
        return this.formats.link
      } else {
        return this.urls[0]
      }
    },
    urls () {
      const urls = utils.urlsFromString(this.name)
      this.updateMediaUrls(urls)
      return urls || []
    },
    isVisualCard () { return this.formats.image || this.formats.video },
    cardHasMedia () { return this.formats.image || this.formats.video || this.formats.audio },
    cardHasUrls () {
      if (!this.urls.length) {
        return false
      } else {
        return true
      }
    },
    isChecked () { return utils.nameIsChecked(this.name) },
    hasCheckbox () { return utils.checkboxFromString(this.name) },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    checkboxState: {
      get () {
        return this.isChecked
      }
    },
    position () {
      return {
        left: `${this.x}px`,
        top: `${this.y}px`,
        zIndex: this.z
      }
    },
    canEditCard () {
      const isSpaceMember = this.$store.getters['currentUser/isSpaceMember']()
      const cardIsCreatedByCurrentUser = this.$store.getters['currentUser/cardIsCreatedByCurrentUser'](this.card)
      if (isSpaceMember) { return true }
      if (this.canEditSpace && cardIsCreatedByCurrentUser) { return true }
      return false
    },
    normalizedName () {
      // name without urls and checkbox text
      let name = this.name
      if (!name) { return }
      if (this.cardHasMedia) {
        name = name.replace(this.formats.image, '')
        name = name.replace(this.formats.video, '')
        name = name.replace(this.formats.audio, '')
      }
      // for music use cases
      const isLegacyHidden = this.formats.link.includes('kinopio=hide')
      const isHidden = this.formats.link.includes('hidden=true')
      if (isHidden || isLegacyHidden) {
        name = name.replace(this.formats.link, '')
        name = name.replace(utils.urlWithoutProtocol(this.formats.link), '')
      }
      const checkbox = utils.checkboxFromString(name)
      if (checkbox) {
        name = name.replace(checkbox, '')
      }
      return utils.trim(name)
    },
    nameSegments () {
      let segments = utils.cardNameSegments(this.normalizedName)
      return segments.map(segment => {
        if (segment.isTag) {
          let tag = this.$store.getters['currentSpace/tagByName'](segment.name)
          if (!tag) {
            tag = utils.newTag({
              name: segment.name,
              userColor: this.$store.state.currentUser.color,
              cardId: this.id,
              spaceId: this.$store.state.currentSpace.id
            })
            console.warn('🦚 create missing tag', segment.name, tag, this.card)
            this.$store.dispatch('currentSpace/addTag', tag)
          }
          segment.color = tag.color
          segment.id = tag.id
        }
        return segment
      })
    },
    tags () {
      return this.nameSegments.filter(segment => {
        if (segment.isTag) {
          return true
        }
      })
    },
    nameLineMinWidth () {
      const averageCharacterWidth = 6.5
      let maxWidth = 190
      if (this.cardHasUrls || this.hasCheckbox) {
        maxWidth = 162
      }
      if (this.cardHasUrls && this.hasCheckbox) {
        maxWidth = 132
      }
      if (!this.normalizedName) { return 0 }
      const width = this.longestNameLineLength() * averageCharacterWidth
      if (width <= maxWidth) {
        return width
      } else {
        return Math.min(width, maxWidth)
      }
    },
    isConnectingTo () {
      const currentConnectionSuccess = this.$store.state.currentConnectionSuccess
      if (currentConnectionSuccess) {
        return currentConnectionSuccess.cardId === this.id
      } else {
        return false
      }
    },
    isConnectingFrom () {
      const currentConnectionSuccess = this.$store.state.currentConnectionSuccess
      const currentConnection = this.$store.state.currentConnection
      if (currentConnectionSuccess) {
        return currentConnection.startCardId === this.id
      } else {
        return false
      }
    },
    isBeingDragged () {
      let isCardId
      const multipleCardsSelectedIds = this.$store.state.multipleCardsSelectedIds
      const currentDraggingCard = this.$store.state.currentDraggingCardId
      const isDraggingCard = this.$store.state.currentUserIsDraggingCard
      if (multipleCardsSelectedIds.includes(this.id) || currentDraggingCard === this.id) {
        isCardId = true
      }
      return Boolean(isDraggingCard && isCardId)
    },
    isSelected () {
      const multipleCardsSelectedIds = this.$store.state.multipleCardsSelectedIds
      return multipleCardsSelectedIds.includes(this.id)
    },
    isRemoteSelected () {
      const remoteCardsSelected = this.$store.state.remoteCardsSelected
      const selectedCard = remoteCardsSelected.find(card => card.cardId === this.id)
      return Boolean(selectedCard)
    },
    isRemoteCardDetailsVisible () {
      const remoteCardDetailsVisible = this.$store.state.remoteCardDetailsVisible
      const visibleCard = remoteCardDetailsVisible.find(card => card.cardId === this.id)
      return Boolean(visibleCard)
    },
    isRemoteCardDragging () {
      const remoteCardsDragging = this.$store.state.remoteCardsDragging
      const isDragging = remoteCardsDragging.find(card => card.cardId === this.id)
      return Boolean(isDragging)
    },
    selectedColor () {
      const color = this.$store.state.currentUser.color
      if (this.isSelected) {
        return color
      } else {
        return undefined
      }
    },
    selectedColorUpload () {
      const color = this.$store.state.currentUser.color
      if (this.uploadIsDraggedOver) {
        return color
      } else {
        return undefined
      }
    },
    remoteCardDetailsVisibleColor () {
      const remoteCardDetailsVisible = this.$store.state.remoteCardDetailsVisible
      const visibleCard = remoteCardDetailsVisible.find(card => card.cardId === this.id)
      if (visibleCard) {
        const user = this.$store.getters['currentSpace/memberById'](visibleCard.userId)
        return user.color
      } else {
        return undefined
      }
    },
    remoteSelectedColor () {
      const remoteCardsSelected = this.$store.state.remoteCardsSelected
      const selectedCard = remoteCardsSelected.find(card => card.cardId === this.id)
      if (selectedCard) {
        const user = this.$store.getters['currentSpace/memberById'](selectedCard.userId)
        return user.color
      } else {
        return undefined
      }
    },
    remoteCardDraggingColor () {
      const remoteCardsDragging = this.$store.state.remoteCardsDragging
      const draggingCard = remoteCardsDragging.find(card => card.cardId === this.id)
      if (draggingCard) {
        const user = this.$store.getters['currentSpace/memberById'](draggingCard.userId)
        return user.color
      } else {
        return undefined
      }
    },
    remoteUploadDraggedOverCardColor () {
      const remoteUploadDraggedOverCards = this.$store.state.remoteUploadDraggedOverCards
      const draggedOverCard = remoteUploadDraggedOverCards.find(card => card.cardId === this.id)
      if (draggedOverCard) {
        const user = this.$store.getters['currentSpace/memberById'](draggedOverCard.userId)
        return user.color
      } else {
        return undefined
      }
    },
    hasConnections () {
      const connections = this.$store.getters['currentSpace/cardConnections'](this.id)
      return Boolean(connections.length)
    },

    // filters
    filtersIsActive () {
      const types = this.$store.state.filteredConnectionTypeIds
      const frames = this.$store.state.filteredFrameIds
      const tags = this.$store.state.filteredTagNames
      return Boolean(types.length + frames.length + tags.length)
    },
    isCardFilteredByTags () {
      const tagNames = this.$store.state.filteredTagNames
      const isFiltered = this.tags.find(tag => {
        if (tagNames.includes(tag.name)) {
          return true
        }
      })
      return isFiltered
    },
    isConnectionFilteredByType () {
      const typeIds = this.$store.state.filteredConnectionTypeIds
      const filteredTypes = this.connectionTypes.filter(type => {
        return typeIds.includes(type.id)
      })
      return Boolean(filteredTypes.length)
    },
    isCardFilteredByFrame () {
      const frameIds = this.$store.state.filteredFrameIds
      return frameIds.includes(this.frameId)
    },
    isFiltered () {
      if (this.filtersIsActive) {
        const isInFilter = this.isCardFilteredByTags || this.isConnectionFilteredByType || this.isCardFilteredByFrame
        if (isInFilter) {
          return false
        } else {
          return true
        }
      } else { return false }
    }
  },
  methods: {
    selectAllConnectedCards (event) {
      const isMeta = event.metaKey || event.ctrlKey
      if (!isMeta) { return }
      if (!this.canEditSpace) { return }
      this.$store.dispatch('closeAllDialogs', 'Card.selectAllConnectedCards')
      const connections = this.$store.state.currentSpace.connections
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
      const position = utils.cursorPositionInPage(event)
      this.$store.commit('multipleSelectedActionsPosition', position)
      this.$store.commit('multipleSelectedActionsIsVisible', true)
      this.$store.commit('multipleCardsSelectedIds', selectedCards)
    },
    updateMediaUrls (urls) {
      this.formats.image = ''
      this.formats.video = ''
      this.formats.audio = ''
      this.formats.link = ''
      if (!urls.length) { return }
      urls.forEach(url => {
        if (utils.urlIsImage(url)) {
          this.formats.image = url
        } else if (utils.urlIsVideo(url)) {
          this.formats.video = url
        } else if (utils.urlIsAudio(url)) {
          this.formats.audio = url
        } else {
          this.formats.link = url
        }
      })
    },
    updateIsPlayingAudio (value) {
      this.isPlayingAudio = value
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
          userId: this.$store.state.currentUser.id
        }
        this.$store.commit('broadcast/updateStore', { updates, type: 'addToRemoteUploadDraggedOverCards' })
      }
    },
    removeUploadIsDraggedOver () {
      this.uploadIsDraggedOver = false
      const userId = this.$store.state.currentUser.id
      this.$store.commit('broadcast/updateStore', { updates: { userId }, type: 'clearRemoteUploadDraggedOverCards' })
    },
    async uploadFile (event) {
      this.removeUploadIsDraggedOver()
      this.$store.dispatch('currentSpace/incrementCardZ', this.id)
      // pre-upload errors
      if (!this.currentUserIsSignedIn) {
        this.error.signUpToUpload = true
        this.$store.commit('addNotification', { message: 'To upload files, you need to Sign Up or In', type: 'info' })
        return
      }
      if (!this.canEditSpace) {
        this.error.spaceIsReadOnly = true
        this.$store.commit('addNotification', { message: 'You can only upload files on spaces you can edit', type: 'info' }, { root: true })
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
      if (!this.canEditSpace) { return }
      const value = !this.isChecked
      this.$store.dispatch('closeAllDialogs', 'Card.toggleCardChecked')
      this.$store.dispatch('currentSpace/toggleCardChecked', { cardId: this.id, value })
      this.$store.commit('currentUserIsDraggingCard', false)
    },
    toggleUserDetailsIsVisible () {
      if (isMultiTouch) { return }
      const value = !this.userDetailsIsVisible
      this.$store.dispatch('closeAllDialogs', 'Card.toggleUserDetailsIsVisible')
      this.$store.dispatch('currentSpace/incrementCardZ', this.id)
      this.$store.commit('currentUserIsDraggingCard', false)
      this.userDetailsIsVisible = value
      this.$nextTick(() => {
        if (this.userDetailsIsVisible) {
          const element = document.querySelector('dialog.user-details')
          const isTouchDevice = this.$store.state.isTouchDevice
          scrollIntoView.scroll(element, isTouchDevice)
        }
      })
    },
    toggleFilterShowAbsoluteDates () {
      this.$store.dispatch('currentSpace/incrementCardZ', this.id)
      this.$store.dispatch('closeAllDialogs', 'Card.toggleFilterShowAbsoluteDates')
      const value = !this.$store.state.currentUser.filterShowAbsoluteDates
      this.$store.dispatch('currentUser/toggleFilterShowAbsoluteDates', value)
    },
    updateRemoteConnections () {
      const remoteCurrentConnections = this.$store.state.remoteCurrentConnections
      const connection = remoteCurrentConnections.find(remoteConnection => {
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
      let name = this.normalizedName
      if (!name) { return 0 }
      name = name.replaceAll('[[', '')
      name = name.replaceAll(']]', '')
      name = name || '.'
      const nameLines = name.match(/[^\n]+/g)
      let longestLineLength = 0
      nameLines.forEach(line => {
        if (line.length > longestLineLength) {
          longestLineLength = line.length
        }
      })
      return longestLineLength
    },
    removeCard () {
      if (this.canEditCard) {
        this.$store.dispatch('currentSpace/removeCard', this.card)
      }
    },
    closeAllDialogs () {
      this.$store.dispatch('closeAllDialogs', 'Card.closeAllDialogs')
    },
    createCurrentConnection (event) {
      const cursor = utils.cursorPositionInViewport(event)
      this.$store.commit('currentConnection', {
        startCardId: this.id
      })
      this.$store.commit('currentConnectionCursorStart', cursor)
    },
    addConnectionType (event) {
      const typePref = this.$store.state.currentUser.defaultConnectionTypeId
      const defaultType = this.$store.getters['currentSpace/connectionTypeById'](typePref)
      if (defaultType || event.shiftKey) { return }
      this.$store.dispatch('currentSpace/addConnectionType')
    },
    startConnecting (event) {
      if (!this.canEditSpace) { return }
      if (utils.isMultiTouch(event)) { return }
      this.$store.dispatch('closeAllDialogs', 'Card.startConnecting')
      this.$store.commit('preventDraggedCardFromShowingDetails', true)
      this.$store.dispatch('clearMultipleSelected')
      if (!this.$store.state.currentUserIsDrawingConnection) {
        this.addConnectionType(event)
        this.createCurrentConnection(event)
      }
      this.$store.commit('currentUserIsDrawingConnection', true)
    },
    checkIfShouldDragMultipleCards () {
      const multipleCardsSelectedIds = this.$store.state.multipleCardsSelectedIds
      if (!multipleCardsSelectedIds.includes(this.id)) {
        this.$store.dispatch('clearMultipleSelected')
      }
    },
    startDraggingCard (event) {
      isMultiTouch = false
      if (!this.canEditCard) { return }
      if (utils.isMultiTouch(event)) {
        isMultiTouch = true
        return
      }
      event.preventDefault()
      if (this.$store.state.currentUserIsDrawingConnection) { return }
      this.$store.dispatch('closeAllDialogs', 'Card.startDraggingCard')
      this.$store.commit('currentUserIsDraggingCard', true)
      this.$store.commit('currentDraggingCardId', this.id)
      const updates = {
        cardId: this.card.id,
        userId: this.$store.state.currentUser.id
      }
      this.$store.commit('broadcast/updateStore', { updates, type: 'addToRemoteCardsDragging' })
      this.$store.commit('parentCardId', this.id)
      this.$store.commit('childCardId', '')
      this.checkIfShouldDragMultipleCards()
      this.$store.dispatch('currentSpace/incrementSelectedCardsZ')
    },
    showCardDetails (event) {
      if (isMultiTouch) { return }
      if (!this.canEditCard) { this.$store.commit('triggerReadOnlyJiggle') }
      const userId = this.$store.state.currentUser.id
      this.$store.commit('broadcast/updateStore', { updates: { userId }, type: 'clearRemoteCardsDragging' })
      this.preventDraggedTagFromShowingDetails = this.$store.state.preventDraggedCardFromShowingDetails
      if (this.$store.state.preventDraggedCardFromShowingDetails) { return }
      this.$store.dispatch('closeAllDialogs', 'Card.showCardDetails')
      this.$store.dispatch('clearMultipleSelected')
      this.$store.dispatch('currentSpace/incrementCardZ', this.id)
      if (event.target.nodeName === 'LABEL') { return }
      this.$store.commit('cardDetailsIsVisibleForCardId', this.id)
      this.$store.commit('parentCardId', this.id)
      event.stopPropagation() // only stop propagation if cardDetailsIsVisible
      this.$store.commit('currentUserIsDraggingCard', false)
      this.broadcastShowCardDetails()
    },
    showTagDetailsIsVisible (event, tag) {
      if (isMultiTouch) { return }
      if (!this.canEditCard) { this.$store.commit('triggerReadOnlyJiggle') }
      if (this.preventDraggedTagFromShowingDetails) { return }
      this.$store.dispatch('currentSpace/incrementCardZ', this.id)
      this.$store.dispatch('closeAllDialogs', 'Card.showTagDetailsIsVisible')
      this.$store.commit('currentUserIsDraggingCard', false)
      const tagRect = event.target.getBoundingClientRect()
      this.$store.commit('tagDetailsPosition', {
        x: window.scrollX + tagRect.x + 2,
        y: window.scrollY + tagRect.y + tagRect.height - 2
      })
      tag.cardId = this.id
      this.$store.commit('currentSelectedTag', tag)
      this.$store.commit('tagDetailsIsVisible', true)
    },
    openUrl (url) {
      window.location.href = url
    },
    broadcastShowCardDetails () {
      const updates = {
        cardId: this.card.id,
        userId: this.$store.state.currentUser.id
      }
      this.$store.commit('broadcast/updateStore', { updates, type: 'updateRemoteCardDetailsVisible' })
    }
  }
}
</script>

<style lang="stylus">
article
  pointer-events all
  position absolute
  max-width 235px
  .card
    border-radius 3px
    user-select none
    background-color var(--secondary-background)
    max-width 235px
    cursor pointer
    touch-action manipulation
    &:hover,
    &.hover
      box-shadow var(--hover-shadow)
    &:active,
    &.active
      box-shadow var(--active-shadow)
    .card-content-wrap
      display flex
      align-items flex-start
    .card-content
      min-width 40px
    .card-buttons-wrap
      display flex
    .name-wrap
      display flex
      align-items flex-start
      .checkbox-wrap
        padding-top 8px
        padding-left 8px
        label
          width 20px
          height 16px
          display flex
          align-items center
          padding-left 4px
          padding-right 4px
          input
            margin 0
            width 10px
            height 10px
            background-size contain
      .name
        margin 8px
        margin-right 0
        align-self stretch
        word-break break-word
        white-space pre-line
        &.is-checked
          text-decoration line-through
        &.has-checkbox
          .audio
            width 132px

    .connector,
    .link
      padding 8px
      align-self right
      cursor cell
      button
        background-color transparent
        cursor cell
        position relative
        width 20px
        height 16px
        vertical-align top
        background-color var(--secondary-background)
      &:hover
        button
          box-shadow 3px 3px 0 var(--heavy-shadow)
          background var(--secondary-hover-background)
      &:active
        button
          box-shadow none
          color var(--primary)
          background var(--secondary-active-background)
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
      left 0
      top 0
      display flex
      height 100%
      width 100%
      border-radius 2px
      overflow hidden
      .color
        width 100%
    .connector-icon
      position absolute
      left 4px
      top 2px
    .arrow-icon
      position absolute
      left 5px
      top 3.5px
    .link
      cursor pointer
      padding-right 0
      button
        cursor pointer
        span
          top -3px
          position relative

    .link-wrap
      max-height 28px

    .uploading-container
      position absolute
      top 6px
      left 6px

    &.media-card
      width 235px
      background-color transparent
      &:hover,
      &.hover
        background-color var(--secondary-background)
      &:active,
      &.active
        background-color var(--secondary-background)
      .image,
      video
        border-radius 3px
        display block
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
      width 235px
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

    .audio-wrap
      margin-top 8px
      margin-left 8px

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
          margin-top 1px
    .badge + .badge,
    .badge-wrap + .badge
      margin-left 6px

@keyframes bounce
  0%
    transform translateY(0)
  50%
    transform translateY(4px)
  100%
    transform translateY(0)

.jiggle
  animation jiggle 0.5s infinite ease-out forwards
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
