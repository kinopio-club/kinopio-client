<template lang="pug">
article(:style="position" :data-card-id="id")
  .card(
    @mousedown.prevent="startDraggingCard"
    @touchstart.prevent="startDraggingCard"
    @mouseup="showCardDetails"
    @touchend="showCardDetails"
    :class="{jiggle: isConnectingTo || isConnectingFrom || isBeingDragged, active: isConnectingTo || isConnectingFrom || isBeingDragged}",
    :style="selectedColor"
    :data-card-id="id"
    :data-card-x="x"
    :data-card-y="y"
  )
    p.name {{name}}
    .connector(
      :data-card-id="id"
      @mousedown="startConnecting"
      @touchstart="startConnecting"
    )
      button(:class="{ active: isConnectingTo || isConnectingFrom}")
        .connected-colors
          template(v-for="type in connectionTypes")
            .color(:style="{ background: type.color}")
        template(v-if="hasConnections")
          img.connector-icon(src="@/assets/connector-closed.svg")
        template(v-else)
          img.connector-icon(src="@/assets/connector-open.svg")

  CardDetails(
    :card="card"
  )
</template>

<script>
import utils from '@/utils.js'
import CardDetails from '@/components/dialogs/CardDetails.vue'

export default {
  components: {
    CardDetails
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
    position () {
      return {
        left: `${this.x}px`,
        top: `${this.y}px`,
        zIndex: this.z
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
      const multipleCardsSelected = this.$store.state.multipleCardsSelected
      const currentDraggingCard = this.$store.state.currentDraggingCardId
      const isDraggingCard = this.$store.state.currentUserIsDraggingCard
      if (multipleCardsSelected.includes(this.id) || currentDraggingCard === this.id) {
        isCardId = true
      }
      return Boolean(isDraggingCard && isCardId)
    },
    selectedColor () {
      const multipleCardsSelected = this.$store.state.multipleCardsSelected
      const color = this.$store.state.currentUser.color
      if (multipleCardsSelected.includes(this.id)) {
        return { background: color }
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
      const typePref = utils.getUserPref('defaultConnectionTypeId')
      const defaultType = this.$store.getters['currentSpace/connectionTypeById'](typePref)
      if (!defaultType) {
        this.$store.commit('currentSpace/addConnectionType', {})
      }
    },
    startConnecting (event) {
      this.$store.commit('closeAllDialogs')
      this.$store.commit('preventDraggedCardFromShowingDetails', true)
      this.$store.commit('multipleCardsSelected', [])
      if (!this.$store.state.currentUserIsDrawingConnection) {
        this.addConnectionType()
        this.createCurrentConnection(event)
      }
      this.$store.commit('currentUserIsDrawingConnection', true)
    },
    checkIfShouldDragMultipleCards () {
      const multipleCardsSelected = this.$store.state.multipleCardsSelected
      if (!multipleCardsSelected.includes(this.id)) {
        this.$store.commit('multipleCardsSelected', [])
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
      this.$store.commit('currentSpace/cardDetailsVisible', this.id)
      event.stopPropagation() // only stop propagation if cardDetailsVisible
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
  display flex
  align-items flex-start
  background-color var(--secondary-background)
  max-width 235px
  cursor pointer
  &:hover,
  &.hover
    box-shadow var(--hover-shadow)
  &:active,
  &.active
    box-shadow var(--active-shadow)
  .name
    margin 8px
    margin-right 5px
    align-self stretch
    min-width 25px
    overflow hidden
    // multi-line wrapping
    // display -webkit-box
    // -webkit-box-orient vertical
    // -webkit-line-clamp 3
  .connector
    padding 8px
    align-self right
    cursor cell
    button
      cursor cell
      position relative
      width: 20px
      height: 16px
      vertical-align top
    &:hover
      button
        box-shadow 3px 3px 0 rgba(0,0,0,0.25)
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
