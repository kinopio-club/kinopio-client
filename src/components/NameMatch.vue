<template lang="pug">
span.name-match hi {{name}}
//- for each index (num) in indexes
//- for each segment in segments
</template>

<script>
export default {
  name: 'NameMatchFilter',
  props: {
    name: String,
    indexes: Array
  },
  computed: {
    // createdByUserIsNotEmpty () { return utils.objectHasKeys(this.createdByUser) },
    segments () {
      return [{ name: 'asdf', isMatch: true }]
    }
  }
}
</script>

<style lang="stylus">
// .name-match
//   .users
//     display flex
//     flex-wrap wrap
</style>
