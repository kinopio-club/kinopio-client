<template lang="pug">
.row.space-details-info(@click.left="closeDialogsAndEmit")
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
  //- Name
  .textarea-wrap
    textarea.name(
      :disabled="!canEditSpace"
      ref="name"
      rows="1"
      placeholder="name"
      v-model="spaceName"
      @keydown.enter.stop.prevent
    )
  //- Pin Dialog
  .title-row(v-if="!shouldHidePin")
    .button-wrap.pin-button-wrap(@click.left="toggleDialogIsPinned"  :class="{active: dialogIsPinned}" title="Pin dialog")
      button
        img.icon.pin(src="@/assets/pin.svg")
.row.align-top
  //- Privacy
  PrivacyButton(:privacyPickerIsVisible="privacyPickerIsVisible" :showIconOnly="true" @togglePrivacyPickerIsVisible="togglePrivacyPickerIsVisible" @closeDialogs="closeDialogs" @updateSpaces="updateSpaces")
  //- Explore
  AddToExplore(v-if="!shouldHideExplore" @updateSpaces="updateSpaces")
  .badge.info.last-child(v-if="!canEditSpace") Read Only

</template>

<script>
import Background from '@/components/dialogs/Background.vue'
import BackgroundPreview from '@/components/BackgroundPreview.vue'
import Loader from '@/components/Loader.vue'
import PrivacyButton from '@/components/PrivacyButton.vue'
import AddToExplore from '@/components/AddToExplore.vue'

export default {
  name: 'SpaceDetailsInfo',
  emits: ['updateSpaces', 'closeDialogs'],
  components: {
    Background,
    BackgroundPreview,
    Loader,
    PrivacyButton,
    AddToExplore
  },
  props: {
    shouldHideExplore: Boolean,
    shouldHidePin: Boolean
  },
  mounted () {
    this.textareaSize()
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerSpaceDetailsCloseDialogs') {
        this.closeDialogs()
      } else if (mutation.type === 'triggerFocusSpaceDetailsName') {
        this.$nextTick(() => {
          this.$nextTick(() => {
            const element = this.$refs.name
            if (!element) { return }
            element.focus()
            element.setSelectionRange(0, element.value.length)
          })
        })
      } else if (mutation.type === 'currentSpace/restoreSpace') {
        // reset and update textareaSize
        if (!this.dialogIsPinned) { return }
        const element = this.$refs.name
        if (!element) { return }
        element.style.height = 0
        this.$nextTick(() => {
          this.textareaSize()
        })
      }
    })
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
        this.textareaSize()
        this.$store.dispatch('currentSpace/updateSpace', { name: newName })
        this.updateSpaces()
      }
    },
    currentSpace () { return this.$store.state.currentSpace },
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
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
    },
    dialogIsPinned () { return this.$store.state.spaceDetailsDialogIsPinned }
  },
  methods: {
    textareaSize () {
      const element = this.$refs.name
      const modifier = 1
      element.style.height = element.scrollHeight + modifier + 'px'
    },
    toggleDialogIsPinned () {
      const isPinned = !this.dialogIsPinned
      this.$store.dispatch('spaceDetailsDialogIsPinned', isPinned)
      if (!isPinned) {
        this.$store.dispatch('closeAllDialogs', 'SpaceDetails.toggleDialogIsPinned')
      }
    },
    toggleBackgroundIsVisible () {
      const isVisible = this.backgroundIsVisible
      this.closeDialogsAndEmit()
      this.backgroundIsVisible = !isVisible
    },
    togglePrivacyPickerIsVisible () {
      const isVisible = this.privacyPickerIsVisible
      this.closeDialogsAndEmit()
      this.privacyPickerIsVisible = !isVisible
    },
    closeDialogs () {
      this.backgroundIsVisible = false
      this.privacyPickerIsVisible = false
    },
    closeDialogsAndEmit () {
      this.closeDialogs()
      this.$emit('closeDialogs')
    },
    updateSpaces () {
      this.$emit('updateSpaces')
    }
  }
}
</script>

<style lang="stylus">
.space-details-info
  align-items flex-start !important
  textarea.name
    margin 0
  > .button-wrap + textarea
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
  .privacy-button
    min-width 24px
  .title-row
    margin-left 6px
    .pin-button-wrap
      button
        width 23px
</style>
