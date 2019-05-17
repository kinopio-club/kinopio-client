<template lang="pug">
  header
    img(alt="logo" src="@/assets/logo.png" width="50")
</template>

<script>
export default {
  name: 'Header',
  props: {
    msg: String
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="stylus">
header
  background-color: var(--violet)
</style>
