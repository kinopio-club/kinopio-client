<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import Audio from '@/components/Audio.vue'

const userStore = useUserStore()
const spaceStore = useSpaceStore()

const props = defineProps({
  visible: Boolean,
  card: Object,
  formats: Object
})

const canEditCard = () => {
  const canEditSpace = userStore.getUserCanEditSpace
  const isSpaceMember = userStore.getUserIsSpaceMember
  const cardIsCreatedByCurrentUser = userStore.getUserIsCardCreator(props.card)
  if (isSpaceMember) { return true }
  if (canEditSpace && cardIsCreatedByCurrentUser) { return true }
  return false
}
</script>

<template lang="pug">
.media-preview.row(v-if="props.visible")
  //- Image
  .image-preview.row(v-if="props.formats.image")
    a(:href="props.formats.image" target="_blank")
      img.image.clickable-item(:src="props.formats.image" draggable="false")
  //- Video
  .video-preview.row(v-if="props.formats.video")
    a(:href="props.formats.video" target="_blank")
      video.video.clickable-item(autoplay loop muted playsinline draggable="false")
        source(:src="props.formats.video")
  //- Audio
  .row(v-if="props.formats.audio")
    Audio(:visible="Boolean(props.formats.audio)" :url="props.formats.audio" :normalizedName="props.card.name" :parentIsCardDetails="true")
    .content-buttons
      .button-wrap
        a(:href="props.formats.audio" target="_blank")
          button.small-button
            img.icon.visit(src="@/assets/visit.svg")
</template>

<style lang="stylus">
.media-preview
  flex-flow wrap
  .row
    align-items flex-start
    .image,
    .video
      border-radius var(--entity-radius)
    .audio
      width 203px
    .content-buttons
      pointer-events none
      margin-left 6px
      display flex
      .button-wrap,
      button
        pointer-events all

  // similar to UrlPreview
  .image-preview,
  .video-preview
    max-height 120px
    overflow clip
    .content-buttons
      padding 4px
      z-index 1
      position absolute
      right 0
      top 0
    .image,
    video
      width 100%
      position relative

  .visit
    vertical-align 2px
</style>
