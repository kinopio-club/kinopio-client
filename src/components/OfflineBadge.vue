<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const visible = computed(() => !store.state.isOnline)
const offlineIsVisible = computed(() => store.state.offlineIsVisible)
const toggleOfflineIsVisible = () => {
  const value = store.state.offlineIsVisible
  store.commit('offlineIsVisible', !value)
}
</script>

<template lang="pug">
.row.offline-badge
  span.badge.info.button-badge(v-if="visible" @click="toggleOfflineIsVisible" :class="{ active: offlineIsVisible }")
    img.icon.offline(src="@/assets/offline.svg")
    span Offline

</template>

<style lang="stylus">
.offline-badge
  .badge
    display block !important
</style>
