<template lang="pug">
path.path(
  fill="none"
  :stroke="typeColor"
  stroke-width="5"
  :data-start-card="startCardId"
  :data-end-card="endCardId"
  :data-id="id"
  :key="id"
  :d="path"
  @click="showConnectionDetails"
  @touchend.stop="showConnectionDetails"
  :class="{active: isSelected || detailsIsVisible}"
  ref="connection"
)
</template>

<script>
import utils from '@/utils.js'

let wiggleTimer

export default {
  props: {
    connection: Object
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'clearMultipleSelected') {
        const selectedIds = this.$store.state.multipleConnectionsSelectedIds
        const selected = selectedIds.includes(this.id) || this.$store.state.connectionDetailsIsVisibleForConnectionId === this.id
        if (!selected) {
          this.cancelWiggle()
        }
      }
    })
  },
  computed: {
    id () { return this.connection.id },
    connectionTypeId () { return this.connection.connectionTypeId },
    startCardId () { return this.connection.startCardId },
    endCardId () { return this.connection.endCardId },
    path () { return this.connection.path },
    connectionType () { return this.$store.getters['currentSpace/connectionTypeById'](this.connectionTypeId) },
    typeColor () {
      if (this.connectionType) {
        return this.connectionType.color
      } else { return undefined }
    },
    isSelected () {
      const selectedIds = this.$store.state.multipleConnectionsSelectedIds
      return selectedIds.includes(this.id)
    },
    detailsIsVisible () {
      const detailsId = this.$store.state.connectionDetailsIsVisibleForConnectionId
      return detailsId === this.id
    },
    shouldWiggle () {
      return Boolean(this.isSelected || this.detailsIsVisible)
    }
  },
  methods: {
    showConnectionDetails (event) {
      const detailsPosition = utils.cursorPositionInPage(event)
      this.$store.commit('closeAllDialogs')
      this.$store.commit('connectionDetailsIsVisibleForConnectionId', this.id)
      this.$store.commit('connectionDetailsPosition', detailsPosition)
      this.$store.commit('clearMultipleSelected')
    },
    wiggleFrame () {
      console.log('🍆 wiggle', this.id)
      if (this.shouldWiggle) {
        window.requestAnimationFrame(this.wiggleFrame)
      }
    },
    cancelWiggle () {
      console.log('🍄no wiggle', this.id)
      window.cancelAnimationFrame(wiggleTimer)
      wiggleTimer = undefined
    }
  },
  watch: {
    shouldWiggle (shouldWiggle) {
      if (shouldWiggle) {
        console.log('wiggle')
        wiggleTimer = window.requestAnimationFrame(this.wiggleFrame)
      }
    }
  }

}
</script>

<style lang="stylus">
.path
  &:hover,
  &.active
    stroke-width: 7
</style>
