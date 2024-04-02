<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const emit = defineEmits(['updateLocalSpaces'])

const shouldIncreaseUIContrast = computed(() => store.state.currentUser.shouldIncreaseUIContrast)
const isOnline = computed(() => store.state.isOnline)

const isFavoriteSpace = computed(() => store.getters['currentSpace/isFavorite'])
const toggleIsFavoriteSpace = () => {
  const space = store.state.currentSpace
  const value = !isFavoriteSpace.value
  store.dispatch('currentUser/updateFavoriteSpace', { space, value })
  emit('updateLocalSpaces')
}
</script>

<template lang="pug">
.button-wrap.favorite-space-button
  button(v-if="isOnline" :class="{active: isFavoriteSpace, 'translucent-button': !shouldIncreaseUIContrast}" @click.left.prevent="toggleIsFavoriteSpace" title="Favorite Space")
    img.icon(v-if="isFavoriteSpace" src="@/assets/heart.svg")
    img.icon(v-else src="@/assets/heart-empty.svg")
</template>

<style lang="stylus">
</style>
