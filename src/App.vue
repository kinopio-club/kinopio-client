<template lang="pug">
  //- router-view is the route component (e.g. Space, Add)
  router-view
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  document.getElementById('static-space')?.remove()
})
</script>
