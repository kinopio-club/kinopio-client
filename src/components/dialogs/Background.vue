<template lang="pug">
dialog.narrow.background(v-if="visible" :open="visible" @click.left="closeDialogs")
  section
    p Background
    button
      img.icon.cancel(src="@/assets/add.svg")
      span Clear

  section
    textarea(
      :disabled="!canEditSpace"
      ref="background"
      rows="1"
      placeholder="Paste an image URL or upload"
      v-model="background"
      data-type="name"
      maxlength="250"
      @mouseup.prevent.stop
      @touchend.prevent.stop
    )
    .button-wrap
      button(:disabled="!canEditSpace" @click.left.stop="toggleImagePickerIsVisible" :class="{active : imagePickerIsVisible}")
        //- img.icon(src="@/assets/search.svg")
        span Image
      ImagePicker(:visible="imagePickerIsVisible" :isArenaOnly="true" :imageIsFullSize="true" @selectImage="addFile")

    button Upload

</template>

<script>
// import cache from '@/cache.js'
// import utils from '@/utils.js'
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
      imagePickerIsVisible: false
    }
  },
  computed: {
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    currentSpace () { return this.$store.state.currentSpace },
    background: {
      get () {
        return this.currentSpace.background
      }
      // set (newName) {
      //   this.updateCardName(newName)
      //   if (this.wasPasted) {
      //     this.wasPasted = false
      //   } else {
      //     this.pastedName = ''
      //   }
      // }
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
      // this.initialSearch = this.normalizedName
    },
    addFile (file) {
      console.log('hi', file)
    }

  }
  // watch: {
  //   visible (visible) {
  //     if (visible) {
  //       this.queue = cache.queue()
  //     }
  //   }
  // }
}
</script>

<style lang="stylus">
.background
  textarea
    margin-bottom 6px
</style>
