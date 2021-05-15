<template lang="pug">
dialog.narrow.image-picker(
  v-if="visible"
  :open="visible"
  @click.left.stop
  ref="dialog"
  :class="{'background-image-picker' : isBackgroundImage, 'right-side': showOnRightSide}"
  :style="{'max-height': dialogHeight + 'px', 'min-height': minDialogHeight + 'px'}"
)
  section(v-if="!isBackgroundImage")
    //- card images
    .row
      .segmented-buttons
        button(@click.left.stop="toggleServiceIsArena" :class="{active : serviceIsArena}" title="are.na")
          img.icon.arena(src="@/assets/arena.svg")
        button(@click.left.stop="toggleServiceIsStickers" :class="{active : serviceIsStickers}" title="stickers")
          img.icon.sticker(src="@/assets/sticker.svg")
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

    //- attribution
    //- p(v-if="serviceIsArena")
    //-   img.icon.arena(src="@/assets/arena.svg")
    //-   span From Are.na
    //- p(v-else-if="serviceIsGfycat")
    //-   span From Giphy

    //- stickers toggle
    //- .row
    //-   .segmented-buttons(v-if="serviceIsGfycat")
    //-     button(:class="{active : gfycatIsStickers}" @click.left.stop="toggleGfycatIsStickers") Stickers
    //-     button(:class="{active : !gfycatIsStickers}" @click.left.stop="toggleGfycatIsNotStickers") Gifs

    //- label(v-if="serviceIsGfycat" :class="{active: gfycatIsStickers}" @click.left.prevent="toggleGfycatIsStickers" @keydown.stop.enter="toggleGfycatIsStickers")
    //-   input(type="checkbox" v-model="gfycatIsStickers")
    //-   span Stickers

  //- background images
  section(v-if="isBackgroundImage")
    .row
      .segmented-buttons
        button(@click.left.stop="toggleServiceIsBackgrounds" :class="{active : serviceIsBackgrounds}")
          span Backgrounds
        button(@click.left.stop="toggleServiceIsArena" :class="{active : serviceIsArena}")
          img.icon.arena(src="@/assets/arena.svg")
    template(v-if="serviceIsBackgrounds")
      .row
        .segmented-buttons
          button(:class="{active: backgroundsIsStatic}" @click.left.stop="toggleBackgroundsIsStatic(true)") Static
          button(:class="{active: !backgroundsIsStatic}" @click.left.stop="toggleBackgroundsIsStatic(false)") Animated
      //- p(v-if="!backgroundsIsStatic") Animation can be distracting, but really sets a vibe

  //- search box
  section.results-section.search-input-wrap
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

</template>

<script>
import scrollIntoView from '@/scroll-into-view.js'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
import backgroundImages from '@/data/backgroundImages.json'
import backgroundImagesAnimated from '@/data/backgroundImagesAnimated.json'

import debounce from 'lodash-es/debounce'

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
      service: 'arena', // 'stickers', 'gifs', 'arena', 'backgrounds'
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
        } else {
          this.clearSearch()
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
    toggleBackgroundsIsStatic (value) {
      this.backgroundsIsStatic = value
      this.searchAgainBackgrounds()
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
      if (this.backgroundsIsStatic) {
        images = backgroundImages
      } else {
        images = backgroundImagesAnimated
      }
      this.normalizeResults(images, 'backgrounds')
    },
    searchAgain () {
      this.images = []
      this.loading = true
      this.searchService()
    },
    async searchArena () {
      let url, params
      if (this.search) {
        url = new URL('https://api.are.na/v2/search/blocks')
        params = {
          q: this.search,
          'filter[type]': 'image'
        }
      } else {
        // TODO: default feed/explore search
      }
      url.search = new URLSearchParams(params).toString()
      const response = await fetch(url)
      const data = await response.json()
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
        limit: 20,
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
      // if (!this.search) {
      //   this.loading = false
      //   return
      // }
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
      if (!this.isBackgroundImage) {
        this.updateHeightFromDialog()
        this.scrollIntoView()
      }
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
              previewUrl: image.images.fixed_height.mp4,
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
      this.$nextTick(() => {
        this.scrollIntoView()
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
      this.$nextTick(() => {
        this.scrollIntoView()
      })
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
    updateHeightFromDialog () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        const element = this.$refs.dialog
        const dialogHeight = utils.elementHeight(element)
        this.resultsSectionHeight = utils.elementHeight(element, true)
        this.resultsSectionHeight = Math.max(this.resultsSectionHeight, 300)
        this.minDialogHeight = Math.max(this.minDialogHeight, dialogHeight)
      })
    },
    updateHeightFromFooter () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        if (!element) { return }
        this.dialogHeight = utils.elementHeightFromHeader(element)
        element = this.$refs.results
        this.resultsSectionHeight = utils.elementHeightFromHeader(element, true)
        this.minDialogHeight = Math.max(this.minDialogHeight, this.dialogHeight)
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
          this.checkIfShouldBeOnRightSide()
          this.search = this.initialSearch
          if (this.isBackgroundImage) {
            this.toggleServiceIsBackgrounds()
            this.updateHeightFromFooter()
            return
          }
          if (this.search) {
            this.loading = true
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
    li
      position relative
      width 100%
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

  // .search-options-row
  //   padding 4px
  //   overflow scroll
  //   display flex
  //   flex-wrap none
  //   span
  //     text-decoration underline
</style>
