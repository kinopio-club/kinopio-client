<template lang="pug">
dialog.community(v-if="visible" :open="visible")
  section
    .segmented-buttons
      button
        span New Spaces
        //- Loader(:visible="loading.cards")
      button
        span Templates
        //- Loader(:visible="loading.spaces")

  section.results-section
    ul.results-list
      li hello
      li yo

</template>

<script>

export default {
  name: 'Explore',
  props: {
    visible: Boolean
  }

}
</script>

<style lang="stylus">
.community
  .results-section
    border-top 1px solid var(--primary)
    padding-top 4px
</style>
