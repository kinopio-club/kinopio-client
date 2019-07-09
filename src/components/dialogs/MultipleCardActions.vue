<template lang="pug">
dialog(v-if="visible" :open="visible" :style="position")
  section
    p multi actions for card ids: {{cardsSelected}}
    button connect
    button disconnect
    button archive
</template>

<script>
export default {
  name: 'MultipleCardActions',
  computed: {
    visible () { return this.$store.state.multipleCardActionsIsVisible },
    position () {
      const cursor = this.$store.state.multipleCardActionsPosition
      console.log('💐', cursor)
      return {
        left: `${cursor.x}px`,
        top: `${cursor.y}px`
      }
    },
    cardsSelected () {
      return this.$store.state.multipleCardsSelected
    }
    // name: {
    //   get () {
    //     return this.connection.name
    //   },
    //   set (newValue) {
    //     const options = {
    //       type: 'name',
    //       value: newValue,
    //       connectionId: this.id
    //     }
    //     this.$store.commit('currentSpace/updateconnectionDetails', options)
    //   }
    // },
  }
}
</script>

<style lang="stylus">
</style>
