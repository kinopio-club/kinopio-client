<template lang="pug">
dialog(v-if="cardDetailsVisible" :open="cardDetailsVisible")
  section
    textarea.name(
      rows="1"
      placeholder="name"
      v-model="name"
      autofocus="true"
      @focus="resizeTextArea"
      @input="resizeTextArea"
    )
    p cardid {{id}}
    // div
      // button hihi
</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'CardDetails',
  props: {
    card: Object
  },
  computed: {
    id () { return this.card.id },
    x () { return this.card.x },
    y () { return this.card.y },
    z () { return this.card.z },
    cardDetailsVisible () { return this.card.cardDetailsVisible },
    name: {
      get () {
        return this.card.name
      },
      set (newValue) {
        const options = {
          type: 'name',
          value: newValue,
          cardId: this.id
        }
        this.$store.commit('currentSpace/updateCardDetails', options)
      }
    }
  },
  methods: {
    resizeTextArea (event) {
      utils.resizeTextArea(event)
    }
  },
  watch: {
    cardDetailsVisible (visible) {
      this.$store.commit('updatePageSizes')
      const isEmpty = !this.card.name // TODO: expand isEmpty to inlcude other metadata content (images etc)
      if (!visible && isEmpty) {
        this.$store.commit('currentSpace/deleteCard', this.card.id)
      }
    }
  }
}
</script>

<style lang="stylus">
</style>
