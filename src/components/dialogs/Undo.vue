<template lang="pug">
dialog.undo(v-if="visible" :open="visible" @click.stop)
  section
    p Undo Removed Cards
  //section
  //  .segmented-buttons
  //    button Cards
  //    button Spaces

  section.results-section
    ul.results-list
      template(v-for="(card in removedCards")
        li(:key="card.id" @click="restoreCard(card)")
          .badge U
          .name {{card.name}}
          button(@click.stop="showDeleteCardConfirmationVisible(card)" v-if="!isDeleteCardConfirmationVisible(card)")
            img(src="@/assets/remove.svg")
          p(v-if="isDeleteCardConfirmationVisible(card)") Permanently delete?
            .segmented-buttons(v-if="isDeleteCardConfirmationVisible(card)")
              button(@click.stop="hideDeleteCardConfirmationVisible")
                span Cancel
              button.danger
                img.icon(src="@/assets/remove.svg")
                span Delete

//button.danger
        //li(:class="{ active: connectionTypeIsActive(type.id) }" @click="changeConnectionType(type)" :key="type.id")
        //  .badge(:style="{backgroundColor: type.color}" :class="{checked: connectionTypeIsDefault(type.id)}")
        //  .name {{type.name}}

</template>

<script>
export default {
  name: 'Undo',
  props: {
    visible: Boolean
  },
  data () {
    return {
      deleteCardConfirmationVisibleForCardId: ''
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

    showDeleteCardConfirmationVisible (card) {
      this.deleteCardConfirmationVisibleForCardId = card.id
      console.log('toggleDeleteCardConfirmationVisible', this.deleteCardConfirmationVisibleForCardId)
    },
    hideDeleteCardConfirmationVisible () {
      this.deleteCardConfirmationVisibleForCardId = ''
    },
    isDeleteCardConfirmationVisible (card) {
      return Boolean(this.deleteCardConfirmationVisibleForCardId === card.id)
    }
    // toggleDeleteCardConfirmationIsVisible (card) {
    //   if (!this.deleteCardConfirmationVisibleForCardId) {
    //     this.deleteCardConfirmationVisibleForCardId = card.id
    //   } else {
    //     this.deleteCardConfirmationVisibleForCardId = ''
    //   }
    //   console.log('toggleDeleteCardConfirmationVisible', this.deleteCardConfirmationVisibleForCardId)
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
.undo
  overflow auto
  .results-section
    max-height initial
    border-top 1px solid var(--primary)
    padding-top 4px
  li
    button
      margin-left auto
</style>
