<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const emit = defineEmits(['updateLocalSpaces'])

const isFavoriteSpace = computed(() => store.getters['currentSpace/isFavorite'])
const toggleIsFavoriteSpace = () => {
  const space = store.state.currentSpace
  const value = !isFavoriteSpace.value
  store.dispatch('currentUser/updateFavoriteSpace', { space, value })
  emit('updateLocalSpaces')
}
const shouldIncreaseUIContrast = computed(() => store.state.currentUser.shouldIncreaseUIContrast)
</script>

<template lang="pug">
.button-wrap.favorite-space-button
  button(:class="{active: isFavoriteSpace, 'translucent-button': !shouldIncreaseUIContrast}" @click.left.prevent="toggleIsFavoriteSpace" @keydown.stop.enter="toggleIsFavoriteSpace" title="Favorite Current Space")
    img.icon(v-if="isFavoriteSpace" src="@/assets/heart.svg")
    img.icon(v-else src="@/assets/heart-empty.svg")
</template>

<style lang="stylus">
// .component-name
</style>
