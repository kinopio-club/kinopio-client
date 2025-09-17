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
    p If you're curious, I wrote{{' '}}
      a(href="https://pketh.org/how-kinopio-is-made.html")
        span How Kinopio is Made
</template>

<style lang="stylus">
</style>
