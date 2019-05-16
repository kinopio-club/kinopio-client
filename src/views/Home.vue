<template lang="pug">
  .home
    img(alt="logo" src="@/assets/logo.png" width="50")
    HelloWorld(msg="helloooo")
</template>

<script>
// @ is an alias to /src
import HelloWorld from '@/components/HelloWorld.vue'

export default {
  name: 'home',
  components: {
    HelloWorld
  }
}
</script>
