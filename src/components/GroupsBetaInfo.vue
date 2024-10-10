<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const props = defineProps({
  message: String
})
</script>

<template lang="pug">
section.groups-beta-info
  p {{ props.message }}
  p Interested in trying groups in your company?
  p
    a(href="mailto:support@kinopio.club?subject=Kinopio Groups Beta")
      button
        img.icon(src="@/assets/mail.svg")
        span Email Support
  img.placeholder(src="@/assets/collaborators.jpg")
</template>

<style lang="stylus">
.groups-beta-info
  .placeholder
    border-radius var(--small-entity-radius)
    margin-top 10px

</style>
