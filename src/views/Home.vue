<template lang="pug">
  .home
    img(alt="logo" src="@/assets/logo.png" width="50")
    Space(msg="helloooo")
</template>

<script>
// @ is an alias to /src
import Space from '@/components/Space.vue'

export default {
  name: 'home',
  components: {
    Space
  }
}
</script>
