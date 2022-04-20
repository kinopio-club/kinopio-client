<template lang="pug">
dialog.image-picker(
  v-if="visible"
  :open="visible"
  @click.left.stop
  ref="dialog"
  :class="{'background-image-picker' : isBackgroundImage }"
  :style="{'max-height': dialogHeight + 'px', 'min-height': minDialogHeight + 'px'}"
)
  section(v-if="!isBackgroundImage" ref="cardImageServiceSection")
    //- card images
    .row.title-row-flex
      .segmented-buttons
        button(@click.left.stop="toggleServiceIsStickers" :class="{active : serviceIsStickers}" title="stickers")
          img.icon.sticker(src="@/assets/sticker.svg")
        button(@click.left.stop="toggleServiceIsUnsplash" :class="{active : serviceIsUnsplash}" title="unsplash")
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
        span.badge.info you need to Sign Up or In
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
      .badge.danger (シ_ _)シ Something went wrong, Please try again or contact support

  //- background images
  section(v-if="isBackgroundImage" ref="serviceSection")
    .row.title-row-flex
      .segmented-buttons
        button(@click.left.stop="toggleServiceIsBackgrounds" :class="{active : serviceIsBackgrounds}")
          span Backgrounds
        button(@click.left.stop="toggleServiceIsRecent" :class="{active : serviceIsRecent}")
          span Recent
        button(@click.left.stop="toggleServiceIsUnsplash" :class="{active : serviceIsUnsplash}")
          img.icon(src="@/assets/search.svg")

      .button-wrap(v-if="removeIsVisible")
        button(@click="removeImage")
          img.icon(src="@/assets/remove.svg")

  //- search box
  section.results-section.search-input-wrap(ref="searchSection")
    .search-wrap(v-if="serviceHasSearch")
      img.icon.search(v-if="!loading" src="@/assets/search.svg" @click.left="focusSearchInput")
      Loader(:visible="loading")
      input(
        :placeholder="placeholder"
        v-model="searchInput"
        ref="searchInput"
        @keyup.stop.backspace
        @keyup.stop.enter
        @mouseup.stop
        @touchend.stop
        @focus="resetPinchCounterZoomDecimal"
      )
      button.borderless.clear-input-wrap(@click.left="clearSearch")
        img.icon(src="@/assets/add.svg")
    //- .row.search-options-row
    //-   //- p
    //-   //-   span Blobs
    //-   //-   span Arrows
    //-   .segmented-buttons
    //-     button Blobs
    //-     button Arrows
    //-     button something

    .error-container(v-if="isNoSearchResults || error.unknownServerError || error.userIsOffline")
      p(v-if="isNoSearchResults") Nothing found on {{service}} for {{search}}
      .badge.danger(v-if="error.unknownServerError") (シ_ _)シ Something went wrong, Please try again or contact support
      .badge.danger(v-if="error.userIsOffline") Can't search {{service}} while offline, Please try again later

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
import scrollIntoView from '@/scroll-into-view.js'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
import backgroundImages from '@/data/backgroundImages.json'
import cache from '@/cache.js'

import debounce from 'lodash-es/debounce'
import uniq from 'lodash-es/uniq'

const numberOfImages = 25
const unsplashApiKey = 'qkjL_lJ4cIHqkV-Q90BjstyX9fH4vTe8bcqn6KU5NGc'

export default {
  name: 'ImagePicker',
  components: {
    Loader
  },
  props: {
    visible: Boolean,
    initialSearch: String,
    cardUrl: String,
    cardId: String,
    isBackgroundImage: Boolean,
    removeIsVisible: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.clearHeights()
        if (this.isBackgroundImage) {
          this.updateHeightFromFooter()
        } else {
          this.updateHeightFromDialog()
        }
      }
    })
  },
  data () {
    return {
      images: [],
      search: '',
      service: 'stickers', // 'stickers', 'gifs', 'unsplash', 'backgrounds', 'recent'
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
      },
      backgroundsIsStatic: true
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
        return 'unsplash'
      }
    },
    placeholder () {
      return `Search ${utils.capitalizeFirstLetter(this.provider)}`
    },
    cardPendingUpload () {
      const pendingUploads = this.$store.state.upload.pendingUploads
      return pendingUploads.find(upload => upload.cardId === this.cardId)
    },
    serviceIsUnsplash () {
      return this.service === 'unsplash'
    },
    serviceIsStickers () {
      return this.service === 'stickers'
    },
    serviceIsGifs () {
      return this.service === 'gifs'
    },
    serviceIsBackgrounds () {
      return this.service === 'backgrounds'
    },
    serviceIsRecent () {
      return this.service === 'recent'
    },
    serviceHasSearch () {
      return !this.serviceIsBackgrounds && !this.serviceIsRecent
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
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] }
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
    toggleServiceIsBackgrounds () {
      this.service = 'backgrounds'
      this.searchAgainBackgrounds()
    },
    toggleServiceIsRecent () {
      this.service = 'recent'
      this.updateImagesFromCachedSpace()
    },
    toggleServiceIsUnsplash () {
      this.service = 'unsplash'
      this.searchAgain()
    },
    toggleServiceIsStickers () {
      this.service = 'stickers'
      this.searchAgain()
    },
    toggleServiceIsGifs () {
      this.service = 'gifs'
      this.searchAgain()
    },
    updateImagesFromCachedSpace () {
      let spaces = cache.getAllSpaces()
      spaces = spaces.filter(space => space.id !== this.$store.state.currentSpace.id)
      let images = []
      spaces.forEach(space => {
        if (!space.background) { return }
        images.push(space.background)
      })
      images = uniq(images)
      images = images.map(url => {
        const backgroundImage = backgroundImages.find(item => item.url === url)
        if (backgroundImage) { return }
        return {
          url,
          previewUrl: url
        }
      })
      images = images.filter(image => Boolean(image))
      const max = 30
      images = images.slice(0, max)
      this.images = images
    },
    searchAgainBackgrounds () {
      let images
      images = backgroundImages
      this.normalizeResults(images, 'backgrounds')
    },
    searchAgain () {
      this.images = []
      this.loading = true
      this.searchService()
    },
    async searchUnsplash () {
      let url = new URL('https://api.unsplash.com/photos')
      let params = { client_id: unsplashApiKey }
      if (this.search) {
        url = new URL('https://api.unsplash.com/search/photos')
        params.query = this.search
      }
      url.search = new URLSearchParams(params).toString()
      const response = await fetch(url)
      const data = await response.json()
      this.normalizeResults(data, 'unsplash')
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
        if (this.serviceIsUnsplash) {
          await this.searchUnsplash()
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
      const unsplash = service === 'unsplash' && this.serviceIsUnsplash
      const giphy = service === 'giphy' && (this.serviceIsStickers || this.serviceIsGifs)
      const backgrounds = service === 'backgrounds' && this.serviceIsBackgrounds
      // unsplash
      if (unsplash) {
        if (data.results) {
          data = data.results
        }
        this.images = data.map(image => {
          let qs = `?w=600&img=true`
          if (this.isBackgroundImage) {
            qs = `?w=1080&h=1080&q=60&img=true`
          }
          let url = image.urls.small
          url = utils.urlWithoutQueryString(url)
          url = url + qs
          let name = image.user.first_name + ' ' + image.user.last_name
          name = utils.truncated(name, 20)
          return {
            id: image.id,
            sourcePageUrl: image.user.links.html,
            sourceName: name,
            previewUrl: image.urls.thumb,
            url
          }
        })
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
      // backgrounds
      } else if (backgrounds) {
        this.images = data.map(image => {
          image.previewUrl = image.previewUrl || image.url
          return image
        })
      }
      if (!this.isBackgroundImage) {
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
    pingUnsplash (image) {
      // when a user selects a photo, use the download endpoint to let unsplash know
      image = this.images.find(unsplashImage => unsplashImage.id === image.id)
      let url = new URL(`https://api.unsplash.com/photos/${image.id}/download`)
      let params = { client_id: unsplashApiKey }
      url.search = new URLSearchParams(params).toString()
      fetch(url)
    },
    selectImage (image) {
      if (this.serviceIsUnsplash) {
        this.pingUnsplash(image)
      }
      this.$emit('selectImage', image)
    },
    scrollIntoView () {
      if (!this.visible) { return }
      if (this.isBackgroundImage) {
        this.updateHeightFromFooter()
        return
      }
      const element = this.$refs.dialog
      if (!element) { return }
      const isTouchDevice = this.$store.state.isTouchDevice
      scrollIntoView.scroll(element, isTouchDevice)
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
          if (this.isBackgroundImage) {
            serviceSection = this.$refs.serviceSection
          } else {
            serviceSection = this.$refs.cardImageServiceSection
          }
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
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.search = this.initialSearch
          if (this.isBackgroundImage) {
            this.toggleServiceIsBackgrounds()
            this.updateHeightFromFooter()
            return
          } else {
            this.scrollIntoView()
          }
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

  .image-list
    display flex
    flex-wrap wrap
    align-items flex-start
    li
      position relative
      width 50%
      img
        border-radius 3px
        min-height 100px
    .small-button
      position absolute
      top 6px
      right 10px
      padding 0px
      padding-left 4px
      padding-right 3px
      max-width 80%

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
  // .arena
  //   width 18px

  &.background-image-picker
    padding-top 4px

  .sticker
    vertical-align -2px

  .title-row-flex
    display flex
    justify-content space-between

</style>
