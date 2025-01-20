<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

</script>

<template lang="pug">
section.about-groups
  p Group spaces together and collaborate with Group members
  p
    a(href="https://help.kinopio.club/posts/groups")
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
