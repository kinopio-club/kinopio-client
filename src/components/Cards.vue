<template lang="pug">
.cards
  //- locked cards rendered in ItemsLocked
  template(v-for="card in unlockedCards")
    Card(:card="card")
</template>

<script>
import Card from '@/components/Card.vue'

export default {
  name: 'Cards',
  components: {
    Card
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerUpdateUrlPreviewComplete') {
        this.$store.dispatch('currentCards/checkIfShouldUpdateNewTweetCards')
      }
    })
  },
  computed: {
    unlockedCards () { return this.$store.getters['currentCards/isNotLocked'] }
  },
  methods: {
  }
}
</script>

<style lang="stylus">
</style>
