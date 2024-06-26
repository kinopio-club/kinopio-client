<template lang="pug">
.media-preview.row(v-if="visible")
  //- Image
  .image-preview.row(v-if="formats.image")
    a(:href="formats.image" target="_blank")
      img.image.clickable-item(:src="formats.image" draggable="false")
  //- Video
  .video-preview.row(v-if="formats.video")
    a(:href="formats.video" target="_blank")
      video.video.clickable-item(autoplay loop muted playsinline draggable="false")
        source(:src="formats.video")
  //- Audio
  .row(v-if="formats.audio")
    Audio(:visible="Boolean(formats.audio)" :url="formats.audio" :normalizedName="this.card.name" :parentIsCardDetails="true")
    .content-buttons
      .button-wrap
        a(:href="formats.audio" target="_blank")
          button.small-button
            img.icon.visit(src="@/assets/visit.svg")
</template>

<script>
import Audio from '@/components/Audio.vue'

export default {
  name: 'MediaPreview',
  components: {
    Audio
  },
  props: {
    visible: Boolean,
    card: Object,
    formats: Object
  },
  computed: {
    canEditCard () {
      const canEditSpace = this.$store.getters['currentUser/canEditSpace']()
      const isSpaceMember = this.$store.getters['currentUser/isSpaceMember']()
      const cardIsCreatedByCurrentUser = this.$store.getters['currentUser/cardIsCreatedByCurrentUser'](this.card)
      if (isSpaceMember) { return true }
      if (canEditSpace && cardIsCreatedByCurrentUser) { return true }
      return false
    }
  }
}
</script>

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
