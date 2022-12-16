<template lang="pug">
.connection-label.badge(
  v-if="visible"
  :style="styles"
  @click.left="showConnectionDetails"
  @touchend.stop="showConnectionDetails"
  @touchstart="checkIsMultiTouch"
  :data-id="id"
  @mouseover.left="hover = true"
  @mouseleave.left="hover = false"
  :class="{filtered: isFiltered}"
  ref="label"
)
  span(:class="{ 'is-dark': isDark }") {{typeName}}
</template>

<script>
import utils from '@/utils.js'

import { mapState, mapGetters } from 'vuex'

let isMultiTouch

export default {
  name: 'ConnectionLabel',
  props: {
    connection: Object
  },
  mounted () {
    this.setPosition()
  },
  data () {
    return {
      position: {},
      hover: false
    }
  },
  computed: {
    ...mapState([
      'filteredConnectionTypeIds',
      'filteredFrameIds',
      'currentUserIsDraggingCard',
      'multipleCardsSelectedIds',
      'currentDraggingCardId',
      'remoteCardsDragging',
      'remoteCardsSelected'
    ]),
    ...mapGetters([
      'spaceZoomDecimal',
      'currentConnections/typeByTypeId',
      'currentUser/canEditSpace',
      'currentCards/all',
      'currentCards/byId',
      'spaceCounterZoomDecimal'
    ]),
    visible () { return this.connection.labelIsVisible && !this.isUpdatingPath },
    styles () {
      return {
        background: this.typeColor,
        left: (this.position.left * this.spaceZoomDecimal) + 'px',
        top: (this.position.top * this.spaceZoomDecimal) + 'px',
        transform: `scale(${this.spaceZoomDecimal})`
      }
    },
    id () { return this.connection.id },
    connectionTypeId () { return this.connection.connectionTypeId },
    connectionType () { return this['currentConnections/typeByTypeId'](this.connectionTypeId) },
    typeColor () {
      if (this.connectionType) {
        return this.connectionType.color
      } else {
        return 'transparent'
      }
    },
    typeName () {
      if (this.connectionType) {
        return this.connectionType.name
      } else {
        return ''
      }
    },
    path () { return this.connection.path },
    canEditSpace () { return this['currentUser/canEditSpace']() },

    // filters
    filtersIsActive () {
      const types = this.filteredConnectionTypeIds
      const frames = this.filteredFrameIds
      return Boolean(types.length + frames.length)
    },
    isConnectionFilteredByType () {
      const typeIds = this.filteredConnectionTypeIds
      return typeIds.includes(this.connectionTypeId)
    },
    isCardsFilteredByFrame () {
      const frameIds = this.filteredFrameIds
      const cards = utils.clone(this['currentCards/all'])
      const startCardId = this.connection.startCardId
      const endCardId = this.connection.endCardId
      const startCard = cards.filter(card => card.id === startCardId)[0]
      const endCard = cards.filter(card => card.id === endCardId)[0]
      const startCardInFilter = frameIds.includes(startCard.frameId)
      const endCardInFilter = frameIds.includes(endCard.frameId)
      return startCardInFilter || endCardInFilter
    },
    isFiltered () {
      if (this.filtersIsActive) {
        const isInFilter = this.isCardsFilteredByFrame || this.isConnectionFilteredByType
        if (isInFilter) {
          return false
        } else {
          return true
        }
      } else { return false }
    },
    // from Connection.vue
    isUpdatingPath () {
      let shouldHide
      const currentUserIsDragging = this.currentUserIsDraggingCard
      let cards = []
      const multipleCardsSelectedIds = this.multipleCardsSelectedIds
      const currentCardId = this.currentDraggingCardId
      const remoteCardsDragging = utils.clone(this.remoteCardsDragging)
      const remoteCardsSelected = utils.clone(this.remoteCardsSelected)
      // local multiple
      if (multipleCardsSelectedIds.length && currentUserIsDragging) {
        cards = multipleCardsSelectedIds.map(id => this['currentCards/byId'](id))
      // local single
      } else if (currentCardId && currentUserIsDragging) {
        const currentCard = this['currentCards/byId'](currentCardId)
        cards = [currentCard]
      // remote multiple
      } else if (remoteCardsDragging.length && remoteCardsSelected.length) {
        cards = remoteCardsSelected.map(card => {
          card.id = card.cardId
          return card
        })
      // remote single
      } else if (remoteCardsDragging.length) {
        cards = remoteCardsDragging.map(card => {
          card.id = card.cardId
          return card
        })
      }
      cards = cards.filter(card => Boolean(card))
      cards.forEach(card => {
        if (card.id === this.connection.startCardId || card.id === this.connection.endCardId) {
          shouldHide = true
        }
      })
      return shouldHide
    },
    isDark () { return utils.colorIsDark(this.typeColor) }
  },
  methods: {
    checkIsMultiTouch (event) {
      isMultiTouch = false
      if (utils.isMultiTouch(event)) {
        isMultiTouch = true
      }
    },
    showConnectionDetails (event) {
      if (isMultiTouch) { return }
      this.$store.commit('triggerShowConnectionDetails', {
        connectionId: this.id,
        event
      })
    },
    setPosition () {
      this.$nextTick(() => {
        const zoom = this.spaceCounterZoomDecimal
        let connection = document.querySelector(`.connection-path[data-id="${this.id}"]`)
        if (!connection) { return }
        connection = connection.getBoundingClientRect()
        let label = this.$refs.label
        let labelOffset
        if (label) {
          label = label.getBoundingClientRect()
          labelOffset = {
            left: label.width / 4,
            top: label.height / 4
          }
        } else {
          labelOffset = { left: 0, top: 0 }
        }
        const basePosition = {
          left: connection.x + window.scrollX,
          top: connection.y + window.scrollY
        }
        const connectionOffset = {
          left: connection.width / 2,
          top: connection.height / 2
        }
        let position = {
          left: basePosition.left + connectionOffset.left - labelOffset.left,
          top: basePosition.top + connectionOffset.top - labelOffset.top
        }
        this.position = {
          left: position.left * zoom,
          top: position.top * zoom
        }
      })
    }
  },
  watch: {
    path (value) {
      this.setPosition()
    },
    hover (value) {
      if (value) {
        this.$store.commit('currentUserIsHoveringOverConnectionId', this.id)
      } else {
        this.$store.commit('currentUserIsHoveringOverConnectionId', '')
      }
    }
  }

}
</script>

<style lang="stylus">
.connection-label
  pointer-events all
  cursor pointer
  position absolute
  will-change transform
  transform-origin top left
  transform-style preserve-3d
  &.cursor-default
    cursor default
  .is-dark
    filter invert(1)
</style>
