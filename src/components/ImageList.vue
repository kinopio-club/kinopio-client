<script setup>
// import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const props = defineProps({
  images: Array,
  activeUrl: String
})
const emit = defineEmits(['selectImage'])
const selectImage = (image) => {
  emit('selectImage', image.url)
}
const isActiveUrl = (image) => {
  return image.url === props.activeUrl
}
</script>

<template lang="pug">
ul.results-list.image-list
  template(v-for="image in images" :key="image.url")
    li(@click.left="selectImage(image)" tabindex="0" v-on:keydown.enter="selectImage(image)" :class="{ active: isActiveUrl(image)}")
      img(:src="image.previewUrl || image.url")
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
</style>
