<template lang="pug">
footer
  span Prototype {{appVersion}}
</template>

<script>
export default {
  name: 'Footer',
  computed: {
    appVersion () {
      const regex = /(app\.)([a-z0-9])\w+/
      let path = document.querySelector('script').src
      path = path.match(regex)[0] // app.768db305407f4c847d44
      path = path.replace('app.', '') // 768db305407f4c847d44
      return path
    }
  }
}
</script>

<style lang="stylus">
footer
  position fixed
  right 0
  bottom 0
</style>
