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
  span.name(:class="{ 'is-dark': isDark }") {{typeName}}
</template>

<script>
import utils from '@/utils.js'

let isMultiTouch

export default {
  name: 'ConnectionLabel',
  props: {
    connection: Object
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'spaceZoomPercent') {
        this.setPosition()
      }
    })
  },
  mounted () {
    this.setPosition()
    window.addEventListener('scroll', this.updateConnectionIsVisible)
  },
  beforeUnmount () {
    window.removeEventListener('scroll', this.updateConnectionIsVisible)
  },
  data () {
    return {
      position: {},
      hover: false,
      connectionIsVisible: true
    }
  },
  computed: {
    visible () {
      const hasPosition = this.position.x && this.position.y
      return this.connection.labelIsVisible && hasPosition && !this.isUpdatingPath
    },
    styles () {
      return {
        background: this.typeColor,
        left: this.position.x + 'px',
        top: this.position.y + 'px'
      }
    },
    id () { return this.connection.id },
    connectionTypeId () { return this.connection.connectionTypeId },
    connectionType () { return this.$store.getters['currentConnections/typeByTypeId'](this.connectionTypeId) },
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
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },

    // filters
    filtersIsActive () {
      const types = this.$store.state.filteredConnectionTypeIds
      const frames = this.$store.state.filteredFrameIds
      return Boolean(types.length + frames.length)
    },
    isConnectionFilteredByType () {
      const typeIds = this.$store.state.filteredConnectionTypeIds
      return typeIds.includes(this.connectionTypeId)
    },
    isCardsFilteredByFrame () {
      const frameIds = this.$store.state.filteredFrameIds
      const cards = utils.clone(this.$store.getters['currentCards/all'])
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
      const currentUserIsDragging = this.$store.state.currentUserIsDraggingCard
      let cards = []
      const multipleCardsSelectedIds = this.$store.state.multipleCardsSelectedIds
      const currentCardId = this.$store.state.currentDraggingCardId
      const remoteCardsDragging = utils.clone(this.$store.state.remoteCardsDragging)
      const remoteCardsSelected = utils.clone(this.$store.state.remoteCardsSelected)
      // local multiple
      if (multipleCardsSelectedIds.length && currentUserIsDragging) {
        cards = multipleCardsSelectedIds.map(id => this.$store.getters['currentCards/byId'](id))
      // local single
      } else if (currentCardId && currentUserIsDragging) {
        const currentCard = this.$store.getters['currentCards/byId'](currentCardId)
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
      this.$store.commit('triggerConnectionDetailsIsVisible', {
        connectionId: this.id,
        event
      })
    },
    updateConnectionIsVisible () {
      const connection = document.querySelector(`.connection-path[data-id="${this.id}"]`)
      const hasChanged = this.connectionIsVisible !== Boolean(connection)
      if (connection && hasChanged) {
        this.connectionIsVisible = true
      } else {
        this.connectionIsVisible = false
      }
    },
    setPosition () {
      if (!this.connectionIsVisible) { return }
      if (!this.connection.path) { return }
      this.$nextTick(() => {
        let connection = document.querySelector(`.connection-path[data-id="${this.id}"]`)
        if (!connection) { return }
        const zoom = utils.spaceCounterZoomDecimal() || 1
        let rect = connection.getBoundingClientRect()
        rect.x = rect.x + window.scrollX
        rect.y = rect.y + window.scrollY
        const rectPosition = utils.updatePositionWithSpaceOffset(rect)
        rect = {
          x: Math.round(rectPosition.x * zoom),
          y: Math.round(rectPosition.y * zoom),
          width: Math.round(rect.width * zoom),
          height: Math.round(rect.height * zoom)
        }
        // position in center of connection element
        const connectionOffset = {
          x: rect.width / 2,
          y: rect.height / 2
        }
        let position = {
          x: rect.x + connectionOffset.x,
          y: rect.y + connectionOffset.y
        }
        // offset by label size
        let label = this.$refs.label
        let labelOffset
        if (label) {
          label = label.getBoundingClientRect()
          labelOffset = {
            x: label.width / 4,
            y: label.height / 4
          }
        } else {
          labelOffset = { x: 0, y: 0 }
        }
        this.position = {
          x: position.x - labelOffset.x,
          y: position.y - labelOffset.y
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
  transform-origin top left
  z-index 1
  &.cursor-default
    cursor default
  .name
    color var(--primary-on-light-background)
    &.is-dark
      color var(--primary-on-dark-background)
</style>
