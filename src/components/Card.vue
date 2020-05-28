<template lang="pug">
article(:style="position" :data-card-id="id")
  .card(
    @mousedown.prevent="startDraggingCard"
    @touchstart.prevent="startDraggingCard"
    @mouseup="showCardDetails"
    @touchend="showCardDetails"
    @keyup.stop.enter="showCardDetails"
    @keyup.stop.backspace="removeCard"
    :class="{jiggle: isConnectingTo || isConnectingFrom || isRemoteConnecting || isBeingDragged || isRemoteCardDragging, active: isConnectingTo || isConnectingFrom || isRemoteConnecting || isBeingDragged, 'filtered': isFiltered, 'media-card': isMediaCard}",
    :style="{background: selectedColor || remoteCardDetailsVisibleColor || remoteSelectedColor || remoteCardDraggingColor}"
    :data-card-id="id"
    :data-card-x="x"
    :data-card-y="y"
    tabindex="0"
  )
    Frames(:card="card")

    video(v-if="urlIsVideo" autoplay loop muted playsinline :key="url" :class="{selected: isSelected || isRemoteSelected || isRemoteCardDetailsVisible || isRemoteCardDragging}")
      source(:src="url")
    img.image(v-if="urlIsImage" :src="url" :class="{selected: isSelected || isRemoteSelected || isRemoteCardDetailsVisible || isRemoteCardDragging}")

    span.card-content-wrap
      .name-wrap
        //- [·]
        .label-wrap(v-if="hasCheckbox")
          label(:class="{active: isChecked, disabled: !canEditSpace}")
            input(type="checkbox" v-model="checkboxState")
        //- Name
        p.name(:style="{background: selectedColor, minWidth: nameLineMinWidth + 'px'}" :class="{'is-checked': isChecked}")
          span {{normalizedName}}

      span.card-buttons-wrap
        //- Link
        a(:href="url" @click.stop @touchend="openUrl(url)" v-if="url")
          .link
            button(:style="{background: selectedColor}" tabindex="-1")
              img.icon.visit.arrow-icon(src="@/assets/visit.svg")
        //- Connector
        .connector(
          :data-card-id="id"
          @mousedown="startConnecting"
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

  CardDetails(:card="card" @broadcastShowCardDetails="broadcastShowCardDetails")
</template>

<script>
import utils from '@/utils.js'
import CardDetails from '@/components/dialogs/CardDetails.vue'
import Frames from '@/components/Frames.vue'

export default {
  components: {
    CardDetails,
    Frames
  },
  props: {
    card: Object
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updateRemoteCurrentConnection' || mutation.type === 'removeRemoteCurrentConnection') {
        this.updateRemoteConnections()
      }
    })
  },
  data () {
    return {
      isRemoteConnecting: false,
      remoteConnectionColor: ''
    }
  },
  computed: {
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    id () { return this.card.id },
    x () { return this.card.x },
    y () { return this.card.y },
    z () { return this.card.z },
    connectionTypes () { return this.$store.getters['currentSpace/cardConnectionTypes'](this.id) },
    newConnectionColor () { return this.$store.state.currentConnectionColor },
    name () { return this.card.name },
    frameId () { return this.card.frameId },
    url () { return utils.urlFromString(this.name) },
    urlIsImage () { return utils.urlIsImage(this.url) },
    urlIsVideo () { return utils.urlIsVideo(this.url) },
    isMediaCard () { return this.urlIsImage || this.urlIsVideo },
    isChecked () { return utils.nameIsChecked(this.name) },
    hasCheckbox () { return utils.checkboxFromString(this.name) },
    checkboxState: {
      get () {
        return this.isChecked
      },
      set (value) {
        this.$store.dispatch('closeAllDialogs')
        // this.$store.dispatch('clearMultipleSelected')
        this.$store.dispatch('currentSpace/toggleCardChecked', { cardId: this.id, value })
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
      let name = this.name
      if (this.isMediaCard) {
        name = name.replace(this.url, '')
      }
      const checkbox = utils.checkboxFromString(name)
      if (checkbox) {
        name = name.replace(checkbox, '')
      }
      return utils.trim(name)
    },
    nameLineMinWidth () {
      const averageCharacterWidth = 6.5
      let maxWidth = 190
      if (this.url || this.hasCheckbox) {
        maxWidth = 162
      }
      if (this.url && this.hasCheckbox) {
        maxWidth = 132
      }
      if (!this.normalizedName.trim()) { return 0 }
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
    hasConnections () {
      const connections = this.$store.getters['currentSpace/cardConnections'](this.id)
      return Boolean(connections.length)
    },

    // filters
    filtersIsActive () {
      const types = this.$store.state.filteredConnectionTypeIds
      const frames = this.$store.state.filteredFrameIds
      return Boolean(types.length + frames.length)
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
        const isInFilter = this.isCardFilteredByFrame || this.isConnectionFilteredByType
        if (isInFilter) {
          return false
        } else {
          return true
        }
      } else { return false }
    }
  },
  methods: {
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
      const nameLines = this.normalizedName.match(/[^\n]+/g)
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
    createCurrentConnection (event) {
      const cursor = utils.cursorPositionInViewport(event)
      this.$store.commit('currentConnection', {
        startCardId: this.id
      })
      this.$store.commit('currentConnectionCursorStart', cursor)
    },
    addConnectionType () {
      const typePref = this.$store.state.currentUser.defaultConnectionTypeId
      const defaultType = this.$store.getters['currentSpace/connectionTypeById'](typePref)
      if (!defaultType) {
        this.$store.dispatch('currentSpace/addConnectionType')
      }
    },
    startConnecting (event) {
      if (!this.canEditSpace) { return }
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('preventDraggedCardFromShowingDetails', true)
      this.$store.dispatch('clearMultipleSelected')
      if (!this.$store.state.currentUserIsDrawingConnection) {
        this.addConnectionType()
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
    startDraggingCard () {
      if (!this.canEditCard) { return }
      if (this.$store.state.currentUserIsDrawingConnection) { return }
      this.$store.dispatch('closeAllDialogs')
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
      if (event.target.nodeName === 'LABEL') { return }
      const userId = this.$store.state.currentUser.id
      this.$store.commit('broadcast/updateStore', { updates: { userId }, type: 'clearRemoteCardsDragging' })
      if (this.$store.state.preventDraggedCardFromShowingDetails) { return }
      this.$store.commit('currentUserIsDraggingCard', false)
      this.$store.dispatch('closeAllDialogs')
      // this.$store.dispatch('clearMultipleSelected')
      this.$store.dispatch('currentSpace/incrementCardZ', this.id)
      this.$store.commit('cardDetailsIsVisibleForCardId', this.id)
      this.$store.commit('parentCardId', this.id)
      event.stopPropagation() // only stop propagation if cardDetailsIsVisible
      this.broadcastShowCardDetails()
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
  .card-buttons-wrap
    display flex
  .name-wrap
    display flex
    align-items flex-start
    .label-wrap
      padding-top 8px
      padding-left 8px
      label
        width 20px
        height 16px
        input
          margin 0
          transform translateX(-3px) translateY(-5px)
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
