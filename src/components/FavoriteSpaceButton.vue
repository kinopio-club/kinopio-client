<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

const userStore = useUserStore()
const spaceStore = useSpaceStore()
const store = useStore()

const emit = defineEmits(['updateLocalSpaces'])

const props = defineProps({
  parentIsDialog: Boolean,
  isSmall: Boolean
})

const isTranslucentButton = computed(() => {
  if (props.parentIsDialog) { return }
  return !userStore.shouldIncreaseUIContrast
})
const isOnline = computed(() => store.state.isOnline)

const isFavoriteSpace = computed(() => spaceStore.getSpaceIsFavorite())
const toggleIsFavoriteSpace = () => {
  const space = spaceStore.getSpaceAllState
  const value = !isFavoriteSpace.value
  userStore.updateUserFavoriteSpace(space, value)
  emit('updateLocalSpaces')
}
</script>

<template lang="pug">
  button.favorite-space-button(v-if="isOnline" :class="{active: isFavoriteSpace && props.parentIsDialog, 'translucent-button': isTranslucentButton, 'small-button': props.isSmall}" @click.left.prevent="toggleIsFavoriteSpace" title="Favorite Space")
    img.icon(v-show="isFavoriteSpace" src="@/assets/heart.svg")
    img.icon(v-show="!isFavoriteSpace" src="@/assets/heart-empty.svg")
</template>

<style lang="stylus">
.favorite-space-button
  .icon
    margin 0 !important
</style>
