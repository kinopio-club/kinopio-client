<template lang="pug">
.connection-label.badge(
  :style="{ background: typeColor, left: position.left + 'px', top: position.top  + 'px'}"
  @click="showConnectionDetails"
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
      position: {}
    }
  },
  computed: {
    // visible
    id () { return this.connection.id },
    connectionTypeId () { return this.connection.connectionTypeId },
    connectionType () { return this.$store.getters['currentSpace/connectionTypeById'](this.connectionTypeId) },
    typeColor () {
      // if (this.connectionType) {
      return this.connectionType.color
      // } else { return undefined }
    },
    typeName () {
      // remove the null soak on ^ typeColor in connectino.vue too??
      return this.connectionType.name
    },
    path () {
      return this.connection.path
    }
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
    //   // const pathElement =
      const element = document.querySelector(`.path[data-id="${this.id}"]`)
      this.position = element.getBoundingClientRect()
      console.log('🪀', this.position)
    }
  },
  watch: {
    path (value) {
      console.log('path changed')
      this.setPosition()
      // animationTimer = window.requestAnimationFrame(this.animationFrame)
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
