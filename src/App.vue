<template lang="pug">
  //- router-view is the route component (e.g. Space, Add)
  router-view
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  document.getElementById('page-meta-body-content')?.remove()
})
</script>
