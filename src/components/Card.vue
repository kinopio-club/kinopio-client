<template lang="pug">
article(:style="position" :data-card-id="id")
  .card(
    @mousedown.prevent="startDraggingCard"
    @touchstart.prevent="startDraggingCard"
    @mouseup="showCardDetails"
    @touchend="showCardDetails"
    :class="{jiggle: isConnectingTo || isConnectingFrom || isBeingDragged, active: isConnectingTo || isConnectingFrom || isBeingDragged, 'filtered': isFiltered, 'media-card': isMediaCard}",
    :style="{background: selectedColor}"
    :data-card-id="id"
    :data-card-x="x"
    :data-card-y="y"
  )
    Frames(:card="card")

    img.image(v-if="urlIsImage" :src="url" :class="{selected: isSelected}")

    span.card-content-wrap
      p.name(:style="{background: selectedColor, minWidth: nameLineMinWidth + 'px'}") {{normalizedName}}
      span.card-buttons-wrap
        a(:href="url" @click.stop @touchend="openUrl(url)" v-if="url")
          .link
            button(:style="{background: selectedColor}")
              img.icon.move.arrow-icon(src="@/assets/move.svg")
        .connector(
          :data-card-id="id"
          @mousedown="startConnecting"
          @touchstart="startConnecting"
        )
          button(:class="{ active: isConnectingTo || isConnectingFrom}" :style="{background: selectedColor}")
            .connected-colors
              template(v-for="type in connectionTypes")
                .color(:style="{ background: type.color}")
            template(v-if="hasConnections")
              img.connector-icon(src="@/assets/connector-closed.svg")
            template(v-else)
              img.connector-icon(src="@/assets/connector-open.svg")

  CardDetails(:card="card")
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
  computed: {
    id () { return this.card.id },
    x () { return this.card.x },
    y () { return this.card.y },
    z () { return this.card.z },
    name () { return this.card.name },
    frameId () { return this.card.frameId },
    position () {
      return {
        left: `${this.x}px`,
        top: `${this.y}px`,
        zIndex: this.z
      }
    },
    normalizedName () {
      if (this.urlIsImage) {
        return this.name.replace(this.url, '')
      }
      return this.name
    },
    nameLineMinWidth () {
      const averageCharacterWidth = 7
      let maxWidth = 186
      if (this.url) {
        maxWidth = 160
      }
      const width = this.normalizedName.trim().length * averageCharacterWidth
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
    selectedColor () {
      const color = this.$store.state.currentUser.color
      if (this.isSelected) {
        return color
      } else {
        return undefined
      }
    },
    connectionTypes () {
      return this.$store.getters['currentSpace/cardConnectionTypes'](this.id)
    },
    hasConnections () {
      const connections = this.$store.getters['currentSpace/cardConnections'](this.id)
      return Boolean(connections.length)
    },
    url () {
      if (!this.name) { return }
      // adapted from https://www.regextester.com/1965
      // optionally starts with http/s protocol
      // followed by alphanumerics
      // then '.''
      // followed by alphanumerics
      const urlPattern = new RegExp(/(http[s]?:\/\/)?[^\s(["<,>]*\.[^\s.[",><]+/igm)
      const urls = this.name.match(urlPattern)
      if (!urls) { return }
      const url = urls[0]
      const hasProtocol = url.startsWith('http://') || url.startsWith('https://')
      if (hasProtocol) {
        return url
      } else {
        return `http://${url}`
      }
    },
    isMediaCard () {
      return this.urlIsImage || this.urlIsPlayableVideo
    },
    urlIsImage () {
      if (!this.url) { return }
      // https://regexr.com/4rjtu
      // match an extension
      // which much be followed by either end of line, space, or ? (for qs) char
      const imageUrlPattern = new RegExp(/(?:\.gif|\.jpg|\.jpeg|\.png)(?:\n| |\?|&)/igm)
      const isImage = this.url.match(imageUrlPattern)
      return Boolean(isImage)
    },
    urlIsPlayableVideo () {
      if (!this.url) { return }
      return this.url.endsWith('.mp4')
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
      this.$store.commit('closeAllDialogs')
      this.$store.commit('preventDraggedCardFromShowingDetails', true)
      this.$store.commit('clearMultipleSelected')
      if (!this.$store.state.currentUserIsDrawingConnection) {
        this.addConnectionType()
        this.createCurrentConnection(event)
      }
      this.$store.commit('currentUserIsDrawingConnection', true)
    },
    checkIfShouldDragMultipleCards () {
      const multipleCardsSelectedIds = this.$store.state.multipleCardsSelectedIds
      if (!multipleCardsSelectedIds.includes(this.id)) {
        this.$store.commit('clearMultipleSelected')
      }
    },
    startDraggingCard () {
      if (this.$store.state.currentUserIsDrawingConnection) { return }
      this.$store.commit('closeAllDialogs')
      this.$store.commit('currentUserIsDraggingCard', true)
      this.$store.commit('currentDraggingCardId', this.id)
      this.checkIfShouldDragMultipleCards()
      this.$store.dispatch('currentSpace/incrementSelectedCardsZ')
    },
    showCardDetails (event) {
      if (this.$store.state.preventDraggedCardFromShowingDetails) { return }
      this.$store.commit('currentUserIsDraggingCard', false)
      this.$store.commit('closeAllDialogs')
      this.$store.commit('cardDetailsIsVisibleForCardId', this.id)
      event.stopPropagation() // only stop propagation if cardDetailsIsVisible
    },
    openUrl (url) {
      window.location.href = url
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
  .name
    margin 8px
    margin-right 5px
    align-self stretch
    word-break: break-word
    // multi-line wrapping
    // display -webkit-box
    // -webkit-box-orient vertical
    // -webkit-line-clamp 3
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
    .image
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
