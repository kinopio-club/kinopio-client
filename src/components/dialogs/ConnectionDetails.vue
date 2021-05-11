<template lang="pug">
dialog.narrow.connection-details(v-if="visible" :open="visible" :style="styles" @click.left="closeColorPicker" ref="dialog")
  section(:style="{backgroundColor: typeColor}" ref="infoSection")
    .row
      .button-wrap
        button.change-color(:disabled="!canEditConnection" @click.left.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
          .current-color(:style="{backgroundColor: typeColor}")
        ColorPicker(:currentColor="typeColor" :visible="colorPickerIsVisible" @selectedColor="updateTypeColor")
      input.type-name(:disabled="!canEditConnection" placeholder="Connection Name" v-model="typeName" ref="typeName" @focus="resetPinchCounterZoomDecimal" @blur="triggerUpdatePositionInVisualViewport")

    .row
      button(:disabled="!canEditConnection" :class="{active: labelIsVisible}" @click.left="toggleLabelIsVisible")
        img.icon(v-if="labelIsVisible" src="@/assets/view.svg")
        img.icon(v-else src="@/assets/view-hidden.svg")

        span Label
      label(:class="{active: isDefault, disabled: !canEditSpace}" @click.left.prevent="toggleDefault" @keydown.stop.enter="toggleDefault")
        input(type="checkbox" v-model="isDefault")
        span Default

    button(:disabled="!canEditConnection" @click.left="removeConnection")
      img.icon(src="@/assets/remove.svg")
      span Remove

    p.edit-message(v-if="!canEditConnection")
      template(v-if="spacePrivacyIsOpen")
        span.badge.info
          img.icon.open(src="@/assets/open.svg")
          span In open spaces, you can only edit connections you've made
      template(v-else-if="isInvitedButCannotEditSpace")
        span.badge.info
          img.icon(src="@/assets/unlock.svg")
          span To edit spaces you've been invited to, you'll need to sign up or in
        .row
          .button-wrap
            button(@click.left.stop="triggerSignUpOrInIsVisible") Sign Up or In
      template(v-else-if="spacePrivacyIsClosed")
        span.badge.info
          img.icon(src="@/assets/unlock.svg")
          span To edit closed spaces, you'll need to be invited

  section.results-actions(ref="resultsActions")
    button(:disabled="!canEditConnection" @click.left="addConnectionType")
      img.icon(src="@/assets/add.svg")
      span Add

  section.results-section(ref="resultsSection" :style="{'max-height': resultsSectionMaxHeight + 'px'}")
    ResultsFilter(:items="connectionTypes" @updateFilter="updateFilter" @updateFilteredItems="updateFilteredConnectionTypes")
    ul.results-list
      template(v-for="(type in connectionTypesFiltered")
        li(:class="{ active: connectionTypeIsActive(type), disabled: !canEditConnection }" @click.left="changeConnectionType(type)" :key="type.id")
          .badge(:style="{backgroundColor: type.color}" :class="{checked: connectionTypeIsDefault(type)}")
          .name {{type.name}}
</template>

<script>
import ResultsFilter from '@/components/ResultsFilter.vue'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import utils from '@/utils.js'

import last from 'lodash-es/last'
import scrollIntoView from '@/scroll-into-view.js'

export default {
  components: {
    ColorPicker,
    ResultsFilter
  },
  name: 'ConnectionDetails',
  mounted () {
    this.updatePinchCounterZoomDecimal()
  },
  data () {
    return {
      isDefault: false,
      colorPickerIsVisible: false,
      filter: '',
      filteredConnectionTypes: [],
      resultsSectionMaxHeight: undefined // number
    }
  },
  computed: {
    visible () { return Boolean(this.$store.state.connectionDetailsIsVisibleForConnectionId) },
    labelIsVisible () { return this.currentConnection.labelIsVisible },
    currentConnectionType () { return this.$store.getters['currentSpace/connectionTypeById'](this.currentConnection.connectionTypeId) },
    connectionTypes () { return this.$store.state.currentSpace.connectionTypes },
    typeColor () { return this.currentConnectionType.color },
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    spacePrivacyIsOpen () { return this.$store.state.currentSpace.privacy === 'open' },
    spacePrivacyIsClosed () { return this.$store.state.currentSpace.privacy === 'closed' },
    isInvitedButCannotEditSpace () { return this.$store.getters['currentUser/isInvitedButCannotEditSpace']() },
    spaceCounterZoomDecimal () { return this.$store.getters.spaceCounterZoomDecimal },
    pinchCounterZoomDecimal () { return this.$store.state.pinchCounterZoomDecimal },
    styles () {
      const position = this.$store.state.connectionDetailsPosition
      let zoom
      if (utils.isSignificantlyPinchZoomed()) {
        zoom = this.pinchCounterZoomDecimal
      } else {
        zoom = this.spaceCounterZoomDecimal
      }
      return {
        left: `${position.x * this.spaceCounterZoomDecimal}px`,
        top: `${position.y * this.spaceCounterZoomDecimal}px`,
        transform: `scale(${zoom})`
      }
    },
    currentConnection () {
      let connections = this.$store.state.currentSpace.connections
      return connections.find(connection => {
        return connection.id === this.$store.state.connectionDetailsIsVisibleForConnectionId
      })
    },
    canEditConnection () {
      const isSpaceMember = this.$store.getters['currentUser/isSpaceMember']()
      const connectionIsCreatedByCurrentUser = this.$store.getters['currentUser/connectionIsCreatedByCurrentUser'](this.currentConnection)
      const canEditSpace = this.$store.getters['currentUser/canEditSpace']()
      if (isSpaceMember) { return true }
      if (canEditSpace && connectionIsCreatedByCurrentUser) { return true }
      return false
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
    },
    connectionTypesFiltered () {
      if (this.filter) {
        return this.filteredConnectionTypes
      } else {
        return this.connectionTypes
      }
    }
  },
  methods: {
    addConnectionType () {
      this.$store.dispatch('currentSpace/addConnectionType')
      const types = utils.clone(this.connectionTypes)
      const newType = last(types)
      this.changeConnectionType(newType)
    },
    connectionTypeIsActive (type) {
      return Boolean(type.id === this.currentConnection.connectionTypeId)
    },
    connectionTypeIsDefault (type) {
      const typePref = this.$store.state.currentUser.defaultConnectionTypeId
      return typePref === type.id
    },
    removeConnection () {
      this.$store.dispatch('currentSpace/removeConnection', this.currentConnection)
      this.$store.dispatch('closeAllDialogs', 'ConnectionDetails.removeConnection')
      this.$store.dispatch('currentSpace/removeUnusedConnectionTypes')
    },
    changeConnectionType (type) {
      this.$store.dispatch('currentSpace/updateConnectionTypeForConnection', {
        connectionId: this.currentConnection.id,
        connectionTypeId: type.id
      })
      this.$store.commit('currentSpace/reorderConnectionTypeToLast', type)
      this.updateDefaultConnectionType()
    },
    updateDefaultConnectionType () {
      const typePref = this.$store.state.currentUser.defaultConnectionTypeId
      this.isDefault = Boolean(typePref === this.currentConnectionType.id)
    },
    toggleDefault () {
      this.isDefault = !this.isDefault
      if (this.isDefault) {
        this.$store.dispatch('currentUser/defaultConnectionTypeId', this.currentConnectionType.id)
      } else {
        this.$store.dispatch('currentUser/defaultConnectionTypeId', '')
      }
    },
    toggleLabelIsVisible () {
      const newValue = !this.labelIsVisible
      this.$store.dispatch('currentSpace/updateLabelIsVisibleForConnection', {
        connectionId: this.currentConnection.id,
        labelIsVisible: newValue
      })
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
    focusName () {
      this.$nextTick(() => {
        const element = this.$refs.typeName
        if (!element) { return }
        element.focus()
      })
    },
    updateResultsSectionMaxHeight () {
      const position = this.$store.state.connectionDetailsPosition
      const infoSection = this.$refs.infoSection.getBoundingClientRect()
      const resultsActions = this.$refs.resultsActions.getBoundingClientRect()
      const minHeight = 300
      const otherHeight = infoSection.height + resultsActions.height
      const maxHeight = this.$store.state.viewportHeight - otherHeight - position.y
      this.resultsSectionMaxHeight = Math.max(minHeight, maxHeight)
    },
    scrollIntoView () {
      this.$nextTick(() => {
        const element = this.$refs.dialog
        this.updateResultsSectionMaxHeight()
        const isTouchDevice = this.$store.state.isTouchDevice
        this.$nextTick(() => {
          scrollIntoView.scroll(element, isTouchDevice)
        })
      })
    },
    scrollIntoViewAndFocus () {
      this.scrollIntoView()
      if (utils.isMobile()) { return }
      const element = this.$refs.typeName
      const length = this.typeName.length
      this.$nextTick(() => {
        this.focusName()
        if (length && element) {
          element.setSelectionRange(length, length)
        }
      })
    },
    updateView () {
      this.updateDefaultConnectionType()
      this.colorPickerIsVisible = false
    },
    triggerSignUpOrInIsVisible () {
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    updateFilteredConnectionTypes (types) {
      this.filteredConnectionTypes = types
    },
    updateFilter (filter) {
      this.filter = filter
    },
    resetPinchCounterZoomDecimal () {
      this.$store.commit('pinchCounterZoomDecimal', 1)
    },
    updatePinchCounterZoomDecimal () {
      this.$store.commit('pinchCounterZoomDecimal', utils.pinchCounterZoomDecimal())
    },
    triggerUpdatePositionInVisualViewport () {
      this.$store.commit('triggerUpdatePositionInVisualViewport')
    }
  },
  watch: {
    currentConnection (current) {
      this.$store.dispatch('currentSpace/removeUnusedConnectionTypes')
      this.$nextTick(() => {
        if (this.visible) {
          this.updateView()
          this.scrollIntoViewAndFocus()
          this.$store.commit('currentSpace/reorderConnectionTypeToLast', this.currentConnectionType)
        } else {
          this.$store.commit('shouldHideConnectionOutline', false)
        }
      })
    },
    visible (visible) {
      if (visible) {
        this.updatePinchCounterZoomDecimal()
      } else {
        this.resultsSectionMaxHeight = undefined
      }
    }
  }
}
</script>

<style lang="stylus">
.connection-details
  transform-origin top left
  .type-name
    margin-left 6px
  .edit-message
    button
      margin-top 10px

</style>
