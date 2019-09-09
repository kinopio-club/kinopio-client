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
          .name {{card.name || "[empty]"}}
          //.segmented-buttons
          //  button(@click.stop) U
          //  button(@click.stop)
          //    img(src="@/assets/remove.svg")
          button(@click.stop="toggleDeleteCardConfirmationVisible(card)")
            img(src="@/assets/remove.svg")

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
  computed: {
    removedCards () {
      return this.$store.state.currentSpace.removedCards
    }
  },
  methods: {
    restoreCard (card) {
      console.log('restoreCard', card.id)
    },
    toggleDeleteCardConfirmationVisible (card) {
      console.log('toggleDeleteCardConfirmationVisible', card.id)
    }
  }
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
