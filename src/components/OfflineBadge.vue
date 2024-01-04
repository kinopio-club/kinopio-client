<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const visible = computed(() => !store.state.isOnline)
const triggerOfflineIsVisible = () => {
  store.commit('triggerOfflineIsVisible')
}
</script>

<template lang="pug">
div.offline-badge
  span.badge.info.button-badge(v-if="visible" @click="triggerOfflineIsVisible")
    img.icon.offline(src="@/assets/offline.svg")
    span Offline

</template>

<style lang="stylus">
// .offline-badge
  // margin-top 10px
//   margin-bottom 10px
</style>
