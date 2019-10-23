<template lang="pug">
dialog.narrow.connection-details(v-if="visible" :open="visible" :style="position" @click="closeColorPicker" ref="dialog")
  section(:style="{backgroundColor: typeColor}")
    .row
      .button-wrap
        button.change-color(@click.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
          .current-color(:style="{backgroundColor: typeColor}")
        ColorPicker(:currentColor="typeColor" :visible="colorPickerIsVisible" @selectedColor="updateTypeColor")
      input.type-name(placeholder="Connection" v-model="typeName")

    label(:class="{active: isDefault}" @click.prevent="toggleDefault")
      input(type="checkbox" v-model="isDefault")
      span Default

    button(@click="removeConnection")
      img.icon(src="@/assets/remove.svg")
      span Remove

  section.results-actions
    button(@click="addConnectionType")
      img.icon(src="@/assets/add.svg")
      span Add

  section.results-section
    ul.results-list
      template(v-for="(type in connectionTypes")
        li(:class="{ active: connectionTypeIsActive(type.id) }" @click="changeConnectionType(type)" :key="type.id")
          .badge(:style="{backgroundColor: type.color}" :class="{checked: connectionTypeIsDefault(type.id)}")
          .name {{type.name}}
</template>

<script>
import _ from 'lodash'
import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfil

import utils from '@/utils.js'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'

export default {
  components: {
    ColorPicker
  },
  name: 'ConnectionDetails',
  data () {
    return {
      isDefault: false,
      colorPickerIsVisible: false
    }
  },
  computed: {
    visible () {
      return Boolean(this.$store.state.connectionDetailsIsVisibleForConnectionId)
    },
    position () {
      const position = this.$store.state.connectionDetailsPosition
      return {
        left: `${position.x}px`,
        top: `${position.y}px`
      }
    },
    currentConnection () {
      let connections = this.$store.state.currentSpace.connections
      return connections.find(connection => {
        return connection.id === this.$store.state.connectionDetailsIsVisibleForConnectionId
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
        const connectionType = {
          id: this.currentConnectionType.id,
          name: newName
        }
        this.$store.dispatch('currentSpace/updateConnectionType', connectionType)
      }
    }
  },
  methods: {
    addConnectionType () {
      this.$store.dispatch('currentSpace/addConnectionType')
      const types = utils.clone(this.connectionTypes)
      const newType = _.last(types)
      this.changeConnectionType(newType)
    },
    connectionTypeIsActive (typeId) {
      return Boolean(typeId === this.currentConnection.connectionTypeId)
    },
    connectionTypeIsDefault (typeId) {
      const typePref = this.$store.state.currentUser.defaultConnectionTypeId
      return typePref === typeId
    },
    removeConnection () {
      this.$store.dispatch('currentSpace/removeConnection', this.currentConnection)
      this.$store.commit('closeAllDialogs')
      this.$store.dispatch('currentSpace/removeUnusedConnectionTypes')
    },
    changeConnectionType (type) {
      this.$store.commit('currentSpace/changeConnectionType', {
        connectionId: this.currentConnection.id,
        connectionTypeId: type.id
      })
      this.updateDefaultConnectionType()
    },
    updateDefaultConnectionType () {
      const typePref = this.$store.state.currentUser.defaultConnectionTypeId
      this.isDefault = Boolean(typePref === this.currentConnectionType.id)
    },
    toggleDefault () {
      this.isDefault = !this.isDefault
      if (this.isDefault) {
        this.$store.commit('currentUser/defaultConnectionTypeId', this.currentConnectionType.id)
      } else {
        this.$store.commit('currentUser/defaultConnectionTypeId', '')
      }
    },
    toggleColorPicker () {
      this.colorPickerIsVisible = !this.colorPickerIsVisible
    },
    closeColorPicker () {
      this.colorPickerIsVisible = false
    },
    updateTypeColor (newColor) {
      const connectionType = {
        id: this.currentConnectionType.id,
        color: newColor
      }
      this.$store.dispatch('currentSpace/updateConnectionType', connectionType)
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      scrollIntoView(element, {
        behavior: 'smooth',
        scrollMode: 'if-needed'
      })
    },
    updateView () {
      this.updateDefaultConnectionType()
      this.colorPickerIsVisible = false
      this.scrollIntoView()
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.updateView()
        } else {
          this.$store.dispatch('currentSpace/removeUnusedConnectionTypes')
        }
      })
    },
    currentConnection (current) {
      this.$nextTick(() => {
        if (this.visible) {
          this.updateView()
        }
      })
    }
  }
}
</script>

<style lang="stylus">
.connection-details
  .type-name
    margin-left 6px
</style>
