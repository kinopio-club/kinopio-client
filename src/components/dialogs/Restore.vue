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

        li(:key="card.id" @click="restoreCard(card)" :class="{ 'conformation-visible': isRemoveCardConfirmationVisible(card)}")
          .badge
            img.undo.icon(src="@/assets/undo.svg")
          .name {{card.name}}
          button(@click.stop="showRemoveCardConfirmationVisible(card)" v-if="!isRemoveCardConfirmationVisible(card)")
            img.icon(src="@/assets/remove.svg")

          .remove-confirmation(v-if="isRemoveCardConfirmationVisible(card)")
            p Permanently remove?
            .segmented-buttons(v-if="isRemoveCardConfirmationVisible(card)")
              button(@click.stop="hideRemoveCardConfirmationVisible")
                span Cancel
              button.danger(@click.stop="removeCard(card)")
                img.icon(src="@/assets/remove.svg")
                span Remove
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
    },
    removeCard (card) {
      this.$store.commit('currentSpace/removeCardFromRemovedCards', card.id)
    }
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
  .name
    white-space nowrap
    overflow hidden
    text-overflow ellipsis
    max-width calc(100% - 56px)
  .remove-confirmation
    margin-left 6px
    min-width 130px
    .segmented-buttons
      margin-top 5px
  .badge
    min-width 19px
</style>
