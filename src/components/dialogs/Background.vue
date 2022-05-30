<template lang="pug">
dialog.narrow.background(v-if="visible" :open="visible" @click.left.stop="closeDialogs")
  section
    BackgroundPreview(:space="currentSpace")
    span Background

  section(@mouseup.stop @touchend.stop)
    textarea(
      v-if="canEditSpace"
      ref="background"
      rows="1"
      placeholder="Paste an image URL or upload"
      v-model="background"
      data-type="name"
      maxlength="250"
    )
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
        button(:disabled="!canEditSpace" @click.left="removeBackgroundAll")
          img.icon(src="@/assets/remove.svg")
      .button-wrap
        button.change-color(:disabled="!canEditSpace" @click.left.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
          .current-color(:style="{ background: backgroundTintBadgeColor }")
        ColorPicker(:currentColor="backgroundTint || '#fff'" :visible="colorPickerIsVisible" @selectedColor="updateBackgroundTint" :removeIsVisible="true" @removeColor="removeBackgroundTint" :shouldLightenColors="true")
      .button-wrap
        button(:disabled="!canEditSpace" @click.left.stop="toggleImagePickerIsVisible" :class="{active : imagePickerIsVisible}")
          img.icon.flower(src="@/assets/flower.svg")
        ImagePicker(:visible="imagePickerIsVisible" :isBackgroundImage="true" @selectImage="updateSpaceBackground" :initialSearch="initialSearch" :removeIsVisible="true" @removeImage="removeBackground")
      .button-wrap
        button(:disabled="!canEditSpace" @click.left.stop="selectFile") Upload
        input.hidden(type="file" ref="input" @change="uploadFile" accept="image/*")

    // default
    template(v-if="spaceHasBackground || userHasDefaults")
      .row
        label(:class="{active: currentIsUserDefaults}" @click.left.prevent="updateUserDefaults" @keydown.stop.enter="updateUserDefaults")
          input(type="checkbox" v-model="currentIsUserDefaults")
          span Set as Default
      .row(v-if="userHasDefaults")
        BackgroundPreview(:space="spaceDefaults")
        span Default background for new spaces

</template>

<script>
import ImagePicker from '@/components/dialogs/ImagePicker.vue'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
import BackgroundPreview from '@/components/BackgroundPreview.vue'

export default {
  name: 'Background',
  components: {
    ImagePicker,
    ColorPicker,
    Loader,
    BackgroundPreview
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      imagePickerIsVisible: false,
      colorPickerIsVisible: false,
      initialSearch: '',
      error: {
        isNotImageUrl: false,
        signUpToUpload: false,
        userIsOffline: false,
        sizeLimit: false,
        unknownUploadError: false
      },
      success: {
        userDefaultsIsUpdated: false
      },
      backgroundTint: ''
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerUploadComplete') {
        let { spaceId, url, cardId } = mutation.payload
        if (cardId) { return }
        if (spaceId !== this.currentSpace.id) { return }
        this.updateSpaceBackground(url)
      }
    })
  },

  updated () {
    this.$nextTick(() => {
      if (this.visible) {
        this.textareaSize()
        this.checkIfImageIsUrl()
      }
    })
  },
  computed: {
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    currentSpace () { return this.$store.state.currentSpace },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    currentUser () { return this.$store.state.currentUser },
    defaultSpaceBackground () { return this.currentUser.defaultSpaceBackground },
    defaultSpaceBackgroundTint () { return this.currentUser.defaultSpaceBackgroundTint },
    spaceDefaults () {
      return {
        background: this.defaultSpaceBackground,
        backgroundTint: this.defaultSpaceBackgroundTint
      }
    },
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
      if (!this.backgroundTint || this.backgroundTint === '#fff') {
        return '#e3e3e3' // --secondary-background
      }
      return this.backgroundTint
    },
    spaceHasBackground () {
      const background = this.currentSpace.background
      const backgroundTint = this.currentSpace.backgroundTint
      return background || backgroundTint
    },
    userHasDefaults () {
      return Boolean(this.defaultSpaceBackground || this.defaultSpaceBackgroundTint)
    },
    currentIsUserDefaults () {
      const backgroundIsDefault = this.defaultSpaceBackground === this.currentSpace.background
      const backgroundTintIsDefault = this.currentUser.defaultSpaceBackgroundTint === this.currentSpace.backgroundTint
      return backgroundIsDefault && backgroundTintIsDefault
    }
  },
  methods: {
    updateUserDefaults () {
      const background = this.currentSpace.background
      const backgroundTint = this.currentSpace.backgroundTint
      const isUnchanged = background === this.defaultSpaceBackground && backgroundTint === this.defaultSpaceBackgroundTint
      if (isUnchanged) {
        this.removeUserDefaults()
        return
      }
      this.$store.dispatch('currentUser/update', { defaultSpaceBackground: background, defaultSpaceBackgroundTint: backgroundTint })
      this.success.userDefaultsIsUpdated = true
    },
    removeUserDefaults () {
      this.$store.dispatch('currentUser/update', { defaultSpaceBackground: null, defaultSpaceBackgroundTint: null })
      this.clearSuccesses()
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
      this.imagePickerIsVisible = false
      this.colorPickerIsVisible = false
    },
    toggleImagePickerIsVisible () {
      const isVisible = this.imagePickerIsVisible
      this.closeDialogs()
      this.imagePickerIsVisible = !isVisible
      this.initialSearch = this.currentSpace.name
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
      this.$store.dispatch('currentSpace/loadBackground')
      this.updatePageSizes()
      this.clearSuccesses()
    },
    removeBackgroundTint () {
      this.updateBackgroundTint('')
      this.closeDialogs()
      this.$emit('updateSpaces')
      this.clearSuccesses()
    },
    updateBackgroundTint (value) {
      this.backgroundTint = value
      this.$store.dispatch('currentSpace/updateSpace', { backgroundTint: value })
      this.updatePageSizes()
      this.$emit('updateSpaces')
      this.clearSuccesses()
    },
    updatePageSizes () {
      this.$nextTick(() => {
        this.$store.dispatch('updatePageSizes')
      })
    },
    clearSuccesses () {
      this.success.userDefaultsIsUpdated = false
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
    textareaSize () {
      if (!this.canEditSpace) { return }
      const textarea = this.$refs.background
      textarea.style.height = textarea.scrollHeight + 1 + 'px'
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
      this.clearSuccesses()
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
        this.clearSuccesses()
      } else {
        if (this.error.isNotImageUrl) {
          this.removeBackground()
        }
      }
    }
  }
}
</script>

<style lang="stylus">
.background
  &.narrow
    width 215px
  .background-preview
    margin-right 6px
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
</style>
