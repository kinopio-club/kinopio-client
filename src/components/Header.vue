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

<style lang="stylus">
header
  position fixed
  top 0
</style>
