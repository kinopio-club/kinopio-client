<template lang="pug">
template(v-if="isSpaceMember")
  .row.space-details-info(@click.left="closeDialogs")
    .button-wrap(@click.left.stop="toggleBackgroundIsVisible")
      BackgroundPreview(:space="currentSpace" :isButton="true" :buttonIsActive="backgroundIsVisible")
      //- Background Upload Progress
      .uploading-container-footer(v-if="pendingUpload")
        .badge.info(:class="{absolute : pendingUpload.imageDataUrl}")
          Loader(:visible="true")
          span {{pendingUpload.percentComplete}}%
      //- Background Remote Upload Progress
      .uploading-container-footer(v-if="remotePendingUpload")
        .badge.info
          Loader(:visible="true")
          span {{remotePendingUpload.percentComplete}}%
      Background(:visible="backgroundIsVisible" @updateSpaces="updateSpaces")
    input(ref="name" placeholder="name" v-model="spaceName")
  .row.privacy-row
    PrivacyButton(:privacyPickerIsVisible="privacyPickerIsVisible" :showIconOnly="true" @togglePrivacyPickerIsVisible="togglePrivacyPickerIsVisible" @closeDialogs="closeDialogs" @updateSpaces="updateSpaces")
    AddToExplore(@updateSpaces="updateSpaces")

template(v-if="!isSpaceMember")
  .row.space-details-info.not-space-member(@click.left="closeDialogs")
    .button-wrap(@click.left.stop="toggleBackgroundIsVisible")
      BackgroundPreview(:space="currentSpace" :isButton="true" :buttonIsActive="backgroundIsVisible")
      Background(:visible="backgroundIsVisible")
    p {{spaceName}}
  .row(v-if="shouldShowInExplore")
    .badge.status.explore-message
      img.icon.sunglasses(src="@/assets/sunglasses.svg")
      span In Explore
</template>

<script>
import Background from '@/components/dialogs/Background.vue'
import BackgroundPreview from '@/components/BackgroundPreview.vue'
import Loader from '@/components/Loader.vue'
import PrivacyButton from '@/components/PrivacyButton.vue'
import AddToExplore from '@/components/AddToExplore.vue'

export default {
  name: 'SpaceDetailsInfo',
  emits: ['updateSpaces'],
  components: {
    Background,
    BackgroundPreview,
    Loader,
    PrivacyButton,
    AddToExplore
  },
  props: {
    // shouldHideExplore: Boolean
  },
  data () {
    return {
      backgroundIsVisible: false,
      privacyPickerIsVisible: false
    }
  },
  computed: {
    spaceName: {
      get () {
        return this.$store.state.currentSpace.name
      },
      set (newName) {
        this.$store.dispatch('currentSpace/updateSpace', { name: newName })
        this.updateSpaces()
      }
    },
    currentSpace () { return this.$store.state.currentSpace },
    isSpaceMember () {
      const currentSpace = this.$store.state.currentSpace
      return this.$store.getters['currentUser/isSpaceMember'](currentSpace)
    },
    pendingUpload () {
      const currentSpace = this.$store.state.currentSpace
      const pendingUploads = this.$store.state.upload.pendingUploads
      return pendingUploads.find(upload => {
        const isCurrentSpace = upload.spaceId === currentSpace.id
        const isInProgress = upload.percentComplete < 100
        return isCurrentSpace && isInProgress
      })
    },
    remotePendingUpload () {
      const currentSpace = this.$store.state.currentSpace
      let remotePendingUploads = this.$store.state.remotePendingUploads
      return remotePendingUploads.find(upload => {
        const inProgress = upload.percentComplete < 100
        const isSpace = upload.spaceId === currentSpace.id
        return inProgress && isSpace
      })
    }
  },
  methods: {
    toggleBackgroundIsVisible () {
      const isVisible = this.backgroundIsVisible
      this.closeDialogs()
      this.backgroundIsVisible = !isVisible
    },
    togglePrivacyPickerIsVisible () {
      const isVisible = this.privacyPickerIsVisible
      this.closeDialogs()
      this.privacyPickerIsVisible = !isVisible
    },
    closeDialogs () {
      this.backgroundIsVisible = false
      this.privacyPickerIsVisible = false
    },
    updateSpaces () {
      this.$emit('updateSpaces')
    }
  }
}
</script>

<style lang="stylus">
.space-details-info
  > .button-wrap + input
    margin 0
  > .button-wrap
    padding-right 6px
    > button
      width 24px
      height 24px
      background-size cover
      background-position center
  > .button-wrap + p
    margin-top 0
  &.not-space-member
    margin 0
    margin-bottom 10px
  .uploading-container-footer
    position absolute
    top 15px
    left 8px
    width 100px
    pointer-events none
    z-index 1
    .badge
      display inline-block
      &.absolute
        position absolute
        top 6px
        left 6px
</style>
