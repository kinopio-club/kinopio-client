<template lang="pug">
dialog.narrow.tag-details(v-if="visible" :open="visible" :style="dialogPosition" ref="dialog" @click.left="closeDialogs")
  section.edit-card(v-if="!cardDetailsIsVisible")
    button(@click="showCardDetails") Edit Card
  section(:style="{backgroundColor: color}")
    .row
      .button-wrap
        button.change-color(:disabled="!canEditSpace" @click.left.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
          .current-color(:style="{backgroundColor: color}")
        ColorPicker(:currentColor="color" :visible="colorPickerIsVisible" @selectedColor="updateTagColor")
      input.tag-name(:disabled="!canEditSpace" placeholder="Tag Name" v-model="name" ref="name")
  //- section.results-header
  //-   p {{currentSpaceName}}
  section.results-section
    //- resultsfilter
    ul.results-list
      li
        .name supsup
    Loader(:visible="true")

  //- section.results-header
  //-   p Elsewhere
  //- section.results-section
  //-   //- resultsfilter
  //-   ul.results-list
  //-     li
  //-       .name supsup

  //-   .row
  //-     button(:disabled="!canEditConnection" :class="{active: labelIsVisible}" @click.left="toggleLabelIsVisible")
  //-       img.icon(v-if="labelIsVisible" src="@/assets/view.svg")
  //-       img.icon(v-else src="@/assets/view-hidden.svg")

  //-       span Label
  //-     label(:class="{active: isDefault, disabled: !canEditSpace}" @click.left.prevent="toggleDefault" @keydown.stop.enter="toggleDefault")
  //-       input(type="checkbox" v-model="isDefault")
  //-       span Default

  //-   button(:disabled="!canEditConnection" @click.left="removeConnection")
  //-     img.icon(src="@/assets/remove.svg")
  //-     span Remove

  //-   p.edit-message(v-if="!canEditConnection")
  //-     template(v-if="spacePrivacyIsOpen")
  //-       span.badge.info
  //-         img.icon.open(src="@/assets/open.svg")
  //-         span In open spaces, you can only edit connections you've made
  //-     template(v-else-if="isInvitedButCannotEditSpace")
  //-       span.badge.info
  //-         img.icon(src="@/assets/unlock.svg")
  //-         span To edit spaces you've been invited to, you'll need to sign up or in
  //-       .row
  //-         .button-wrap
  //-           button(@click.left.stop="triggerSignUpOrInIsVisible") Sign Up or In
  //-     template(v-else-if="spacePrivacyIsClosed")
  //-       span.badge.info
  //-         img.icon(src="@/assets/unlock.svg")
  //-         span To edit closed spaces, you'll need to be invited

  //- section.results-actions
  //-   button(:disabled="!canEditConnection" @click.left="addConnectionType")
  //-     img.icon(src="@/assets/add.svg")
  //-     span Add

  //- section.results-section
  //-   ResultsFilter(:items="connectionTypes" @updateFilter="updateFilter" @updateFilteredItems="updateFilteredConnectionTypes")
  //-   ul.results-list
  //-     template(v-for="(type in connectionTypesFiltered")
  //-       li(:class="{ active: connectionTypeIsActive(type), disabled: !canEditConnection }" @click.left="changeConnectionType(type)" :key="type.id")
  //-         .badge(:style="{backgroundColor: type.color}" :class="{checked: connectionTypeIsDefault(type)}")
  //-         .name {{type.name}}
</template>

<script>
// import ResultsFilter from '@/components/ResultsFilter.vue'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import utils from '@/utils.js'

import Loader from '@/components/Loader.vue'
import scrollIntoView from '@/scroll-into-view.js'

export default {
  name: 'TagDetails',
  components: {
    ColorPicker,
    Loader
    // ResultsFilter
  },
  data () {
    return {
      colorPickerIsVisible: false
      // filter: '',
      // filteredTags: [],
    }
  },
  computed: {
    visible () { return this.$store.state.tagDetailsIsVisible },
    tag () { return this.$store.state.currentSelectedTag }, // name, color, cardId
    position () { return this.$store.state.tagDetailsPosition },
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    dialogPosition () {
      return {
        left: `${this.position.x}px`,
        top: `${this.position.y}px`
      }
    },
    // currentSpaceName () { return this.$store.state.currentSpace.name },
    color () { return this.tag.color },
    cardDetailsIsVisible () { return this.$store.state.cardDetailsIsVisibleForCardId },
    name: {
      get () {
        return this.tag.name
      },
      set (newName) {
        console.log('🌺', newName)
        // const connectionType = {
        //   id: this.currentConnectionType.id,
        //   name: newName
        // }
        // this.$store.dispatch('currentSpace/updateConnectionType', connectionType)
      }
    }

  //   currentConnection () {
  //     let connections = this.$store.state.currentSpace.connections
  //     return connections.find(connection => {
  //       return connection.id === this.$store.state.connectionDetailsIsVisibleForConnectionId
  //     })
  //   },
  //   canEditConnection () {
  //     const isSpaceMember = this.$store.getters['currentUser/isSpaceMember']()
  //     const connectionIsCreatedByCurrentUser = this.$store.getters['currentUser/connectionIsCreatedByCurrentUser'](this.currentConnection)
  //     const canEditSpace = this.$store.getters['currentUser/canEditSpace']()
  //     if (isSpaceMember) { return true }
  //     if (canEditSpace && connectionIsCreatedByCurrentUser) { return true }
  //     return false
  //   },
  //   typeName: {
  //     get () {
  //       return this.currentConnectionType.name
  //     },
  //     set (newName) {
  //       const connectionType = {
  //         id: this.currentConnectionType.id,
  //         name: newName
  //       }
  //       this.$store.dispatch('currentSpace/updateConnectionType', connectionType)
  //     }
  //   },
  //   connectionTypesFiltered () {
  //     if (this.filter) {
  //       return this.filteredConnectionTypes
  //     } else {
  //       return this.connectionTypes
  //     }
  //   }
  },
  methods: {
    showCardDetails () {
      const cardId = this.tag.cardId
      this.$store.dispatch('closeAllDialogs', 'TagDetails.showCardDetails')
      this.$store.commit('cardDetailsIsVisibleForCardId', cardId)
      this.$store.commit('parentCardId', cardId)
    },
    toggleColorPicker () {
      this.colorPickerIsVisible = !this.colorPickerIsVisible
    },
    closeDialogs () {
      this.colorPickerIsVisible = false
    },
    updateTagColor (newColor) {
      console.log('🎨', newColor)
      // const connectionType = {
      //   id: this.currentConnectionType.id,
      //   color: newColor
      // }
      // this.$store.dispatch('currentSpace/updateConnectionType', connectionType)
    },

    //   addConnectionType () {
    //     this.$store.dispatch('currentSpace/addConnectionType')
    //     const types = utils.clone(this.connectionTypes)
    //     const newType = last(types)
    //     this.changeConnectionType(newType)
    //   },
    //   connectionTypeIsActive (type) {
    //     return Boolean(type.id === this.currentConnection.connectionTypeId)
    //   },
    //   connectionTypeIsDefault (type) {
    //     const typePref = this.$store.state.currentUser.defaultConnectionTypeId
    //     return typePref === type.id
    //   },
    //   removeConnection () {
    //     this.$store.dispatch('currentSpace/removeConnection', this.currentConnection)
    //     this.$store.dispatch('closeAllDialogs', 'ConnectionDetails.removeConnection')
    //     this.$store.dispatch('currentSpace/removeUnusedConnectionTypes')
    //   },
    //   changeConnectionType (type) {
    //     this.$store.dispatch('currentSpace/updateConnectionTypeForConnection', {
    //       connectionId: this.currentConnection.id,
    //       connectionTypeId: type.id
    //     })
    //     this.$store.commit('currentSpace/reorderConnectionTypeToLast', type)
    //     this.updateDefaultConnectionType()
    //   },
    //   updateDefaultConnectionType () {
    //     const typePref = this.$store.state.currentUser.defaultConnectionTypeId
    //     this.isDefault = Boolean(typePref === this.currentConnectionType.id)
    //   },
    //   toggleDefault () {
    //     this.isDefault = !this.isDefault
    //     if (this.isDefault) {
    //       this.$store.dispatch('currentUser/defaultConnectionTypeId', this.currentConnectionType.id)
    //     } else {
    //       this.$store.dispatch('currentUser/defaultConnectionTypeId', '')
    //     }
    //   },
    //   toggleLabelIsVisible () {
    //     const newValue = !this.labelIsVisible
    //     this.$store.dispatch('currentSpace/updateLabelIsVisibleForConnection', {
    //       connectionId: this.currentConnection.id,
    //       labelIsVisible: newValue
    //     })
    //   },
    focusName () {
      this.$nextTick(() => {
        const element = this.$refs.name
        if (!element) { return }
        element.focus()
      })
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      const isTouchDevice = this.$store.state.isTouchDevice
      scrollIntoView.scroll(element, isTouchDevice)
    },
    scrollIntoViewAndFocus () {
      const element = this.$refs.name
      const length = this.name.length
      this.scrollIntoView()
      if (utils.isMobile()) { return }
      this.$nextTick(() => {
        this.focusName()
        if (length && element) {
          element.setSelectionRange(length, length)
        }
      })
    }
  //   updateView () {
  //     this.updateDefaultConnectionType()
  //     this.colorPickerIsVisible = false
  //   },
  //   triggerSignUpOrInIsVisible () {
  //     this.$store.commit('triggerSignUpOrInIsVisible')
  //   },
  //   updateFilteredConnectionTypes (types) {
  //     this.filteredConnectionTypes = types
  //   },
  //   updateFilter (filter) {
  //     this.filter = filter
  //   }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (this.visible) {
          // this.updateView()
          this.scrollIntoViewAndFocus()
        } else {
          this.closeDialogs()
        }
      })
    }
  }
}
</script>

<style lang="stylus">
.tag-details
  section.edit-card
    background-color var(--secondary-background)
  .tag-name
    margin-left 6px
  .results-section
    border-top 1px solid var(--primary)
    padding-top 2px
  .loader
    margin-left 6px

  // .results-header
  //   padding-bottom 4px
//   .edit-message
//     button
//       margin-top 10px

</style>
