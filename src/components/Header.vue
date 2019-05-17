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

<!-- Add "scoped" attribute to limit CSS to this component only, no-scope = part of the global css -->
<style scoped lang="stylus">
header
  background-color: pink
</style>
