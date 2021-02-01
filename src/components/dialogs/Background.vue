<template lang="pug">
dialog.narrow.background(v-if="visible" :open="visible" @click.left="closeDialogs")
  section
    p Background

  section(
    @mouseup.stop
    @touchend.stop
  )
    textarea(
      :disabled="!canEditSpace"
      ref="background"
      rows="1"
      placeholder="Paste an image URL or upload"
      v-model="background"
      data-type="name"
      maxlength="250"
    )
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
        span Background images should be smaller than 350kb
    .error-container(v-if="error.unknownUploadError")
      .badge.danger (シ_ _)シ Something went wrong, Please try again or contact support

    //- buttons
    .row
      .button-wrap
        button(:disabled="!canEditSpace" @click.left="removeBackground")
          img.icon(src="@/assets/remove.svg")
          span Remove
      .button-wrap
        button(:disabled="!canEditSpace" @click.left.stop="toggleImagePickerIsVisible" :class="{active : imagePickerIsVisible}")
          span Image
        ImagePicker(:visible="imagePickerIsVisible" :isBackgroundImage="true" :imageIsFullSize="true" @selectImage="updateSpaceBackground" :initialSearch="initialSearch")
      .button-wrap
        button(:disabled="!canEditSpace" @click.left.stop="selectFile") Upload
        input.hidden(type="file" ref="input" @change="uploadFile" accept="image/*")

</template>

<script>
import ImagePicker from '@/components/dialogs/ImagePicker.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

export default {
  name: 'Background',
  components: {
    ImagePicker,
    Loader
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      imagePickerIsVisible: false,
      initialSearch: '',
      error: {
        isNotImageUrl: false,
        signUpToUpload: false,
        userIsOffline: false,
        sizeLimit: false,
        unknownUploadError: false
      }
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerUploadComplete') {
        let { spaceId, url } = mutation.payload
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
    }
  },
  methods: {
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs', 'Background.triggerSignUpOrInIsVisible')
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    closeDialogs () {
      this.imagePickerIsVisible = false
    },
    toggleImagePickerIsVisible () {
      const isVisible = this.imagePickerIsVisible
      this.closeDialogs()
      this.imagePickerIsVisible = !isVisible
      this.initialSearch = this.currentSpace.name
      console.log(this.currentSpace.name)
    },
    removeBackground () {
      this.updateSpaceBackground('')
    },
    updateSpaceBackground (url) {
      url = url.url || url
      this.$store.dispatch('currentSpace/updateSpace', { background: url })
      this.$store.dispatch('currentSpace/loadBackground', url)
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
      const sizeLimit = 1024 * 1024 * 0.350 // 350kb
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
        this.closeDialogs()
        this.clearErrors()
      } else {
        if (this.error.isNotImageUrl) {
          this.removeBackground()
        }
      }
    },
    // update background on broadcast
    background (value) {
      this.$store.dispatch('currentSpace/loadBackground', value)
    }
  }
}
</script>

<style lang="stylus">
.background
  @media(max-width 435px)
    left -100px
  &.narrow
    width 215px
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

</style>
