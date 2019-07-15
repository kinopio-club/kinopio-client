<template lang="pug">
dialog(v-if="visible" :open="visible" :style="position")
  section(:style="{backgroundColor: userColor}")
    .row(v-if="multipleCardsSelected")
      button Connect
      button Disconnect
    button
      img.icon(src="@/assets/remove.svg")
      span Remove
</template>

<script>
export default {
  name: 'MultipleCardActions',
  computed: {
    visible () { return this.$store.state.multipleCardActionsIsVisible },
    position () {
      const cursor = this.$store.state.multipleCardActionsPosition
      return {
        left: `${cursor.x}px`,
        top: `${cursor.y}px`
      }
    },
    userColor () {
      return this.$store.state.currentUser.color
    },
    multipleCardsSelected () {
      const numberOfCards = this.$store.state.multipleCardsSelected.length
      return Boolean(numberOfCards > 1)
    }
  }
}
</script>

<style lang="stylus">
</style>
