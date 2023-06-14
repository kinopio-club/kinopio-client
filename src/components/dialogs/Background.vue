<template lang="pug">
dialog.background(v-if="visible" :open="visible" @click.left.stop="closeDialogs")
  section
    .row.title-row
      div
        BackgroundPreview(:space="currentSpace")
        span.title Background
      .row
        button.small-button(:class="{active: currentBackgroundIsDefault}" @click.left.stop="updateDefaultBackground")
          BackgroundPreview(:space="defaultBackground")
          span Default
        button.small-button(v-if="canEditSpace" @click.left="removeBackgroundAll")
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
        maxlength="400"
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
    template(v-if="canEditSpace")
      .row
        .segmented-buttons
          button(@click.left.stop="updateService('background')" :class="{ active: service === 'background'}")
            img.icon.flower(src="@/assets/flower.svg")
          button(@click.left.stop="updateService('pexels')" :class="{ active: serviceIsPexels}")
            img.icon(src="@/assets/search.svg")
          button(@click.left.stop="updateService('recent')" :class="{ active: serviceIsRecent}")
            img.icon.time(src="@/assets/time.svg")
        //- Upload
        .button-wrap
          button(@click.left.stop="selectFile")
            span Upload
          input.hidden(type="file" ref="input" @change="uploadFile" accept="image/*")
      //- Tint
      .row
        .button-wrap
          button.change-color(@click.left.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
            span.current-color.background-tint-color(:style="{ background: backgroundTintBadgeColor }")
            span Background Tint
          ColorPicker(:currentColor="backgroundTint || '#fff'" :visible="colorPickerIsVisible" @selectedColor="updateBackgroundTint" :removeIsVisible="true" @removeColor="removeBackgroundTint" :shouldLightenColors="true")

  //- results
  template(v-if="canEditSpace")
    //- backgrounds
    template(v-if="serviceIsBackground")
      section.results-section
        //- built in backgrounds
        ImageList(:images="selectedImages" :activeUrl="background" @selectImage="updateSpaceBackground")
        //- community backgrounds
      section.results-section.community-backgrounds-section
        .row.row-title
          a.arena-link(target="_blank" href="https://www.are.na/kinopio/community-backgrounds")
            img.icon.arena(src="@/assets/arena.svg")
          span Community Backgrounds
        Loader(:visible="communityBackgroundsIsLoading")
        ImageList(v-if="!communityBackgroundsIsLoading" :images="communityBackgroundImages" :activeUrl="background" @selectImage="updateSpaceBackground")

    //- recent
    template(v-else-if="serviceIsRecent")
      section.results-section
        .row
          p.row-title Recently Used
        ImageList(:images="selectedImages" :activeUrl="background" @selectImage="updateSpaceBackground")

    //- search results
    template(v-else-if="serviceIsPexels")
      section.results-section.search-input-wrap
        .search-wrap
          img.icon.search(v-if="!searchIsLoading" src="@/assets/search.svg" @click.left="focusSearchInput")
          Loader(:visible="searchIsLoading")
          input(
            placeholder="Search Images on Pexels"
            v-model="searchInput"
            ref="searchInput"
            @focus="resetPinchCounterZoomDecimal"
            @keyup.stop.backspace
            @keyup.stop.enter
            @mouseup.stop
            @touchend.stop
          )
          button.borderless.clear-input-wrap(@click.left="clearSearch")
            img.icon.cancel(src="@/assets/add.svg")
        .error-container(v-if="error.isNoSearchResults")
          .badge.danger Nothing found on Pexels for {{search}}
        .error-container(v-if="error.unknownServerError")
          .badge.danger (シ_ _)シ Something went wrong, Please try again or contact support
        ul.results-list.image-list
          template(v-for="image in images" :key="image.id")
            li(@click.left="updateSpaceBackground(image.url)" tabindex="0" v-on:keydown.enter="updateSpaceBackground(image.url)" :class="{ active: isSpaceUrl(image)}")
              img(:src="image.previewUrl")
              a(v-if="image.sourcePageUrl" :href="image.sourcePageUrl" target="_blank" @click.left.stop)
                button.small-button
                  span(v-if="image.sourceName") {{image.sourceName}}{{' '}}
                  span →

</template>

<script>
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
import BackgroundPreview from '@/components/BackgroundPreview.vue'
import ImageList from '@/components/ImageList.vue'
import backgroundImages from '@/data/backgroundImages.json'
import cache from '@/cache.js'
import consts from '@/consts.js'
import sample from 'lodash-es/sample'

import uniq from 'lodash-es/uniq'
import debounce from 'lodash-es/debounce'

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
        unknownUploadError: false,
        isNoSearchResults: false,
        unknownServerError: false
      },
      backgroundTint: '',
      defaultColor: '#e3e3e3',
      search: '',
      searchIsLoading: false,
      selectedImages: [],
      communityBackgroundsIsLoading: false,
      communityBackgroundImages: [],
      images: [],
      service: 'background' // background, recent, pexels
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
    searchInput: {
      get () {
        return this.search
      },
      set (newValue) {
        this.search = newValue
        if (newValue) {
          this.searchService()
        }
      }
    },
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
    },
    serviceIsPexels () { return this.service === 'pexels' },
    serviceIsRecent () { return this.service === 'recent' },
    serviceIsBackground () { return this.service === 'background' },
    backgroundImages () {
      let images = backgroundImages
      images = images.filter(image => !image.isArchived)
      return images
    },
    defaultBackground () {
      const currentUser = this.$store.state.currentUser
      return {
        background: currentUser.defaultSpaceBackground,
        backgroundTint: currentUser.defaultSpaceBackgroundTint
      }
    },
    currentBackgroundIsDefault () {
      const currentUser = this.$store.state.currentUser
      const currentSpace = this.$store.state.currentSpace
      const backgroundIsDefault = currentUser.defaultSpaceBackground === currentSpace.background
      const backgroundTintIsDefault = currentUser.defaultSpaceBackgroundTint === currentSpace.backgroundTint
      return backgroundIsDefault && backgroundTintIsDefault
    }
  },
  methods: {
    updateDefaultBackground () {
      const currentSpace = this.$store.state.currentSpace
      const background = currentSpace.background
      const backgroundTint = currentSpace.backgroundTint
      this.$store.dispatch('currentUser/update', { defaultSpaceBackground: background, defaultSpaceBackgroundTint: backgroundTint })
    },
    isSpaceUrl (image) {
      return image.url === this.background
    },
    focusAndSelectSearchInput () {
      this.$nextTick(() => {
        if (utils.isMobile()) { return }
        const element = this.$refs.searchInput
        if (!element) { return }
        element.focus()
        const length = element.value.length
        if (!length) { return }
        element.setSelectionRange(0, length)
      })
    },
    updateService (service) {
      this.service = service
      if (service === 'background') {
        this.selectedImages = this.backgroundImages
      } else if (service === 'recent') {
        const images = this.recentImagesFromCacheSpaces()
        this.selectedImages = images
      } else if (service === 'pexels') {
        this.searchPexels()
        this.focusAndSelectSearchInput()
      }
    },
    searchService: debounce(async function () {
      this.searchPexels()
    }, 350),
    async searchPexels () {
      this.searchIsLoading = true
      this.error.isNoSearchResults = false
      this.error.unknownServerError = false
      try {
        let url = new URL('https://api.pexels.com/v1/search')
        const headers = new Headers({
          'Authorization': consts.pexelsApiKey
        })
        const defaultSearches = [ 'animals', 'flowers', 'forest', 'ocean' ]
        const defaultSearch = sample(defaultSearches)
        let params = { query: this.search || defaultSearch }
        url.search = new URLSearchParams(params).toString()
        const response = await fetch(url, { method: 'GET', headers })
        const data = await response.json()
        this.images = data.photos.map(image => {
          return {
            id: image.id,
            previewUrl: image.src.tiny,
            url: image.src.large2x
          }
        })
        if (!this.images.length) {
          this.error.isNoSearchResults = true
        }
      } catch (error) {
        console.error('🚒 searchService', error)
        this.error.unknownServerError = true
      }
      this.searchIsLoading = false
    },
    recentImagesFromCacheSpaces () {
      let spaces = cache.getAllSpaces()
      let images = []
      spaces.forEach(space => {
        if (!space.background) { return }
        images.push(space.background)
      })
      images = uniq(images)
      images = images.map(image => {
        const backgroundImage = this.backgroundImages.find(item => item.url === image)
        if (backgroundImage) {
          return backgroundImage
        }
        return { url: image }
      })
      images = images.filter(image => Boolean(image))
      const max = 30
      images = images.slice(0, max)
      return images
    },
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
      this.$store.dispatch('closeAllDialogs')
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
    },
    clearSearch () {
      this.search = ''
      this.searchIsLoading = false
      this.images = []
    },
    resetPinchCounterZoomDecimal () {
      this.$store.commit('pinchCounterZoomDecimal', 1)
    },
    async updateCommunityBackgroundImages () {
      this.communityBackgroundsIsLoading = true
      if (this.communityBackgroundImages.length) {
        this.communityBackgroundsIsLoading = false
        return
      }
      let images = await this.$store.dispatch('api/communityBackgrounds')
      images = images.map(image => {
        return {
          url: image.original,
          thumbnailUrl: image.thumb,
          previewUrl: image.preview
        }
      })
      this.communityBackgroundImages = images
      this.communityBackgroundsIsLoading = false
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        if (this.service === 'background') {
          this.selectedImages = this.backgroundImages
        }
        this.backgroundTint = this.currentSpace.backgroundTint
        this.closeDialogs()
        this.clearErrors()
        this.updateCommunityBackgroundImages()
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
dialog.background
  width 255px
  overflow auto
  max-height 86vh
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
      border-radius var(--small-entity-radius)
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

  .search-wrap
    .loader
      width 13px
      height 14px
      margin-right 3px
      flex-shrink 0
      margin-top 2px
  .results-section
    max-height initial
    .error-container
      margin 0
      margin-left 4px
      margin-bottom 4px
  .background-tint-color
    display inline-block
    margin-right 6px
    vertical-align -1px
  .row-title
    margin-left 4px
  .community-backgrounds-section
    margin-top 10px
  .arena-link
    padding-right 5px
  .small-button
    .background-preview
      width 13px
      margin-right 3px
      .preview-wrap
        width 13px
        height 13px
        vertical-align -1px
</style>
