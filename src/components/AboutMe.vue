<script setup>
import { reactive, computed, onMounted, watch, ref, nextTick } from 'vue'
</script>

<template lang="pug">
details.about-me
  summary Who Makes Kinopio?
  section.subsection
    p Hi I'm{{' '}}
      a(href="https://pketh.org") Piri,
    p I believe in building ethical, economically-sustainable,
      span {{' '}}
      a(href="https://pketh.org/organic-software.html") organic software
      span {{' '}}
      span designed by artists, built by craftspeople, and funded by the people who enjoy it.
    p
      a(href="https://pketh.org")
</template>

<style lang="stylus">
</style>
