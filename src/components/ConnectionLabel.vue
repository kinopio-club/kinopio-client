<template lang="pug">
.connection-label.badge(
  v-if="visible"
  :style="{ background: typeColor, left: position.left, top: position.top }"
  @click="showConnectionDetails"
  :data-id="id"
  @mouseover="hover = true"
  @mouseleave="hover = false"
)
  span {{typeName}}
</template>

<script>
import utils from '@/utils.js'

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
    path () { return this.connection.path }
  },
  methods: {
    // same as Connection method
    showConnectionDetails (event) {
      const detailsPosition = utils.cursorPositionInPage(event)
      this.$store.commit('closeAllDialogs')
      this.$store.commit('connectionDetailsIsVisibleForConnectionId', this.id)
      this.$store.commit('connectionDetailsPosition', detailsPosition)
      this.$store.commit('clearMultipleSelected')
    },
    setPosition () {
      const connection = document.querySelector(`.path[data-id="${this.id}"]`).getBoundingClientRect()
      this.position = {
        left: (connection.x + window.scrollX) + (connection.width / 2) + 'px',
        top: (connection.y + window.scrollY) + (connection.height / 2) + 'px'
      }
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
</style>
