<template lang="pug">
dialog.image-picker(
  v-if="visible"
  :open="visible"
  @click.left.stop
  ref="dialog"
  :style="{'max-height': dialogHeight + 'px', 'min-height': minDialogHeight + 'px'}"
)

  //- card options
  section(ref="cardImageServiceSection")
    .row.title-row-flex
      .segmented-buttons
        button(@click.left.stop="toggleServiceIsStickers" :class="{active : serviceIsStickers}" title="stickers")
          img.icon.sticker(src="@/assets/sticker.svg")
        button(@click.left.stop="toggleServiceIsAI" :class="{active : serviceIsAI}" title="AI")
          span AI
        button(@click.left.stop="toggleServiceIsBing" :class="{active : serviceIsBing}" title="bing")
          img.icon(src="@/assets/search.svg")
        button(@click.left.stop="toggleServiceIsGifs" :class="{active : serviceIsGifs}" title="gifs")
          span GIF
      .button-wrap
        button(@click.left.stop="selectFile") Upload
        input.hidden(type="file" ref="input" @change="uploadFile")

    //- upload progress
    .uploading-container(v-if="cardPendingUpload")
      img(v-if="cardPendingUpload" :src="cardPendingUpload.imageDataUrl")
      .badge.info(:class="{absolute : cardPendingUpload.imageDataUrl}")
        Loader(:visible="true")
        span {{cardPendingUpload.percentComplete}}%
    //- errors
    .error-container-top(v-if="error.signUpToUpload")
      p
        span To upload files,
        span.badge.info
          span you need to Sign Up or In
      button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
    .error-container-top(v-if="error.sizeLimit")
      p
        span.badge.danger
          img.icon.cancel(src="@/assets/add.svg")
          span Too Big
      p
        span To upload files over 5mb,
        span.badge.info upgrade for unlimited
      button(@click.left="triggerUpgradeUserIsVisible") Upgrade for Unlimited
    .error-container-top(v-if="error.unknownUploadError")
      .badge.danger
        span (シ_ _)シ Something went wrong, Please try again or contact support

  AIImageGeneration(@selectImage="selectImage" :visible="serviceIsAI" :initialPrompt="search" :cardUrl="cardUrl")
  template(v-if="!serviceIsAI")
    //- search box
    section.results-section.search-input-wrap(ref="searchSection")
      .search-wrap
        img.icon.search(v-if="!loading" src="@/assets/search.svg" @click.left="focusSearchInput")
        Loader(:visible="loading")
        input(
          :placeholder="placeholder"
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
      .error-container(v-if="isNoSearchResults || error.unknownServerError || error.userIsOffline")
        p(v-if="isNoSearchResults") Nothing found on {{service}} for {{search}}
        .badge.danger(v-if="error.unknownServerError")
          span (シ_ _)シ Something went wrong, Please try again or contact support
        .badge.danger(v-if="error.userIsOffline")
          span Can't search {{service}} while offline, Please try again later

    //- search results
    section.results-section(ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
      ul.results-list.image-list
        template(v-for="image in images" :key="image.id")
          li(@click.left="selectImage(image)" tabindex="0" v-on:keydown.enter="selectImage(image)" :class="{ active: isCardUrl(image)}")
            img(:src="image.previewUrl")
            a(v-if="image.sourcePageUrl" :href="image.sourcePageUrl" target="_blank" @click.left.stop)
              button.small-button
                span(v-if="image.sourceName") {{image.sourceName}}{{' '}}
                span →

</template>

<script>
import Loader from '@/components/Loader.vue'
import AIImageGeneration from '@/components/AIImageGeneration.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'

import debounce from 'lodash-es/debounce'
import sample from 'lodash-es/sample'

const numberOfImages = 25

export default {
  name: 'ImagePicker',
  components: {
    Loader,
    AIImageGeneration
  },
  props: {
    visible: Boolean,
    initialSearch: String,
    cardUrl: String,
    cardId: String,
    removeIsVisible: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.clearHeights()
        this.updateHeightFromDialog()
      }
    })
  },
  data () {
    return {
      images: [],
      search: '',
      service: 'stickers', // 'stickers', 'gifs', 'bing', 'ai'
      loading: false,
      minDialogHeight: 400,
      dialogHeight: null,
      resultsSectionHeight: null,
      error: {
        unknownServerError: false,
        userIsOffline: false,
        signUpToUpload: false,
        sizeLimit: false,
        unknownUploadError: false
      }
    }
  },
  computed: {
    searchInput: {
      get () {
        return this.search
      },
      set (newValue) {
        this.search = newValue
        if (newValue) {
          this.loading = true
          this.searchService()
        }
      }
    },
    provider () {
      if (this.service === 'stickers' || this.service === 'gifs') {
        return 'giphy'
      } else {
        return 'bing'
      }
    },
    placeholder () {
      let label = this.provider
      if (label === 'bing') {
        label = 'images'
      }
      return `Search ${utils.capitalizeFirstLetter(label)}`
    },
    cardPendingUpload () {
      const pendingUploads = this.$store.state.upload.pendingUploads
      return pendingUploads.find(upload => upload.cardId === this.cardId)
    },
    serviceIsBing () {
      return this.service === 'bing'
    },
    serviceIsStickers () {
      return this.service === 'stickers'
    },
    serviceIsAI () {
      return this.service === 'ai'
    },
    serviceIsGifs () {
      return this.service === 'gifs'
    },
    isNoSearchResults () {
      if (this.error.unknownServerError || this.error.userIsOffline) {
        return false
      } else if (this.search && !this.loading && !this.images.length) {
        return true
      } else {
        return false
      }
    },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    lastUsedImagePickerService () { return this.$store.state.currentUser.lastUsedImagePickerService }
  },
  methods: {
    removeImage () {
      this.$emit('removeImage')
    },
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs', 'ImagePicker.triggerSignUpOrInIsVisible')
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    triggerUpgradeUserIsVisible () {
      this.$store.dispatch('closeAllDialogs', 'ImagePicker.triggerUpgradeUserIsVisible')
      this.$store.commit('triggerUpgradeUserIsVisible')
    },
    toggleServiceIsBing () {
      this.service = 'bing'
      this.searchAgain()
      this.updateLastUsedImagePickerService()
    },
    toggleServiceIsAI () {
      this.service = 'ai'
      this.updateLastUsedImagePickerService()
    },
    toggleServiceIsStickers () {
      this.service = 'stickers'
      this.searchAgain()
      this.updateLastUsedImagePickerService()
    },
    toggleServiceIsGifs () {
      this.service = 'gifs'
      this.searchAgain()
      this.updateLastUsedImagePickerService()
    },
    searchAgain () {
      this.images = []
      this.loading = true
      this.searchService()
    },
    async searchBing () {
      let url = new URL('https://api.bing.microsoft.com/v7.0/images/search')
      const headers = new Headers({
        'Ocp-Apim-Subscription-Key': '1b8fd229ada041c59701469809a34bf4'
      })
      const defaultSearches = [ 'animals', 'flowers', 'forest', 'ocean' ]
      const defaultSearch = sample(defaultSearches)
      let params = { q: this.search || defaultSearch }
      params.maxWidth = 600
      url.search = new URLSearchParams(params).toString()
      const response = await fetch(url, { method: 'GET', headers })
      const data = await response.json()
      this.normalizeResults(data, 'bing')
    },
    async searchGiphy (isStickers) {
      let resource = 'gifs'
      let endpoint = 'trending'
      if (isStickers) {
        resource = 'stickers'
      }
      if (this.search) {
        endpoint = 'search'
      }
      let url = new URL(`https://api.giphy.com/v1/${resource}/${endpoint}`)
      let params = {
        api_key: 'pK3Etx5Jj8IAzUx9Z7H7dUcjD4PazKq7',
        limit: numberOfImages,
        rating: 'g'
      }
      if (this.search) {
        params.q = this.search
      }
      url.search = new URLSearchParams(params).toString()
      const response = await fetch(url)
      const data = await response.json()
      this.normalizeResults(data.data, 'giphy')
    },
    searchService: debounce(async function () {
      this.clearErrors()
      this.loading = true
      const isOffline = !this.$store.state.isOnline
      if (isOffline) {
        this.loading = false
        this.error.userIsOffline = true
        return
      }
      try {
        if (this.serviceIsBing) {
          await this.searchBing()
        } else if (this.serviceIsStickers) {
          const isStickers = true
          await this.searchGiphy(isStickers)
        } else if (this.serviceIsGifs) {
          await this.searchGiphy()
        }
      } catch (error) {
        console.error('🚒', error)
        this.images = []
        this.error.unknownServerError = true
      }
      this.loading = false
    }, 350),
    clearErrors () {
      this.error.signUpToUpload = false
      this.error.sizeLimit = false
      this.error.unknownServerError = false
      this.error.userIsOffline = false
      this.error.unknownUploadError = false
    },
    clearHeights () {
      this.minDialogHeight = 400
      this.dialogHeight = null
      this.resultsSectionHeight = null
    },
    normalizeResults (data, service) {
      const bing = service === 'bing' && this.serviceIsBing
      const giphy = service === 'giphy' && (this.serviceIsStickers || this.serviceIsGifs)
      // bing
      if (bing) {
        data = data.value
        this.images = data.map(image => {
          const isImage = utils.urlIsImage(image.contentUrl)
          if (!isImage) { return }
          return {
            id: image.imageid,
            previewUrl: image.thumbnailUrl,
            url: image.contentUrl
          }
        })
        this.images = this.images.filter(image => Boolean(image))
      // giphy
      } else if (giphy) {
        this.images = data.map(image => {
          // stickers
          if (this.serviceIsStickers) {
            return {
              isVideo: true,
              id: image.id,
              previewUrl: image.images.fixed_height_small.url,
              url: utils.urlWithoutQueryString(image.images.original.url)
            }
          // gifs
          } else {
            return {
              isVideo: true,
              id: image.id,
              previewUrl: image.images.fixed_height.url,
              url: utils.urlWithoutQueryString(image.images.original.mp4)
            }
          }
        })
        this.$nextTick(() => {
          this.updateHeightFromDialog()
          this.scrollIntoView()
        })
      }
    },
    focusSearchInput () {
      if (utils.isMobile()) { return }
      const element = this.$refs.searchInput
      const length = this.search.length
      element.focus()
      element.setSelectionRange(length, length)
      this.$store.commit('triggerUpdatePositionInVisualViewport')
    },
    clearSearch () {
      this.search = ''
      this.loading = false
      this.images = []
      this.searchService()
    },
    selectImage (image) {
      this.$emit('selectImage', image)
    },
    scrollIntoView () {
      if (!this.visible) { return }
      const element = this.$refs.dialog
      if (!element) { return }
      utils.scrollIntoView(element)
      this.$store.commit('triggerUpdatePositionInVisualViewport')
    },
    isCardUrl (image) {
      return this.cardUrl === image.url
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
      const cardId = this.cardId
      const input = this.$refs.input
      const file = input.files[0]
      try {
        await this.$store.dispatch('upload/uploadFile', { file, cardId })
      } catch (error) {
        console.warn('🚒', error)
        if (error.type === 'sizeLimit') {
          this.error.sizeLimit = true
        } else {
          this.error.unknownUploadError = true
        }
      }
    },
    heightIsSignificantlyDifferent (height) {
      const thresholdDelta = 100
      if (!this.resultsSectionHeight) { return true }
      if (Math.abs(this.resultsSectionHeight - height) > thresholdDelta) {
        return true
      }
    },
    updateHeightFromDialog () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        const element = this.$refs.dialog
        const dialogHeight = utils.elementHeight(element)
        this.minDialogHeight = Math.max(this.minDialogHeight, dialogHeight)
        this.updateResultsSectionHeight()
      })
    },
    updateHeightFromFooter () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
        this.minDialogHeight = Math.max(this.minDialogHeight, this.dialogHeight)
        this.updateResultsSectionHeight()
      })
    },
    updateResultsSectionHeight () {
      this.$nextTick(() => {
        this.$nextTick(() => {
          if (!this.visible) { return }
          let resultsSection = this.$refs.results
          let serviceSection
          serviceSection = this.$refs.cardImageServiceSection
          let searchSection = this.$refs.searchSection
          if (!serviceSection) { return }
          serviceSection = serviceSection.getBoundingClientRect().height
          resultsSection = utils.elementHeight(resultsSection, true)
          searchSection = searchSection.getBoundingClientRect().height
          this.resultsSectionHeight = resultsSection + serviceSection + searchSection + 4
        })
      })
    },
    resetPinchCounterZoomDecimal () {
      this.$store.commit('pinchCounterZoomDecimal', 1)
    },
    updateLastUsedImagePickerService () {
      this.$store.dispatch('currentUser/update', { lastUsedImagePickerService: this.service })
    },
    updateServiceFromLastUsedService () {
      if (!this.lastUsedImagePickerService) { return }
      this.service = this.lastUsedImagePickerService
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.updateServiceFromLastUsedService()
          this.search = this.initialSearch
          this.scrollIntoView()
          this.searchService()
          this.focusSearchInput()
        }
      })
    }
  }
}
</script>

<style lang="stylus">
.image-picker
  max-height 100vh
  .search-wrap
    .loader
      width 13px
      height 14px
      margin-right 3px
      flex-shrink 0

  .results-section
    padding-top 0
    padding-bottom 0

  .search-input-wrap
    max-height initial

  .error-container
    p,
    .badge
      margin 4px
      margin-top 0
      margin-bottom 8px
  .hidden
    display none

  .error-container-top + label
    margin-top 10px

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

  .sticker
    vertical-align -2px

  .title-row-flex
    display flex
    justify-content space-between

</style>
