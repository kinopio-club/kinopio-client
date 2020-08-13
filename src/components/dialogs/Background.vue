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
    .row
      button(:disabled="!canEditSpace" @click.left="removeBackground")
        img.icon(src="@/assets/remove.svg")
        span Remove
      .button-wrap
        button(:disabled="!canEditSpace" @click.left.stop="toggleImagePickerIsVisible" :class="{active : imagePickerIsVisible}")
          span Image
        ImagePicker(:visible="imagePickerIsVisible" :isArenaOnly="true" :imageIsFullSize="true" @selectImage="addFile")
      button(:disabled="!canEditSpace")
        span Upload
</template>

<script>
import utils from '@/utils.js'
import ImagePicker from '@/components/dialogs/ImagePicker.vue'

export default {
  name: 'Background',
  components: {
    ImagePicker
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      imagePickerIsVisible: false,
      error: {
        isNotImageUrl: false
      }
    }
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
    background: {
      get () {
        return this.currentSpace.background
      },
      set (url) {
        this.updateSpaceBackground(url)
      }
    }
  },
  methods: {
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
    },
    removeBackground () {
      this.updateSpaceBackground('')
    },
    updateSpaceBackground (url) {
      this.$store.dispatch('currentSpace/updateSpace', { background: url })
      this.$store.dispatch('currentSpace/loadBackground')
    },
    checkIfImageIsUrl () {
      const url = this.background
      if (utils.urlIsImage(url)) {
        this.error.isNotImageUrl = false
      } else {
        this.error.isNotImageUrl = true
      }
    },
    textareaSize () {
      const textarea = this.$refs.background
      textarea.style.height = textarea.scrollHeight + 1 + 'px'
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.closeDialogs()
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
</style>
