<template lang="pug">
dialog.connection-details.narrow(v-if="visible" :open="visible" :style="position")
  section(:style="{backgroundColor: typeColor}")
    .row
      button.change-color
        .current-color(:style="{backgroundColor: typeColor}")
      input(placeholder="connection" v-model="typeName")

    label(:class="activeIfDefaultChecked")
      input(type="checkbox" v-model="defaultChecked")
      span Default

    button(@click="removeConnection")
      img.icon(src="@/assets/remove.svg")
      span Remove

  section(v-if="multipleConnectionTypes")
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
    typeColor () { return this.connectionType.color },
    typeName: {
      get () { return this.connectionType.name },
      set (newName) {
        const connectionTypeId = this.connectionType.id
        this.$store.commit('currentSpace/updateConnectionTypeName', { connectionTypeId, newName })
      }
    },
    multipleConnectionTypes () {
      const types = this.$store.getters['currentSpace/connectionTypes']
      return Boolean(types.length > 1)
    }
  },

  methods: {
    removeConnection () {
      this.$store.commit('currentSpace/removeConnection', this.connection.id)
      this.$store.commit('closeAllDialogs')
    }
  }
}
</script>

<style lang="stylus">
.connection-details
  .change-color
    padding-top 4px
    .current-color
      height 13px
      width 14px
      vertical-align top
      border-radius 3px
</style>
