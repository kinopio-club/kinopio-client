<template lang="pug">
.card-embed(v-if="visible")
  iframe(allowfullscreen :src="url")
</template>

<script>
export default {
  name: 'CardEmbed',
  props: {
    visible: Boolean,
    url: String
  }
}
</script>

<style lang="stylus">
.card-embed
  iframe
    border none
    border-radius 3px
    max-width 100%
</style>
