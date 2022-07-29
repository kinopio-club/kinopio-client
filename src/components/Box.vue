<template lang="pug">
.box(:style="styles")
  span BOX TEST
</template>

<script>
export default {
  name: 'Box',
  props: {
    box: Object
  },
  computed: {
    styles () {
      return {}
    }
  },
  methods: {
    // toggleBoxDetails, set boxdetailsposition, boxDetailsIsVisible (like carddetails)
  }
}
</script>

<style lang="stylus">
.box
  position absolute
  background-color pink
  left 200px
  top 200px
</style>
