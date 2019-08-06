<template lang="pug">
dialog.narrow.space-details(v-if="visible" :open="visible")
  section
    input(placeholder="name" v-model="spaceName")

</template>

<script>
export default {
  name: 'SpaceDetails',
  props: {
    visible: Boolean
  },
  computed: {
    spaceName: {
      get () {
        return this.$store.state.currentSpace.name
      },
      set (newName) {
        this.$store.commit('currentSpace/updateName', newName)
      }
    }
  },
  methods: {
  }
}
</script>

<style lang="stylus">
.space-details
  top calc(100% - 8px)
</style>
