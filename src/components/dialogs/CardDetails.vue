<template lang="pug">
dialog(v-if="visible" :open="visible")
  section
    textarea.name(
      rows="1"
      placeholder="name"
      v-model="name"
    )
    p cardid {{id}}
</template>

<script>
export default {
  name: 'CardDetails',
  props: {
    card: Object
  },
  updated () {
    this.$nextTick(() => {
      if (this.visible) {
        let textareas = document.querySelectorAll('dialog textarea')
        textareas.forEach(textarea => {
          textarea.style.height = textarea.scrollHeight + 1 + 'px'
        })
      }
    })
  },
  computed: {
    id () { return this.card.id },
    x () { return this.card.x },
    y () { return this.card.y },
    z () { return this.card.z },
    visible () { return this.card.cardDetailsVisible },
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
  watch: {
    visible (visible) {
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
