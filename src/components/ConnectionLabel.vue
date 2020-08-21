<template lang="pug">
.connection-label.badge(
  v-if="visible"
  :style="{ background: typeColor, left: position.left + 'px', top: position.top + 'px'}"
  @click.left="showConnectionDetails"
  @touchend.stop="showConnectionDetails"
  @touchstart="checkIsMultiTouch"
  :data-id="id"
  @mouseover.left="hover = true"
  @mouseleave.left="hover = false"
  :class="{filtered: isFiltered}"
  ref="label"
)
  span {{typeName}}
</template>

<script>
import utils from '@/utils.js'

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
    visible () { return this.connection.labelIsVisible },
    id () { return this.connection.id },
    connectionTypeId () { return this.connection.connectionTypeId },
    connectionType () { return this.$store.getters['currentSpace/connectionTypeById'](this.connectionTypeId) },
    typeColor () { return this.connectionType.color },
    typeName () { return this.connectionType.name },
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
      const cards = utils.clone(this.$store.state.currentSpace.cards)
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
    }
  },
  methods: {
    checkIsMultiTouch (event) {
      isMultiTouch = false
      if (utils.isMultiTouch(event)) {
        isMultiTouch = true
      }
    },
    // same as Connection method
    showConnectionDetails (event) {
      if (isMultiTouch) { return }
      const detailsPosition = utils.cursorPositionInPage(event)
      this.$store.dispatch('closeAllDialogs')
      this.$store.dispatch('connectionDetailsIsVisibleForConnectionId', this.id)
      this.$store.commit('connectionDetailsPosition', detailsPosition)
      this.$store.dispatch('clearMultipleSelected')
    },
    setPosition () {
      this.$nextTick(() => {
        let connection = document.querySelector(`.connection-path[data-id="${this.id}"]`)
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
        this.position = {
          left: basePosition.left + connectionOffset.left - labelOffset.left,
          top: basePosition.top + connectionOffset.top - labelOffset.top
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
  &.cursor-default
    cursor default
</style>
