<script setup>
import { reactive, computed, onMounted } from 'vue'

import { useUserStore } from '@/stores/useUserStore'

const userStore = useUserStore()

const props = defineProps({
  images: Array,
  activeUrl: String,
  isSmall: Boolean
})
const emit = defineEmits(['selectImage'])
const selectImage = (image) => {
  emit('selectImage', image.url)
}
const isActiveUrl = (image) => {
  return image.url === props.activeUrl
}
const previewUrl = (image) => {
  const isThemeDark = userStore.theme === 'dark'
  let url = image.previewUrl || image.url
  if (isThemeDark) {
    url = image.darkPreviewUrl || image.previewUrl || image.url
  }
  return url
}
</script>

<template lang="pug">
ul.results-list.image-list
  template(v-for="image in images" :key="image.url")
    li(@click.left="selectImage(image)" tabindex="0" v-on:keydown.enter="selectImage(image)" :class="{ active: isActiveUrl(image), 'is-small': props.isSmall}")
      img(:src="previewUrl(image)")
      a(v-if="image.sourcePageUrl" :href="image.sourcePageUrl" target="_blank" @click.left.stop)
</template>

<style lang="stylus" scoped>
.image-list
  li
    width 33% !important
    padding 3px
    padding-right 2px
    padding-bottom 2px
    align-items center
    img
      min-height 80px !important
      border-radius var(--entity-radius) !important
    &.is-small
      width 20% !important
      img
        min-height 40px !important
</style>
