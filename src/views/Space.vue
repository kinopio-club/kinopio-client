<template lang="pug">
main.space
  Connections
  span(v-for="card in cards")
    Card(
      :id="card.id"
      :x="card.x"
      :y="card.y"
      :name="card.name"
    )
  footer
    .badge.beta Engineering Prototype
</template>

<script>
import Connections from '@/components/Connections.vue'
import Card from '@/components/Card.vue'

export default {
  name: 'Space',
  components: {
    Connections,
    Card
  },
  computed: {
    cards () {
      return this.$store.state.currentSpace.cards
    }
  }
}
</script>

<style lang="stylus">
.space
  position absolute
  top 0
  left 0
  width: 100%
  height: 100%
  pointer-events none
</style>
