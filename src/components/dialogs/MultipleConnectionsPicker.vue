<template lang="pug">
dialog.narrow.multiple-connections-picker(v-if="visible" :open="visible" ref="dialog")
  section
    p hihi
</template>

<script>
import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfil

export default {
  name: 'MultipleConnectionsPicker',
  props: {
    visible: Boolean
  },
  data () {
    return {
      // isDefault: false,
      // colorPickerIsVisible: false
    }
  },
  computed: {
    // visible () {
    //   return Boolean(this.$store.state.connectionDetailsIsVisibleForConnectionId)
    // },
  },
  methods: {
    // addConnectionType () {
    //   this.$store.dispatch('currentSpace/addConnectionType')
    //   const types = utils.clone(this.connectionTypes)
    //   const newType = last(types)
    //   this.changeConnectionType(newType)
    // },
    // connectionTypeIsActive (type) {
    //   return Boolean(type.id === this.currentConnection.connectionTypeId)
    // },
    // connectionTypeIsDefault (type) {
    //   const typePref = this.$store.state.currentUser.defaultConnectionTypeId
    //   return typePref === type.id
    // },
    // removeConnection () {
    //   this.$store.dispatch('currentSpace/removeConnection', this.currentConnection)
    //   this.$store.commit('closeAllDialogs')
    //   this.$store.dispatch('currentSpace/removeUnusedConnectionTypes')
    // },
    // changeConnectionType (type) {
    //   this.$store.dispatch('currentSpace/updateConnectionTypeForConnection', {
    //     connectionId: this.currentConnection.id,
    //     connectionTypeId: type.id
    //   })
    //   this.updateDefaultConnectionType()
    // },
    // updateDefaultConnectionType () {
    //   const typePref = this.$store.state.currentUser.defaultConnectionTypeId
    //   this.isDefault = Boolean(typePref === this.currentConnectionType.id)
    // },
    // toggleDefault () {
    //   this.isDefault = !this.isDefault
    //   if (this.isDefault) {
    //     this.$store.dispatch('currentUser/defaultConnectionTypeId', this.currentConnectionType.id)
    //   } else {
    //     this.$store.dispatch('currentUser/defaultConnectionTypeId', '')
    //   }
    // },
    // toggleColorPicker () {
    //   this.colorPickerIsVisible = !this.colorPickerIsVisible
    // },
    // closeColorPicker () {
    //   this.colorPickerIsVisible = false
    // },
    // updateTypeColor (newColor) {
    //   const connectionType = {
    //     id: this.currentConnectionType.id,
    //     color: newColor
    //   }
    //   this.$store.dispatch('currentSpace/updateConnectionType', connectionType)
    // },
    scrollIntoView () {
      const element = this.$refs.dialog
      scrollIntoView(element, {
        behavior: 'smooth',
        scrollMode: 'if-needed'
      })
    }
    // updateView () {
    //   this.updateDefaultConnectionType()
    //   this.colorPickerIsVisible = false
    //   this.scrollIntoView()
    // }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.scrollIntoView()
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
