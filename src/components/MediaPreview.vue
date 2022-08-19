<template lang="pug">
.media-preview.row(v-if="visible")
  //- Image
  .image-preview.row(v-if="formats.image")
    a(:href="formats.image")
      img.image(:src="formats.image")
      .card-details-buttons
        .button-wrap
          a(:href="formats.image")
            button
              img.icon.visit(src="@/assets/visit.svg")
        .button-wrap
          button(@click="removeUrl(formats.image)" :disabled="!canEditCard")
            img.icon(src="@/assets/remove.svg")
  //- Video
  .video-preview.row(v-if="formats.video")
    a(:href="formats.video")
      video.video(autoplay loop muted playsinline)
        source(:src="formats.video")
    .card-details-buttons
      .button-wrap
        a(:href="formats.video")
          button
            img.icon.visit(src="@/assets/visit.svg")
      .button-wrap
        button(@click="removeUrl(formats.video)" :disabled="!canEditCard")
          img.icon(src="@/assets/remove.svg")
  //- Audio
  .row(v-if="formats.audio")
    Audio(:visible="Boolean(formats.audio)" :url="formats.audio" :normalizedName="this.card.name" :parentIsCardDetails="true")
    .card-details-buttons
      .button-wrap
        a(:href="formats.audio")
          button
            img.icon.visit(src="@/assets/visit.svg")
      .button-wrap
        button(@click="removeUrl(formats.audio)" :disabled="!canEditCard")
          img.icon(src="@/assets/remove.svg")
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
  },
  methods: {
    removeUrl (url) {
      this.$emit('removeUrl', url)
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
      border-radius 3px
      &:hover
        box-shadow var(--button-hover-shadow)
      &:active
        box-shadow var(--hover-shadow)

    .audio
      width 168px

    .card-details-buttons
      margin-left 6px
      display flex

  // similar to UrlPreview
  .image-preview,
  .video-preview
    .card-details-buttons
      padding 6px
      z-index 1
      position absolute
      right 0
      top 0
    .image
      width 100%
      position relative

</style>
