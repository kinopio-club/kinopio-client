<template lang="pug">
dialog.tag-details(v-if="visible" :open="visible" :style="dialogPosition" ref="dialog" @click.left="closeDialogs")
  section.edit-card(v-if="!cardDetailsIsVisible")
    button(@click="showCardDetails") Edit Card
  section(:style="{backgroundColor: color}")
    .row
      .button-wrap
        button.change-color(:disabled="!canEditSpace" @click.left.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
          .current-color(:style="{backgroundColor: color}")
        ColorPicker(:currentColor="color" :visible="colorPickerIsVisible" @selectedColor="updateTagColor")
      input.tag-name(:disabled="!canEditSpace" placeholder="Tag Name" v-model="name" ref="name")
  section.results-section
    //- resultsfilter
    ul.results-list
      template(v-for="(card in tagCards")
        li(:data-card-id="card.id" @click="showCardDetails(card)")
          p.name.name-segments
            span.badge.space-badge(v-if="card.spaceName") {{card.spaceName}}
            template(v-for="segment in card.nameSegments")
              img(v-if="segment.isImage" :src="segment.url")
              span(v-if="segment.isText") {{segment.content}}
              //- Tags
              span.badge.tag-badge(
                v-if="segment.isTag"
                :style="{backgroundColor: segment.color}"
                :class="{ active: currentTag.name === segment.name }"
              ) {{segment.name}}

    Loader(:visible="true")
  //- section
  //-   button
  //-     img.icon(src="@/assets/add.svg")
  //-     span Space from Cards

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
import Loader from '@/components/Loader.vue'
import scrollIntoView from '@/scroll-into-view.js'
import utils from '@/utils.js'
import cache from '@/cache.js'

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
    currentTag () { return this.$store.state.currentSelectedTag }, // name, color, cardId
    position () { return this.$store.state.tagDetailsPosition },
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    currentSpaceId () { return this.$store.state.currentSpace.id },
    dialogPosition () {
      return {
        left: `${this.position.x}px`,
        top: `${this.position.y}px`
      }
    },
    color () { return this.currentTag.color },
    cardDetailsIsVisible () { return this.$store.state.cardDetailsIsVisibleForCardId },
    name: {
      get () {
        return this.currentTag.name
      },
      set (newName) {
        console.log('🌺', newName)
        // const connectionType = {
        //   id: this.currentConnectionType.id,
        //   name: newName
        // }
        // this.$store.dispatch('currentSpace/updateConnectionType', connectionType)
      }
    },
    tagCards () {
      const cardsInCurrentSpace = this.tagCardsInCurrentSpace
      const cardsInCachedSpaces = cache.cardsByTagNameExcludingSpaceById(this.currentTag.name, this.currentSpaceId)
      // todo fetch remote, and merge
      console.log('🥂', cardsInCurrentSpace, cardsInCachedSpaces)
      let cards = cardsInCurrentSpace.concat(cardsInCachedSpaces)
      cards = cards.map(card => {
        card = utils.clone(card)
        card.nameSegments = this.cardNameSegments(card.name)
        return card
      })
      return cards
    },
    tagCardsInCurrentSpace () {
      const cardId = this.currentTag.cardId
      const tags = this.$store.getters['currentSpace/tagsByNameExcludingCardById']({
        name: this.currentTag.name,
        cardId
      })
      let cards = tags.map(tag => {
        let card = this.$store.getters['currentSpace/cardById'](tag.cardId)
        return card
      })
      cards = cards.filter(card => card)
      return cards
    }
  },
  methods: {
    cardNameSegments (name) {
      let url = utils.urlFromString(name)
      let imageUrl
      if (utils.urlIsImage(url)) {
        imageUrl = url
        name = name.replace(url, '')
      }
      let segments = utils.cardNameSegments(name)
      if (imageUrl) {
        segments.unshift({
          isImage: true,
          url: imageUrl
        })
      }
      return segments.map(segment => {
        if (segment.isTag) {
          const spaceTag = this.$store.getters['currentSpace/tagByName'](segment.name)
          if (spaceTag) {
            segment.color = spaceTag.color
          } else {
            const cachedTag = cache.tagByName(segment.name)
            segment.color = cachedTag.color
          }
        }
        return segment
      })
    },
    showCardDetails (card) {
      // TODO
      console.log('🍄 diff show card logic if card.spaceId not current', this.currentSpaceId, card.spaceId)

      const cardId = card.id || this.currentTag.cardId
      this.$store.dispatch('closeAllDialogs', 'TagDetails.showCardDetails')
      this.$store.dispatch('currentSpace/incrementCardZ', cardId)
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
  .name-segments
    .badge
      &:last-child
        margin 0
    img
      display inline
      max-height 30px
      border-radius 3px
      margin-right 5px
      vertical-align middle
  .space-badge
    // margin 0
    background-color var(--secondary-background)
  .tag-badge
    &.active
      box-shadow var(--button-active-inset-shadow)

  // .results-header
  //   padding-bottom 4px
//   .edit-message
//     button
//       margin-top 10px

</style>
