<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

</script>

<template lang="pug">
section.about-groups
  p Group spaces together to organize them, and share them with your team, friends, or organization.
  p
    a(href="https://help.kinopio.club/posts/groups" target="_blank")
      button
        span More Info{{' '}}
        img.icon.visit(src="@/assets/visit.svg")
  img.placeholder(src="@/assets/collaborators.jpg")
</template>

<style lang="stylus">
section.about-groups
  .title-row
    align-items flex-start
  .small-button
    margin-top 0
  .placeholder
    border-radius var(--entity-radius)
    margin-top 10px
</style>
