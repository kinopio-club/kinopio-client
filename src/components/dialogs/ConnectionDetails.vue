<template lang="pug">
dialog.connection-details.narrow(v-if="visible" :open="visible" :style="styles" @click.left="closeColorPicker" ref="dialog")
  section.info-section(:style="{backgroundColor: typeColor}" ref="infoSection")
    .dark-theme-background-layer(v-if="isThemeDarkAndTypeColorLight")
    .row
      .button-wrap
        button.change-color(:disabled="!canEditConnection" @click.left.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
          .current-color(:style="{backgroundColor: typeColor}")
        ColorPicker(:currentColor="typeColor" :visible="colorPickerIsVisible" @selectedColor="updateTypeColor")
      input.type-name(:disabled="!canEditConnection" placeholder="Connection Name" v-model="typeName" ref="typeName" @focus="focus" @blur="blur" :class="{'is-dark': typeColorisDark}")

    .row(v-if="canEditConnection")
      //- Arrows or Label
      ConnectionDecorators(:connections="[currentConnection]")

    p.edit-message.badge.info(v-if="!canEditConnection")
      template(v-if="spacePrivacyIsOpen")
        img.icon.open(src="@/assets/open.svg")
        span In open spaces, you can only edit connections you created
      template(v-else-if="isInvitedButCannotEditSpace")
        img.icon(src="@/assets/unlock.svg")
        span To edit spaces you've been invited to, you'll need to sign up or in
        .row
          .button-wrap
            button(@click.left.stop="triggerSignUpOrInIsVisible") Sign Up or In
      template(v-else-if="spacePrivacyIsClosed")
        img.icon(src="@/assets/unlock.svg")
        span Read Only
    .row(v-if="canEditConnection")
      //- Remove
      button.danger(@click.left="removeConnection")
        img.icon(src="@/assets/remove.svg")
  section.results-actions(v-if="canEditConnection" ref="resultsActions")
    //- Use Last Type
    .row.title-row
      label(:class="{active: shouldUseLastConnectionType}" @click.left.prevent="toggleShouldUseLastConnectionType" @keydown.stop.enter="toggleShouldUseLastConnectionType")
        input(type="checkbox" v-model="shouldUseLastConnectionType")
        .badge.badge-in-button(:style="{backgroundColor: lastTypeColor}")
        span Use Last Type
      //- Filter
      button.small-button(@click.left.prevent="toggleFilteredInSpace" @keydown.stop.enter="toggleFilteredInSpace" :class="{active: isFilteredInSpace}")
        img.icon(src="@/assets/filter.svg")

    .row
      button(@click.left="addConnectionType")
        img.icon(src="@/assets/add.svg")
        .badge.badge-in-button(:style="{backgroundColor: nextConnectionTypeColor}")
        span Type

  section.results-section(ref="resultsSection" :style="{'max-height': resultsSectionMaxHeight}")
    ConnectionTypeList(:connections="[currentConnection]" :connectionTypes="connectionTypesByUpdatedAt" :resultsFilterIsVisible="true" @select="changeConnectionType" :canEditConnection="canEditConnection" @updateTypeColor="updateTypeColor")
</template>

<script>
import ResultsFilter from '@/components/ResultsFilter.vue'
import ConnectionTypeList from '@/components/ConnectionTypeList.vue'
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
    ConnectionDecorators,
    ConnectionTypeList
  },
  name: 'ConnectionDetails',
  mounted () {
    this.updatePinchCounterZoomDecimal()
  },
  data () {
    return {
      colorPickerIsVisible: false,
      resultsSectionMaxHeight: undefined, // number
      nextConnectionTypeColor: '',
      inputIsFocused: false
    }
  },
  computed: {
    isThemeDarkAndTypeColorLight () {
      const isThemeDark = this.$store.state.currentUser.theme === 'dark'
      const typeColorIsLight = !utils.colorIsDark(this.typeColor)
      return isThemeDark && typeColorIsLight
    },
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
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: `scale(${zoom})`
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
    lastTypeColor () {
      const lastType = this.$store.getters['currentConnections/lastType']
      return lastType.color
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
    removeConnection () {
      this.$store.dispatch('currentConnections/remove', this.currentConnection)
      this.$store.dispatch('closeAllDialogs')
      this.$store.dispatch('currentConnections/removeUnusedTypes')
    },
    changeConnectionType (type) {
      this.$store.dispatch('currentConnections/update', {
        id: this.currentConnection.id,
        connectionTypeId: type.id
      })
      this.$store.commit('currentConnections/lastTypeId', type.id)
    },
    toggleColorPicker () {
      this.colorPickerIsVisible = !this.colorPickerIsVisible
    },
    closeColorPicker () {
      this.colorPickerIsVisible = false
      this.$store.commit('triggerCloseChildDialogs')
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
      const pinchZoom = utils.visualViewport().scale
      const position = this.$store.state.connectionDetailsPosition
      if (!this.$refs.infoSection) { return }
      if (!this.$refs.resultsActions) { return }
      const infoSection = this.$refs.infoSection.getBoundingClientRect()
      const resultsActions = this.$refs.resultsActions.getBoundingClientRect()
      const dialogInfoHeight = infoSection.height + resultsActions.height
      const maxHeight = (this.$store.state.viewportHeight - position.y - dialogInfoHeight) * pinchZoom
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
          utils.scrollIntoView({ element })
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
    focus () {
      this.$store.commit('pinchCounterZoomDecimal', 1)
      this.$store.dispatch('history/pause')
      this.inputIsFocused = true
    },
    updatePinchCounterZoomDecimal () {
      this.$store.commit('pinchCounterZoomDecimal', utils.pinchCounterZoomDecimal())
    },
    blur () {
      this.$store.commit('triggerUpdatePositionInVisualViewport')
      this.$store.dispatch('history/resume')
      const connectionType = utils.clone(this.currentConnectionType)
      this.$store.dispatch('history/add', { connectionTypes: [connectionType], useSnapshot: true })
      this.inputIsFocused = false
    },
    updateNextConnectionColor () {
      const isThemeDark = this.$store.state.currentUser.theme === 'dark'
      let color = randomColor({ luminosity: 'light' })
      if (isThemeDark) {
        color = randomColor({ luminosity: 'dark' })
      }
      this.nextConnectionTypeColor = color
    }
  },
  watch: {
    currentConnection (current) {
      this.$store.dispatch('currentConnections/removeUnusedTypes')
      this.$nextTick(() => {
        if (this.visible) {
          this.colorPickerIsVisible = false
          this.scrollIntoViewAndFocus()
          this.$store.commit('currentConnections/lastTypeId', this.currentConnectionType.id)
        } else {
          this.$store.commit('shouldHideConnectionOutline', false)
        }
      })
    },
    visible (visible) {
      if (visible) {
        this.updatePinchCounterZoomDecimal()
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
  transform-origin top left
  .type-name
    margin-left 6px
    border-color var(--primary-on-light-background)
    color var(--primary-on-light-background)
    &.is-dark
      border-color var(--primary-on-dark-background)
      color var(--primary-on-dark-background)
  .edit-message
    button
      margin-top 10px
  .results-actions
    .badge-in-button
      margin-left 5px
      border-radius var(--small-entity-radius)
    label
      .badge-in-button
        margin-left 0
  .name
    color var(--primary)
  .info-section
    position relative
  .dark-theme-background-layer
    z-index 0

</style>
