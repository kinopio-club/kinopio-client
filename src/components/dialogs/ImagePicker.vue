<template lang="pug">
dialog.narrow.image-picker(
  v-if="visible"
  :open="visible"
  @click.left.stop
  ref="dialog"
  :class="{'background-image-picker' : isBackgroundImage, 'right-side': showOnRightSide}"
  :style="{'max-height': dialogHeight + 'px', 'min-height': minDialogHeight + 'px'}"
)
  section(v-if="!isBackgroundImage" ref="cardImageServiceSection")
    //- card images
    .row
      .segmented-buttons
        button(@click.left.stop="toggleServiceIsStickers" :class="{active : serviceIsStickers}" title="stickers")
          img.icon.sticker(src="@/assets/sticker.svg")
        button(@click.left.stop="toggleServiceIsArena" :class="{active : serviceIsArena}" title="are.na")
          img.icon.arena(src="@/assets/arena.svg")
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
    .row
      .segmented-buttons
        button(@click.left.stop="toggleServiceIsBackgrounds" :class="{active : serviceIsBackgrounds}")
          span Backgrounds
        button(@click.left.stop="toggleServiceIsArena" :class="{active : serviceIsArena}")
          img.icon.arena(src="@/assets/arena.svg")

  //- search box
  section.results-section.search-input-wrap(ref="searchSection")
    .search-wrap(v-if="!serviceIsBackgrounds")
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
      template(v-for="(image in images")
        li(@click.left="selectImage(image)" tabindex="0" :key="image.id" v-on:keydown.enter="selectImage(image)" :class="{ active: isCardUrl(image)}")
          img(:src="image.previewUrl")
          a(v-if="image.sourcePageUrl" :href="image.sourcePageUrl" target="_blank" @click.left.stop)
            button {{image.sourceUserName}} →

    template(v-if="serviceIsBackgrounds")
      .button-wrap.animated-button-wrap
        button(:class="{active: animatedBackgroundsVisible}" @click.left.prevent="toggleAnimatedBackgroundsVisible" @keydown.stop.enter="toggleAnimatedBackgroundsVisible")
          img.icon(v-if="animatedBackgroundsVisible" src="@/assets/view.svg")
          img.icon(v-else src="@/assets/view-hidden.svg")
          span Animated
      ul.results-list.image-list(v-if="animatedBackgroundsVisible")
        template(v-for="(image in animatedBackgroundImages")
          li(@click.left="selectImage(image)" tabindex="0" :key="image.id" v-on:keydown.enter="selectImage(image)" :class="{ active: isCardUrl(image)}")
            img(:src="image.previewUrl")
            a(v-if="image.sourcePageUrl" :href="image.sourcePageUrl" target="_blank" @click.left.stop)
              button {{image.sourceUserName}} →

</template>

<script>
import scrollIntoView from '@/scroll-into-view.js'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
import backgroundImages from '@/data/backgroundImages.json'
import backgroundImagesAnimated from '@/data/backgroundImagesAnimated.json'

import debounce from 'lodash-es/debounce'
import sampleSize from 'lodash-es/sampleSize'

let randomArenaBlocksData
const numberOfImages = 25
const arenaChannelRandomBlocksFrom = 'kinopio-moods'

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
    isBackgroundImage: Boolean
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
      service: 'stickers', // 'stickers', 'gifs', 'arena', 'backgrounds'
      loading: false,
      showOnRightSide: false,
      minDialogHeight: null,
      dialogHeight: null,
      resultsSectionHeight: null,
      error: {
        unknownServerError: false,
        userIsOffline: false,
        signUpToUpload: false,
        sizeLimit: false,
        unknownUploadError: false
      },
      backgroundsIsStatic: true,
      animatedBackgroundsVisible: false,
      animatedBackgroundImages: []
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
        return 'are.na'
      }
    },
    placeholder () {
      return `Search ${utils.capitalizeFirstLetter(this.provider)}`
    },
    cardPendingUpload () {
      const pendingUploads = this.$store.state.upload.pendingUploads
      return pendingUploads.find(upload => upload.cardId === this.cardId)
    },
    serviceIsArena () {
      return this.service === 'arena'
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
    toggleAnimatedBackgroundsVisible () {
      this.animatedBackgroundsVisible = !this.animatedBackgroundsVisible
      this.searchAgainBackgrounds()
      if (this.animatedBackgroundsVisible) {
        const results = this.$refs.results
        const currentY = results.scrollHeight
        this.$nextTick(() => {
          results.scrollTop = currentY
        })
      }
    },
    toggleServiceIsArena () {
      this.service = 'arena'
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
    searchAgainBackgrounds () {
      let images
      images = backgroundImages
      if (this.animatedBackgroundsVisible) {
        this.normalizeBackgroundImages(backgroundImagesAnimated)
      }
      this.normalizeResults(images, 'backgrounds')
    },
    searchAgain () {
      this.images = []
      this.loading = true
      this.searchService()
    },
    async randomArenaBlocks () {
      let url, params, data
      if (randomArenaBlocksData) {
        data = randomArenaBlocksData
      } else {
        url = new URL(`https://api.are.na/v2/channels/${arenaChannelRandomBlocksFrom}/contents`)
        params = {
          per: 100
        }
        url.search = new URLSearchParams(params).toString()
        const response = await fetch(url)
        data = await response.json()
        data.blocks = data.contents
        data.blocks = data.blocks.filter(block => block.image)
        data.blocks = data.blocks.map(block => {
          let image = {}
          image.image = block.image
          image.id = block.id
          image.user = {
            username: ''
          }
          return image
        })
        randomArenaBlocksData = data
      }
      data.blocks = sampleSize(data.blocks, numberOfImages)
      return data
    },
    async searchArena () {
      let url, params, data
      if (this.search) {
        url = new URL('https://api.are.na/v2/search/blocks')
        params = {
          q: this.search,
          'filter[type]': 'image'
        }
        url.search = new URLSearchParams(params).toString()
        const response = await fetch(url)
        data = await response.json()
      } else {
        data = await this.randomArenaBlocks()
      }
      this.normalizeResults(data, 'arena')
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
        if (this.serviceIsArena) {
          await this.searchArena()
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
      this.minDialogHeight = null
      this.dialogHeight = null
      this.resultsSectionHeight = null
    },
    normalizeResults (data, service) {
      console.log('🎑', service, data)
      const arena = service === 'arena' && this.serviceIsArena
      const giphy = service === 'giphy' && (this.serviceIsStickers || this.serviceIsGifs)
      const backgrounds = service === 'backgrounds' && this.serviceIsBackgrounds
      if (arena) {
        this.images = data.blocks.map(image => {
          const url = image.image.original.url
          return {
            id: image.id,
            sourcePageUrl: `https://www.are.na/block/${image.id}`,
            sourceUserName: image.user.username,
            previewUrl: image.image.display.url,
            url: url + '?img=.jpg'
          }
        })
      } else if (giphy) {
        this.images = data.map(image => {
          if (this.serviceIsStickers) {
            return {
              isVideo: true,
              id: image.id,
              previewUrl: image.images.fixed_height_small.url,
              url: utils.urlWithoutQueryString(image.images.original.url)
            }
          } else {
            return {
              isVideo: true,
              id: image.id,
              previewUrl: image.images.fixed_height.url,
              url: utils.urlWithoutQueryString(image.images.original.mp4)
            }
          }
        })
      } else if (backgrounds) {
        this.images = data.map(image => {
          image.sourceUserName = null
          image.previewUrl = image.url
          return image
        })
      }
      if (!this.isBackgroundImage) {
        this.updateHeightFromDialog()
        this.scrollIntoView()
      }
    },
    normalizeBackgroundImages (images) {
      this.animatedBackgroundImages = images.map(image => {
        image.sourceUserName = null
        image.previewUrl = image.url
        return image
      })
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
      if (utils.isMobile()) { return }
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
    checkIfShouldBeOnRightSide () {
      this.showOnRightSide = false
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.showOnRightSide = utils.elementShouldBeOnRightSide(element)
      })
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
      this.animatedBackgroundsVisible = false
      this.$nextTick(() => {
        if (visible) {
          this.search = this.initialSearch
          if (this.isBackgroundImage) {
            this.toggleServiceIsBackgrounds()
            this.updateHeightFromFooter()
            return
          }
          this.checkIfShouldBeOnRightSide()
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
    button
      position absolute
      top 6px
      right 10px

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
  .arena
    width 18px

  &.background-image-picker
    padding-top 4px

  &.right-side
    left initial
    right 8px

  .sticker
    vertical-align -2px

  .animated-button-wrap
    margin 8px

</style>
