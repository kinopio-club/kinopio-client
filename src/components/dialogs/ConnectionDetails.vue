<template lang="pug">
dialog.connection-details.narrow(v-if="visible" :open="visible" :style="styles" @click.left="closeColorPicker" ref="dialog")
  section(:style="{backgroundColor: typeColor}" ref="infoSection")
    .row
      .button-wrap
        button.change-color(:disabled="!canEditConnection" @click.left.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
          .current-color(:style="{backgroundColor: typeColor}")
        ColorPicker(:currentColor="typeColor" :visible="colorPickerIsVisible" @selectedColor="updateTypeColor")
      input.type-name(:disabled="!canEditConnection" placeholder="Connection Name" v-model="typeName" ref="typeName" @focus="focus" @blur="blur" :class="{'is-dark': typeColorisDark}")

    .row
      //- Arrows or Label
      ConnectionDecorators(:connections="[currentConnection]")

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
    .row
      //- Remove
      button(:disabled="!canEditConnection" @click.left="removeConnection")
        img.icon(src="@/assets/remove.svg")
        span Remove
  section.results-actions(ref="resultsActions")
    //- Use Last Type
    .row
      label(:class="{active: shouldUseLastConnectionType, disabled: !canEditConnection}" @click.left.prevent="toggleShouldUseLastConnectionType" @keydown.stop.enter="toggleShouldUseLastConnectionType")
        input(type="checkbox" v-model="shouldUseLastConnectionType")
        .badge.badge-in-button(:style="{backgroundColor: typeColor}")
        span Use Last Type
      //- Filter
      button(@click.left.prevent="toggleFilteredInSpace" @keydown.stop.enter="toggleFilteredInSpace" :class="{active: isFilteredInSpace}")
        img.icon(src="@/assets/filter.svg")

    .row
      button(:disabled="!canEditConnection" @click.left="addConnectionType")
        img.icon(src="@/assets/add.svg")
        .badge.badge-in-button(:style="{backgroundColor: nextConnectionTypeColor}")
        span Type

  section.results-section(ref="resultsSection" :style="{'max-height': resultsSectionMaxHeight}")
    ResultsFilter(:items="connectionTypesByUpdatedAt" @updateFilter="updateFilter" @updateFilteredItems="updateFilteredConnectionTypes")
    ul.results-list
      template(v-for="type in connectionTypesFiltered" :key="type.id")
        li(:class="{ active: connectionTypeIsActive(type), disabled: !canEditConnection }" @click.left="changeConnectionType(type)")
          .badge(:style="{backgroundColor: type.color}")
          .name {{type.name}}
</template>

<script>
import ResultsFilter from '@/components/ResultsFilter.vue'
import ConnectionDecorators from '@/components/ConnectionDecorators.vue'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import utils from '@/utils.js'

import last from 'lodash-es/last'
import sortBy from 'lodash-es/sortBy'
import randomColor from 'randomcolor'
import dayjs from 'dayjs'

let prevConnectionType

export default {
  components: {
    ColorPicker,
    ResultsFilter,
    ConnectionDecorators
  },
  name: 'ConnectionDetails',
  data () {
    return {
      colorPickerIsVisible: false,
      filter: '',
      filteredConnectionTypes: [],
      resultsSectionMaxHeight: undefined, // number
      nextConnectionTypeColor: '',
      inputIsFocused: false
    }
  },
  computed: {
    visible () { return Boolean(this.$store.state.connectionDetailsIsVisibleForConnectionId) },
    currentConnectionType () {
      const connectionType = this.$store.getters['currentConnections/typeByConnection'](this.currentConnection)
      prevConnectionType = connectionType
      return connectionType
    },
    connectionTypes () { return this.$store.getters['currentConnections/allTypes'] },
    connectionTypesByUpdatedAt () {
      let types = this.connectionTypes
      types = sortBy(types, type => dayjs(type.updatedAt).valueOf())
      types.reverse()
      return types
    },
    typeColor () { return this.currentConnectionType.color },
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    spacePrivacyIsOpen () { return this.$store.state.currentSpace.privacy === 'open' },
    spacePrivacyIsClosed () { return this.$store.state.currentSpace.privacy === 'closed' },
    isInvitedButCannotEditSpace () { return this.$store.getters['currentUser/isInvitedButCannotEditSpace']() },
    spaceCounterZoomDecimal () { return this.$store.getters.spaceCounterZoomDecimal },
    styles () {
      const position = this.$store.state.connectionDetailsPosition
      // const zoom = this.spaceCounterZoomDecimal
      return {
        left: `${position.x}px`,
        top: `${position.y}px`
        // transform: `scale(${zoom})`
      }
    },
    currentConnection () {
      const id = this.$store.state.connectionDetailsIsVisibleForConnectionId
      return this.$store.getters['currentConnections/byId'](id)
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
          name: newName,
          updatedAt: new Date()
        }
        this.$store.dispatch('currentConnections/updateType', connectionType)
      }
    },
    connectionTypesFiltered () {
      if (this.filter) {
        return this.filteredConnectionTypes
      } else {
        return this.connectionTypesByUpdatedAt
      }
    },
    shouldUseLastConnectionType () { return this.$store.state.currentUser.shouldUseLastConnectionType },
    isFilteredInSpace: {
      get () {
        const types = this.$store.state.filteredConnectionTypeIds
        return types.includes(this.currentConnectionType.id)
      },
      set () {
        this.toggleFilteredInSpace()
      }
    },
    typeColorisDark () {
      return utils.colorIsDark(this.typeColor)
    }
  },
  methods: {
    toggleFilteredInSpace () {
      const filtered = this.$store.state.filteredConnectionTypeIds
      const typeId = this.currentConnectionType.id
      if (filtered.includes(typeId)) {
        this.$store.commit('removeFromFilteredConnectionTypeId', typeId)
      } else {
        this.$store.commit('addToFilteredConnectionTypeId', typeId)
      }
    },
    toggleShouldUseLastConnectionType () {
      const value = !this.shouldUseLastConnectionType
      this.$store.dispatch('currentUser/shouldUseLastConnectionType', value)
    },
    addConnectionType () {
      this.$store.dispatch('currentConnections/addType', { color: this.nextConnectionTypeColor })
      const types = utils.clone(this.connectionTypes)
      const newType = last(types)
      this.changeConnectionType(newType)
      this.updateNextConnectionColor()
    },
    connectionTypeIsActive (type) {
      return Boolean(type.id === this.currentConnection.connectionTypeId)
    },
    removeConnection () {
      this.$store.dispatch('currentConnections/remove', this.currentConnection)
      this.$store.dispatch('closeAllDialogs', 'ConnectionDetails.removeConnection')
      this.$store.dispatch('currentConnections/removeUnusedTypes')
    },
    changeConnectionType (type) {
      this.$store.dispatch('currentConnections/update', {
        id: this.currentConnection.id,
        connectionTypeId: type.id
      })
      this.$store.commit('currentConnections/reorderTypeToEnd', type)
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
      this.$store.dispatch('currentConnections/updateType', connectionType)
    },
    focusName () {
      this.$nextTick(() => {
        const element = this.$refs.typeName
        if (!element) { return }
        element.focus()
      })
      this.inputIsFocused = true
    },
    updateResultsSectionMaxHeight () {
      const position = this.$store.state.connectionDetailsPosition
      const infoSection = this.$refs.infoSection.getBoundingClientRect()
      const resultsActions = this.$refs.resultsActions.getBoundingClientRect()
      const dialogInfoHeight = infoSection.height + resultsActions.height
      const maxHeight = (this.$store.state.viewportHeight - position.y - dialogInfoHeight)
      const minHeight = 300
      let height = Math.max(minHeight, maxHeight)
      height = Math.round(height)
      this.resultsSectionMaxHeight = `calc(90vh - ${height}px)`
    },
    scrollIntoView () {
      this.$nextTick(() => {
        const element = this.$refs.dialog
        this.updateResultsSectionMaxHeight()
        this.$nextTick(() => {
          this.$store.commit('triggerScrollIntoView', { element })
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
    triggerSignUpOrInIsVisible () {
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    updateFilteredConnectionTypes (types) {
      this.filteredConnectionTypes = types
    },
    updateFilter (filter) {
      this.filter = filter
    },
    focus () {
      this.$store.dispatch('history/pause')
      this.inputIsFocused = true
    },
    blur () {
      this.$store.dispatch('history/resume')
      const connectionType = utils.clone(this.currentConnectionType)
      this.$store.dispatch('history/add', { connectionTypes: [connectionType], useSnapshot: true })
      this.inputIsFocused = false
    },
    updateNextConnectionColor () {
      this.nextConnectionTypeColor = randomColor({ luminosity: 'light' })
    }
  },
  watch: {
    currentConnection (current) {
      this.$store.dispatch('currentConnections/removeUnusedTypes')
      this.$nextTick(() => {
        if (this.visible) {
          this.colorPickerIsVisible = false
          this.scrollIntoViewAndFocus()
          this.$store.commit('currentConnections/reorderTypeToEnd', this.currentConnectionType)
        } else {
          this.$store.commit('shouldHideConnectionOutline', false)
        }
      })
    },
    visible (visible) {
      if (visible) {
        this.updateNextConnectionColor()
      } else {
        this.$store.dispatch('history/resume')
        this.resultsSectionMaxHeight = undefined
        if (this.inputIsFocused) {
          this.$store.dispatch('history/add', { connectionTypes: [prevConnectionType], useSnapshot: true })
          this.inputIsFocused = false
        }
      }
    }
  }
}
</script>

<style lang="stylus">
.connection-details
  z-index var(--max-z)
  .type-name
    margin-left 6px
  .edit-message
    button
      margin-top 10px
  .results-actions
    .badge-in-button
      margin-left 5px
    label
      .badge-in-button
        margin-left 0
</style>
