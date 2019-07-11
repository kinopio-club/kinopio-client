<template lang="pug">
dialog.connection-details.narrow(v-if="visible" :open="visible" :style="position")
  section(:style="{backgroundColor: typeColor}")
    .row
      button.change-color
        .current-color(:style="{backgroundColor: typeColor}")
      input(placeholder="Connection" v-model="typeName")

    label(:class="{active : defaultIsChecked}")
      input(type="checkbox" v-model="defaultIsChecked" @click="toggleDefaultIsChecked")
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
import utils from '@/utils.js'

export default {
  name: 'ConnectionDetails',
  data () {
    return {
      defaultIsChecked: false
    }
  },
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
    currentConnection () {
      let connections = this.$store.state.currentSpace.connections
      return connections.find(connection => {
        return connection.connectionDetailsVisible === true
      })
    },
    currentConnectionType () {
      return this.$store.getters['currentSpace/connectionTypeById'](this.currentConnection.connectionTypeId)
    },
    connectionTypes () {
      return this.$store.state.currentSpace.connectionTypes
    },
    typeColor () {
      return this.currentConnectionType.color
    },
    typeName: {
      get () {
        return this.currentConnectionType.name
      },
      set (newName) {
        const connectionTypeId = this.currentConnectionType.id
        this.$store.commit('currentSpace/updateConnectionTypeName', { connectionTypeId, newName })
      }
    },
    multipleConnectionTypes () {
      return Boolean(this.connectionTypes.length > 1)
    },
    connectionTypesList () {
      let types = this.connectionTypes
      return types.map(type => {
        type.isActive = Boolean(type.id === this.currentConnection.connectionTypeId)
        return type
      })
    }
  },
  methods: {
    removeConnection () {
      this.$store.commit('currentSpace/removeConnection', this.currentConnection.id)
      this.$store.commit('closeAllDialogs')
      this.$store.commit('currentSpace/removeUnusedConnectionTypes')
    },
    changeConnectionType (type) {
      this.$store.commit('currentSpace/changeConnectionType', {
        connectionId: this.currentConnection.id,
        connectionTypeId: type.id
      })
      this.updateDefaultConnectionType()
    },
    updateDefaultConnectionType () {
      const typePref = utils.getUserPref('defaultConnectionTypeId')
      this.defaultIsChecked = Boolean(typePref === this.currentConnectionType.id)
    },
    toggleDefaultIsChecked () {
      if (this.defaultIsChecked) {
        this.defaultIsChecked = false
        utils.updateUserPrefs('defaultConnectionTypeId', '')
      } else {
        this.defaultIsChecked = true
        utils.updateUserPrefs('defaultConnectionTypeId', this.currentConnectionType.id)
      }
    }
  },
  watch: {
    visible (value) {
      if (value) {
        this.updateDefaultConnectionType()
      }
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
