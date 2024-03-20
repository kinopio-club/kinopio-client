<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const shouldIncreaseUIContrast = computed(() => store.state.currentUser.shouldIncreaseUIContrast)
const isOnline = computed(() => store.state.isOnline)

const isFavoriteSpace = computed(() => store.getters['currentSpace/isFavorite'])
const toggleIsFavoriteSpace = () => {
  const currentSpace = store.state.currentSpace
  if (isFavoriteSpace.value) {
    store.dispatch('currentUser/removeFavorite', { type: 'space', item: currentSpace })
  } else {
    store.dispatch('currentUser/addFavorite', { type: 'space', item: currentSpace })
  }
}
</script>

<template lang="pug">
.button-wrap
  button(v-if="isOnline" :class="{active: isFavoriteSpace, 'translucent-button': !shouldIncreaseUIContrast}" @click.left.prevent="toggleIsFavoriteSpace" title="Favorite Space")
    img.icon(v-if="isFavoriteSpace" src="@/assets/heart.svg")
    img.icon(v-else src="@/assets/heart-empty.svg")
</template>

<style lang="stylus">
</style>
