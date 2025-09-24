<script setup>
import { reactive, computed, onMounted, watch, ref, nextTick } from 'vue'

import utils from '@/utils.js'

const props = defineProps({
  title: String
})

const yearsOld = computed(() => {
  const startYear = 2018
  const currentYear = new Date().getFullYear()
  return currentYear - startYear
})
const title = computed(() => props.title || 'Who Makes Kinopio?')
</script>

<template lang="pug">
details.about-me
  summary {{title}}
  section.subsection
    p Hi I'm{{' '}}
      a(href="https://pketh.org") Piri
      span , and I've building Kinopio for {{yearsOld}} years.
    p I believe in building ethical, economically-sustainable,
      span {{' '}}
      a(href="https://pketh.org/organic-software.html") organic software
      span {{' '}}
      span designed by artists, built by craftspeople, and funded by the people who enjoy it.
    p If you're curious, I wrote{{' '}}
      a(href="https://pketh.org/how-kinopio-is-made.html")
        span How Kinopio is Made
      span .
    p Sometimes{{' '}}
      a(href="https://lucas.love") Lucas
      span {{' '}}helps out too.
</template>

<style lang="stylus">
</style>
