<template lang="pug">
dialog.restore(v-if="visible" :open="visible" @click.stop)
  section
    p Restore Cards
  //section
  //  .segmented-buttons
  //    button Cards
  //    button Spaces

  section.results-section
    ul.results-list
      template(v-for="(card in removedCards")
        li(:key="card.id" @click="restoreCard(card)")
          .badge
            img.refresh.icon(src="@/assets/undo.svg")
          .name {{card.name}}
          button(@click.stop="showRemoveCardConfirmationVisible(card)" v-if="!isRemoveCardConfirmationVisible(card)")
            img(src="@/assets/remove.svg")
          p(v-if="isRemoveCardConfirmationVisible(card)") Permanently remove?
            .segmented-buttons(v-if="isRemoveCardConfirmationVisible(card)")
              button(@click.stop="hideRemoveCardConfirmationVisible")
                span Cancel
              button.danger
                img.icon(src="@/assets/remove.svg")
                span Remove
        //button.danger
        //li(:class="{ active: connectionTypeIsActive(type.id) }" @click="changeConnectionType(type)" :key="type.id")
        //  .badge(:style="{backgroundColor: type.color}" :class="{checked: connectionTypeIsDefault(type.id)}")
        //  .name {{type.name}}

</template>

<script>
export default {
  name: 'Restore',
  props: {
    visible: Boolean
  },
  data () {
    return {
      removeCardConfirmationVisibleForCardId: ''
      // removedCards: []
    }
  },
  // created(){
  //   this.$store.subscribe((mutation, state) => {
  //     if (mutation.type === 'currentSpace/restoreSpace') {
  //       console.log('slk',this.$store.state.currentSpace.removedCards)
  //     }
  //   })
  // },
  computed: {
    removedCards () {
      return this.$store.state.currentSpace.removedCards
    }
  },
  methods: {
    restoreCard (card) {
      console.log('restoreCard', card.id)
    },

    showRemoveCardConfirmationVisible (card) {
      this.removeCardConfirmationVisibleForCardId = card.id
      console.log('toggleRemoveCardConfirmationVisible', this.removeCardConfirmationVisibleForCardId)
    },
    hideRemoveCardConfirmationVisible () {
      this.removeCardConfirmationVisibleForCardId = ''
    },
    isRemoveCardConfirmationVisible (card) {
      return Boolean(this.removeCardConfirmationVisibleForCardId === card.id)
    }
    // toggleRemoveCardConfirmationIsVisible (card) {
    //   if (!this.removeCardConfirmationVisibleForCardId) {
    //     this.removeCardConfirmationVisibleForCardId = card.id
    //   } else {
    //     this.removeCardConfirmationVisibleForCardId = ''
    //   }
    //   console.log('toggleRemoveCardConfirmationVisible', this.removeCardConfirmationVisibleForCardId)
    // }
  }
  // watch: {
  //   visible (visible) {
  //     if (visible) {
  //       // this.removedCards = this.$store.state.currentSpace.removedCards
  //     }
  //   }
  // }
}
</script>

<style lang="stylus">
.restore
  overflow auto
  .results-section
    max-height initial
    border-top 1px solid var(--primary)
    padding-top 4px
  li
    button
      margin-left auto
</style>
