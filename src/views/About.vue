<script setup>
// import Counter from '@/components/Counter.vue'
</script>

<template lang="pug">
  header
    nav
      .row
        .left
          p yolo
        .right
          router-link(to="/app")
            .button-wrap
              button Open App

  main.page
    p hello
  //- Counter
</template>

<style lang="stylus">
main.page
  margin-left 1rem
  margin-top 5rem
</style>
