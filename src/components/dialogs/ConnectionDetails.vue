<template lang="pug">
dialog.narrow(v-if="visible" :open="visible" :style="position" @click="closeColorPicker")
  section(:style="{backgroundColor: typeColor}")
    .row
      button.change-color(@click.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
        .current-color(:style="{backgroundColor: typeColor}")
      ColorPicker(:currentColor="typeColor" :visible="colorPickerIsVisible" @selectedColor="updateTypeColor")
      input(placeholder="Connection" v-model="typeName")

    label(:class="{active: isDefault}" @click.prevent="toggleDefault")
      input(type="checkbox" v-model="isDefault")
      span Default

    button(@click="removeConnection")
      img.icon(src="@/assets/remove.svg")
      span Remove

  section.results-section(v-if="multipleConnectionTypes")
    ul
      template(v-for="(type in connectionTypesList")
        li(:class="{ active: type.isActive }" @click="changeConnectionType(type)")
          .badge(:style="{backgroundColor: type.color}")
          .name {{type.name}}

</template>

<script>
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import utils from '@/utils.js'

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
      return this.$store.state.connectionDetailsIsVisible
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
      this.isDefault = Boolean(typePref === this.currentConnectionType.id)
    },
    toggleDefault () {
      this.isDefault = !this.isDefault
      if (this.isDefault) {
        utils.updateUserPrefs('defaultConnectionTypeId', this.currentConnectionType.id)
      } else {
        utils.updateUserPrefs('defaultConnectionTypeId', '')
      }
    },
    toggleColorPicker () {
      this.colorPickerIsVisible = !this.colorPickerIsVisible
    },
    closeColorPicker () {
      this.colorPickerIsVisible = false
    },
    updateTypeColor (newColor) {
      const connectionTypeId = this.currentConnectionType.id
      this.$store.commit('currentSpace/updateConnectionTypeColor', { connectionTypeId, newColor })
    }
  },
  watch: {
    visible (value) {
      if (value) {
        this.updateDefaultConnectionType()
        this.colorPickerIsVisible = false
      }
    }
  }
}
</script>

<style lang="stylus">
</style>
