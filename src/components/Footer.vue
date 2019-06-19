<template lang="pug">
footer
  span Prototype {{buildHash}}
</template>

<script>
export default {
  name: 'Footer',
  mounted () {
    console.log('🐢 kinopio-client', this.buildHash)
  },
  computed: {
    buildHash () {
      const regex = /(app\.)([a-z0-9])\w+/
      const path = document.querySelector('script').src
      let hash = path.match(regex)[0] // app.768db305407f4c847d44
      return hash.replace('app.', '') // 768db305407f4c847d44
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
