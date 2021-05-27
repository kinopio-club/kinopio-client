<template lang="pug">
.media-preview(v-if="visible")
  //- Image
  .row(v-if="formats.image")
    img.image(:src="formats.image")
    .card-details-buttons
      .button-wrap
        a(:href="formats.image")
          button.visit-button
            img.icon.visit(src="@/assets/visit.svg")
      .button-wrap
        button(@click="removeUrl(formats.image)" :disabled="!canEditCard")
          img.icon.cancel(src="@/assets/add.svg")
  //- Video
  .row(v-if="formats.video")
    video.video(autoplay loop muted playsinline)
      source(:src="formats.video")
    .card-details-buttons
      .button-wrap
        a(:href="formats.video")
          button.visit-button
            img.icon.visit(src="@/assets/visit.svg")
      .button-wrap
        button(@click="removeUrl(formats.video)" :disabled="!canEditCard")
          img.icon.cancel(src="@/assets/add.svg")
  //- Audio
  .row(v-if="formats.audio")
    Audio(:visible="Boolean(formats.audio)" :url="formats.audio" :normalizedName="this.card.name" :parentIsCardDetails="true")
    .card-details-buttons
      .button-wrap
        a(:href="formats.audio")
          button.visit-button
            img.icon.visit(src="@/assets/visit.svg")
      .button-wrap
        button(@click="removeUrl(formats.audio)" :disabled="!canEditCard")
          img.icon.cancel(src="@/assets/add.svg")
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
      const isSpaceMember = this.$store.getters['currentUser/isSpaceMember']()
      const cardIsCreatedByCurrentUser = this.$store.getters['currentUser/cardIsCreatedByCurrentUser'](this.card)
      if (isSpaceMember) { return true }
      if (this.canEditSpace && cardIsCreatedByCurrentUser) { return true }
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
  .row
    align-items flex-start
    .image,
    .video
      border-radius 3px
      max-height 80px
      max-width 168px
    .audio
      width 168px

    .card-details-buttons
      margin-left 6px
      display flex
      .visit
        vertical-align middle
</style>
