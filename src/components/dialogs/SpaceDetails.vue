<template lang="pug">
dialog.narrow.space-details(v-if="visible" :open="visible" @click="closeDialogs")
  section
    p supsup
</template>

<script>

export default {
  name: 'SpaceDetails',
  props: {
    visible: Boolean
  },
  computed: {
  }
}
</script>

<style lang="stylus">
.space-details
  top calc(100% - 8px)
</style>
