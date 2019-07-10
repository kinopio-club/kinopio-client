<template lang="pug">
dialog.connection-details.narrow(v-if="visible" :open="visible" :style="position")
  section(:style="{backgroundColor: typeColor}")
    input(placeholder="connection" v-model="typeName")
    .row
      button.change-color
        .current-color(:style="{backgroundColor: typeColor}")
      button(@click="removeConnection")
        img.trash(src="@/assets/trash.svg")
        span Remove
    button [x] Default
  section
    button + connection
    p select from existing conneciton types
</template>

<script>
export default {
  name: 'ConnectionDetails',
  computed: {
    visible () { return this.$store.state.connectionDetailsIsVisible },
    position () {
      const cursor = this.$store.state.connectionDetailsPosition
      return {
        left: `${cursor.x}px`,
        top: `${cursor.y}px`
      }
    },
    connection () {
      let connections = this.$store.state.currentSpace.connections
      return connections.find(connection => {
        return connection.connectionDetailsVisible === true
      })
    },
    connectionType () { return this.$store.getters['currentSpace/connectionTypeById'](this.connection.connectionTypeId) },
    typeName: {
      get () { return this.connectionType.name },
      set (newName) {
        const connectionTypeId = this.connectionType.id
        this.$store.commit('currentSpace/updateConnectionTypeName', { connectionTypeId, newName })
      }
    },
    typeColor () { return this.connectionType.color }
  },
  methods: {
    removeConnection () {
      this.$store.commit('closeAllDialogs')
      this.$store.commit('currentSpace/removeConnection', this.connection.id)
    }
  }
}
</script>

<style lang="stylus">
.connection-details
  .change-color
    padding-top 4px
    vertical-align top
    .current-color
      height 13px
      width 14px
      vertical-align top
      border-radius 3px
</style>
