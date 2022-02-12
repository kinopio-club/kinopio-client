<template lang="pug">
span.name-match
  template(v-for="segment in nameSegments")
    span(:class="{ match: segment.isMatch }") {{ segment.character }}
</template>

<script>
export default {
  name: 'NameMatchFilter',
  props: {
    name: String,
    indexes: Array
  },
  computed: {
    nameSegments () {
      // indexes [0, 1, 4] = highlight characters at 0, 1, and 4
      let segments = this.name.split('')
      segments = segments.map((character, index) => {
        let isMatch
        if (this.indexes.includes(index)) {
          isMatch = true
        }
        return { character, isMatch }
      })
      return segments
    }
  }
}
</script>

<style lang="stylus">
.name-match
  .match
    background-color var(--search-background)
</style>
