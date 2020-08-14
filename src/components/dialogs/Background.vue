<template lang="pug">
dialog.narrow.background(v-if="visible" :open="visible" @click.left="closeDialogs")
  section
    p Background

  section(
    @mouseup.prevent.stop
    @touchend.prevent.stop
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
    //- upload progress
    .uploading-container(v-if="pendingUpload")
      img(v-if="pendingUpload" :src="pendingUpload.imageDataUrl")
      .badge.info(:class="{absolute : pendingUpload.imageDataUrl}")
        Loader(:visible="true")
        span {{pendingUpload.percentComplete}}%

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
        span Background images should be smaller than 250kb
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
        ImagePicker(:visible="imagePickerIsVisible" :isArenaOnly="true" :imageIsFullSize="true" @selectImage="addFile")
      .button-wrap
        button(:disabled="!canEditSpace" @click.left.stop="selectFile") Upload
        input.hidden(type="file" ref="input" @change="uploadFile")

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
        const upload = state.upload.pendingUploads.find(item => item.spaceId === this.currentSpace.id)
        if (upload.percentComplete !== 100) { return }
        const file = { url }
        this.addFile(file)
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
      const upload = pendingUploads.find(upload => {
        const isCurrentSpace = upload.spaceId === this.currentSpace.id
        const isInProgress = upload.percentComplete < 100
        return isCurrentSpace && isInProgress
      })
      return upload
    }

  },
  methods: {
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    closeDialogs () {
      this.imagePickerIsVisible = false
    },
    toggleImagePickerIsVisible () {
      const isVisible = this.imagePickerIsVisible
      this.closeDialogs()
      this.imagePickerIsVisible = !isVisible
    },
    addFile (file) {
      this.updateSpaceBackground(file.url)
      this.textareaSize()
    },
    removeBackground () {
      this.updateSpaceBackground('')
    },
    updateSpaceBackground (url) {
      this.$store.dispatch('currentSpace/updateSpace', { background: url })
      this.$store.dispatch('currentSpace/loadBackground')
    },
    clearErrors () {
      this.error.isNotImageUrl = false
      // TODO test errors
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
      this.clearErrors()
      if (!this.currentUserIsSignedIn) {
        this.error.signUpToUpload = true
        return
      }
      const input = this.$refs.input
      input.click()
    },
    async uploadFile () {
      const spaceId = this.currentSpace.id
      const input = this.$refs.input
      const file = input.files[0]
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
      }
    }
  }
}
</script>

<style lang="stylus">
.background
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
