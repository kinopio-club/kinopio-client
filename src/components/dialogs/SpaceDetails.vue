<template lang="pug">
dialog.narrow.space-details(v-if="visible" :open="visible")
  section
    .row
      input(placeholder="name" v-model="spaceName")

    button Remix
    button
      img.icon(src="@/assets/remove.svg")
      span Remove

  section

    // TODO results list here

    button
      img.icon(src="@/assets/add.svg")
      span Add

  section
    button Export
    // TODO new Export dialog, currently just two option: download json: current space, all spaces

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
