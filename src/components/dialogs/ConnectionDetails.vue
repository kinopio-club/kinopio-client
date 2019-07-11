<template lang="pug">
dialog.connection-details.narrow(v-if="visible" :open="visible" :style="position")
  section(:style="{backgroundColor: typeColor}")
    .row
      button.change-color
        .current-color(:style="{backgroundColor: typeColor}")
      input(placeholder="connection" v-model="typeName")

    label(:class="{active : defaultIsChecked}")
      input(type="checkbox" v-model="defaultIsChecked")
      span Default

    button(@click="removeConnection")
      img.icon(src="@/assets/remove.svg")
      span Remove

  section.results-section(v-if="multipleConnectionTypes")
    ul
      template(v-for="(type) in connectionTypesList")
        li(:class="{ active: type.isActive }" @click="changeConnectionType(type)")
          .badge(:style="{backgroundColor: type.color}")
          .name {{type.name}}

</template>

<script>
export default {
  name: 'ConnectionDetails',
  computed: {
    visible () {
      return this.$store.state.connectionDetailsIsVisible
    },
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
    connectionType () {
      return this.$store.getters['currentSpace/connectionTypeById'](this.connection.connectionTypeId)
    },
    connectionTypes () {
      return this.$store.state.currentSpace.connectionTypes
    },
    typeColor () {
      return this.connectionType.color
    },
    typeName: {
      get () {
        return this.connectionType.name
      },
      set (newName) {
        const connectionTypeId = this.connectionType.id
        this.$store.commit('currentSpace/updateConnectionTypeName', { connectionTypeId, newName })
      }
    },
    defaultIsChecked: {
      get () { return false },
      set (newValue) {
        console.log('defaultChecked', newValue)
      }
    },
    multipleConnectionTypes () {
      return Boolean(this.connectionTypes.length > 1)
    },
    connectionTypesList () {
      let types = this.connectionTypes
      return types.map(type => {
        type.isActive = Boolean(type.id === this.connection.connectionTypeId)
        return type
      })
    }
  },
  methods: {
    removeConnection () {
      this.$store.commit('currentSpace/removeConnection', this.connection.id)
      this.$store.commit('closeAllDialogs')
      this.$store.commit('currentSpace/removeUnusedConnectionTypes')
    },
    changeConnectionType (type) {
      this.$store.commit('currentSpace/changeConnectionType', {
        connectionId: this.connection.id,
        connectionTypeId: type.id
      })
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
