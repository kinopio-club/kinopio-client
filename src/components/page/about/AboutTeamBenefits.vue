<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
</script>

<template lang="pug">
//- todo table grid layout
section.team-benefits
  video(
    autoplay
    loop
    muted
    playsinline
    poster="https://updates.kinopio.club/page/about/hero/1.webp"
    aria-label="Kinopio collaboration in action."
    width="715"
    height="511"
  )
    source(src="https://cdn.kinopio.club/8wV0-FJ4jGhuj4j84Ub6n/qCqw4D5OqarHGTLe.mp4")
  p Also made for teams
  p More effective meetings, better alignment. Reduce time in meetings. Get projects started faster. Build things more effectively/efficiently together

</template>

<style lang="stylus">
// section.team-benefits
</style>
