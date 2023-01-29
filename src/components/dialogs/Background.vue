<template lang="pug">
dialog.background(v-if="visible" :open="visible" @click.left.stop="closeDialogs")
  section
    .row.title-row
      div
        BackgroundPreview(:space="currentSpace")
        span.title Background
      .row
        button.small-button(:disabled="!canEditSpace" @click.left="removeBackgroundAll")
          img.icon(src="@/assets/remove.svg")

  section(@mouseup.stop @touchend.stop)
    .row
      input(
        v-if="canEditSpace"
        ref="background"
        rows="1"
        placeholder="Paste an image URL or upload"
        v-model="background"
        data-type="name"
        maxlength="250"
      )
      .input-button-wrap(@click.left="copyUrl")
        button.small-button
          img.icon.copy(src="@/assets/copy.svg")

    p.read-only-url(v-if="!canEditSpace && background")
      span {{background}}
    .row(v-if="!canEditSpace")
      span.badge.info
        img.icon.cancel(src="@/assets/add.svg")
        span Space is Read Only

    //- upload progress
    .uploading-container(v-if="pendingUpload")
      img(v-if="pendingUpload" :src="pendingUpload.imageDataUrl")
      .badge.info(:class="{absolute : pendingUpload.imageDataUrl}")
        Loader(:visible="true")
        span {{pendingUpload.percentComplete}}%
    //- remote upload progress
    .uploading-container(v-if="remotePendingUpload")
      .badge.info
        Loader(:visible="true")
        span {{remotePendingUpload.percentComplete}}%

    //- errors
    .error-container(v-if="error.isNotImageUrl")
      p
        span.badge.danger
          img.icon.cancel(src="@/assets/add.svg")
          span Is not an image URL
    .error-container(v-if="error.signUpToUpload")
      p
        span To upload files,
        span.badge.info you need to Sign Up or In
      button(@click.left.stop="triggerSignUpOrInIsVisible") Sign Up or In
    .error-container(v-if="error.sizeLimit")
      p
        span.badge.danger
          img.icon.cancel(src="@/assets/add.svg")
          span Too Big
      p
        span Background images should be smaller than 1mb
    .error-container(v-if="error.unknownUploadError")
      .badge.danger (シ_ _)シ Something went wrong, Please try again or contact support

    //- buttons
    .row
      .button-wrap
        button.change-color(:disabled="!canEditSpace" @click.left.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
          .current-color(:style="{ background: backgroundTintBadgeColor }")
        ColorPicker(:currentColor="backgroundTint || '#fff'" :visible="colorPickerIsVisible" @selectedColor="updateBackgroundTint" :removeIsVisible="true" @removeColor="removeBackgroundTint" :shouldLightenColors="true")
      //- .button-wrap
      //-   button(:disabled="!canEditSpace" @click.left.stop="toggleImagePickerIsVisible" :class="{active : imagePickerIsVisible}")
      //-     img.icon.flower(src="@/assets/flower.svg")
      //-   ImagePicker(:visible="imagePickerIsVisible" :isBackgroundImage="true" @selectImage="updateSpaceBackground" :initialSearch="initialSearch" :removeIsVisible="true" @removeImage="removeBackground")
      .segmented-buttons
        button.active(:disabled="!canEditSpace")
          img.icon.flower(src="@/assets/flower.svg")
        button
          span Recent
      .button-wrap
        button(:disabled="!canEditSpace" @click.left.stop="selectFile")
          span Upload
        input.hidden(type="file" ref="input" @change="uploadFile" accept="image/*")
  section.results-section
    ImageList(:images="selectedImages" :activeUrl="background" @selectImage="updateSpaceBackground")

</template>

<script>
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
import BackgroundPreview from '@/components/BackgroundPreview.vue'
import ImageList from '@/components/ImageList.vue'
import backgroundImages from '@/data/backgroundImages.json'

export default {
  name: 'Background',
  components: {
    ColorPicker,
    Loader,
    BackgroundPreview,
    ImageList
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      colorPickerIsVisible: false,
      initialSearch: '',
      error: {
        isNotImageUrl: false,
        signUpToUpload: false,
        userIsOffline: false,
        sizeLimit: false,
        unknownUploadError: false
      },
      backgroundTint: '',
      defaultColor: '#e3e3e3',
      selectedImages: backgroundImages
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerUploadComplete') {
        let { spaceId, url, cardId } = mutation.payload
        if (cardId) { return }
        if (spaceId !== this.currentSpace.id) { return }
        this.updateSpaceBackground(url)
      } else if (mutation.type === 'triggerUpdateTheme') {
        this.defaultColor = utils.cssVariable('secondary-background')
      }
    })
  },
  mounted () {
    this.defaultColor = utils.cssVariable('secondary-background')
  },
  updated () {
    this.$nextTick(() => {
      if (this.visible) {
        this.checkIfImageIsUrl()
      }
    })
  },
  computed: {
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    currentSpace () { return this.$store.state.currentSpace },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    currentUser () { return this.$store.state.currentUser },
    background: {
      get () {
        return this.currentSpace.background
      },
      set (url) {
        this.updateSpaceBackground(url)
      }
    },
    pendingUpload () {
      const pendingUploads = this.$store.state.upload.pendingUploads
      return pendingUploads.find(upload => {
        const isCurrentSpace = upload.spaceId === this.currentSpace.id
        const isInProgress = upload.percentComplete < 100
        return isCurrentSpace && isInProgress
      })
    },
    remotePendingUpload () {
      const currentSpace = this.$store.state.currentSpace
      let remotePendingUploads = this.$store.state.remotePendingUploads
      return remotePendingUploads.find(upload => {
        const isInProgress = upload.percentComplete < 100
        const isSpace = upload.spaceId === currentSpace.id
        return isInProgress && isSpace
      })
    },
    backgroundTintBadgeColor () {
      if (!this.backgroundTint || this.backgroundTint === '#fff' || this.backgroundTint === '#000') {
        return this.defaultColor
      }
      return this.backgroundTint
    }
  },
  methods: {
    async copyUrl (event) {
      this.$store.commit('clearNotificationsWithPosition')
      const position = utils.cursorPositionInPage(event)
      try {
        await navigator.clipboard.writeText(this.background)
        this.$store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
      } catch (error) {
        console.warn('🚑 copyText', error)
        this.$store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
      }
    },
    toggleColorPicker () {
      const isVisible = this.colorPickerIsVisible
      this.closeDialogs()
      this.colorPickerIsVisible = !isVisible
    },
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs', 'Background.triggerSignUpOrInIsVisible')
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    closeDialogs () {
      this.colorPickerIsVisible = false
    },
    removeBackgroundAll () {
      this.removeBackground()
      this.removeBackgroundTint()
    },
    removeBackground () {
      this.updateSpaceBackground('')
      this.closeDialogs()
    },
    updateSpaceBackground (url) {
      url = url.url || url
      this.$store.dispatch('currentSpace/updateSpace', { background: url })
      this.$store.commit('triggerLoadBackground')
      this.updatePageSizes()
    },
    removeBackgroundTint () {
      this.updateBackgroundTint('')
      this.closeDialogs()
      this.$emit('updateSpaces')
    },
    updateBackgroundTint (value) {
      this.backgroundTint = value
      this.$store.dispatch('currentSpace/updateSpace', { backgroundTint: value })
      this.updatePageSizes()
      this.$emit('updateSpaces')
    },
    updatePageSizes () {
      this.$nextTick(() => {
        this.$store.dispatch('updatePageSizes')
      })
    },
    clearErrors () {
      this.error.isNotImageUrl = false
      this.error.signUpToUpload = false
      this.error.userIsOffline = false
      this.error.sizeLimit = false
      this.error.unknownUploadError = false
    },
    checkIfImageIsUrl () {
      const url = this.background
      if (!url) {
        this.error.isNotImageUrl = false
      } else if (utils.urlIsImage(url)) {
        this.error.isNotImageUrl = false
      } else {
        this.error.isNotImageUrl = true
      }
    },
    selectFile (event) {
      if (!this.currentUserIsSignedIn) {
        this.error.signUpToUpload = true
        return
      }
      const input = this.$refs.input
      input.click()
    },
    isFileTooBig (file) {
      const sizeLimit = 1024 * 1024 * 1.250 // ~1mb
      if (file.size > sizeLimit) {
        return true
      }
    },
    async uploadFile () {
      this.clearErrors()
      const spaceId = this.currentSpace.id
      const input = this.$refs.input
      const file = input.files[0]
      if (this.isFileTooBig(file)) {
        this.error.sizeLimit = true
        return
      }
      try {
        await this.$store.dispatch('upload/uploadFile', { file, spaceId })
      } catch (error) {
        console.warn('🚒', error)
        if (error.type === 'sizeLimit') {
          this.error.sizeLimit = true
        } else {
          this.error.unknownUploadError = true
        }
      }
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.backgroundTint = this.currentSpace.backgroundTint
        this.closeDialogs()
        this.clearErrors()
      } else {
        if (this.error.isNotImageUrl) {
          this.removeBackground()
        }
        this.$store.commit('clearNotificationsWithPosition')
      }
    }
  }
}
</script>

<style lang="stylus">
.background
  &.narrow
    width 215px
  .title-row
    margin-left 0 !important
  .background-preview
    margin-right 6px
  .title
    color var(--primary)
  section
    position relative
  textarea
    margin-bottom 6px
  .error-container
    margin-bottom 10px
  .uploading-container
    position relative
    img
      border-radius 3px
    .badge
      display inline-block
      &.absolute
        position absolute
        top 6px
        left 6px
  .hidden
    display none
  .read-only-url
    margin-top 0
    margin-bottom 10px
    word-break break-all

  .arrow-up
    position absolute
    width 0
    height 0
    border-left 5px solid transparent
    border-right 5px solid transparent
    border-bottom 6px solid var(--secondary-background)
    top -6px
    left 42px

  @media(max-height 700px)
    .image-picker
      top -50px

  @media(max-width 500px)
    .image-picker
      left -68px

  .input-button-wrap
    margin-top -10px
    margin-right -8px
</style>
