<template lang="pug">
dialog.narrow.image-picker(
  v-if="visible"
  :open="visible"
  @click.left.stop
  ref="dialog"
  :class="{'background-image-picker' : isBackgroundImage, 'right-side': showOnRightSide}"
  :style="{'max-height': dialogHeight + 'px'}"
)
  section(v-if="!isBackgroundImage")
    //- card images
    .row
      .segmented-buttons
        button(@click.left.stop="toggleServiceIsArena" :class="{active : serviceIsArena}")
          span Are.na
        button(@click.left.stop="toggleServiceIsGfycat" :class="{active : serviceIsGfycat}")
          span Gfycat
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
    //- stickers toggle
    label(v-if="serviceIsGfycat" :class="{active: gfycatIsStickers}" @click.left.prevent="toggleGfycatIsStickers" @keydown.stop.enter="toggleGfycatIsStickers")
      input(type="checkbox" v-model="gfycatIsStickers")
      span Stickers

  //- background images
  section(v-if="isBackgroundImage")
    .row
      .segmented-buttons
        button(@click.left.stop="toggleServiceIsBackgrounds" :class="{active : serviceIsBackgrounds}")
          span Backgrounds
        button(@click.left.stop="toggleServiceIsArena" :class="{active : serviceIsArena}")
          span Are.na

  //- search results
  section.results-section
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
      )
      button.borderless.clear-input-wrap(@click.left="clearSearch")
        img.icon(src="@/assets/add.svg")
    .error-container(v-if="isNoSearchResults || error.unknownServerError || error.userIsOffline")
      p(v-if="isNoSearchResults") Nothing found on {{service}} for {{search}}
      .badge.danger(v-if="error.unknownServerError") (シ_ _)シ Something went wrong, Please try again or contact support
      .badge.danger(v-if="error.userIsOffline") Can't search {{service}} while offline, Please try again later

  section.results-section(ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    ul.results-list.image-list
      template(v-for="(image in images")
        li(@click.left="selectImage(image)" tabindex="0" :key="image.id" v-on:keydown.enter="selectImage(image)" :class="{ active: isCardUrl(image)}")
          //- video(v-if="image.isVideo" autoplay loop muted playsinline)
          //-   source(:src="image.url")
          img(:src="image.previewUrl")
          a(v-if="image.sourcePageUrl" :href="image.sourcePageUrl" target="_blank" @click.left.stop)
            button {{image.sourceUserName}} →

</template>

<script>
import scrollIntoView from '@/scroll-into-view.js'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
import backgroundImages from '@/data/backgroundImages.json'

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
    isBackgroundImage: Boolean,
    imageIsFullSize: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.checkIfShouldBeOnRightSide()
      }
    })
  },
  data () {
    return {
      images: [],
      search: '',
      service: 'Are.na',
      gfycatIsStickers: false,
      loading: false,
      showOnRightSide: false,
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
        } else {
          this.clearSearch()
        }
      }
    },
    placeholder () { return `Search ${this.service}` },
    cardPendingUpload () {
      const pendingUploads = this.$store.state.upload.pendingUploads
      return pendingUploads.find(upload => upload.cardId === this.cardId)
    },
    serviceIsArena () {
      return this.service === 'Are.na'
    },
    serviceIsGfycat () {
      return this.service === 'Gfycat'
    },
    serviceIsBackgrounds () {
      return this.service === 'Backgrounds'
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
      this.service = 'Backgrounds'
      this.searchAgainBackgrounds()
    },
    toggleServiceIsArena () {
      this.service = 'Are.na'
      this.searchAgain()
    },
    toggleServiceIsGfycat () {
      this.service = 'Gfycat'
      this.searchAgain()
    },
    toggleGfycatIsStickers () {
      this.gfycatIsStickers = !this.gfycatIsStickers
      this.searchAgain()
    },
    searchAgainBackgrounds () {
      this.normalizeResults(backgroundImages, 'Backgrounds')
    },
    searchAgain () {
      this.images = []
      if (this.search) {
        this.loading = true
        this.searchService()
      }
    },
    async searchArena () {
      const url = new URL('https://api.are.na/v2/search/blocks')
      const params = {
        q: this.search,
        'filter[type]': 'image'
      }
      url.search = new URLSearchParams(params).toString()
      const response = await fetch(url)
      const data = await response.json()
      this.normalizeResults(data, 'Are.na')
    },
    async searchGfycat () {
      let url
      if (this.gfycatIsStickers) {
        url = new URL('https://api.gfycat.com/v1/stickers/search')
      } else {
        url = new URL('https://api.gfycat.com/v1/gfycats/search')
      }
      const params = {
        search_text: this.search,
        count: 20
      }
      url.search = new URLSearchParams(params).toString()
      const response = await fetch(url)
      const data = await response.json()
      this.normalizeResults(data, 'Gfycat')
    },
    searchService: debounce(async function () {
      this.clearErrors()
      this.loading = true
      if (!this.search) {
        this.loading = false
        return
      }
      const isOffline = !this.$store.state.isOnline
      if (isOffline) {
        this.loading = false
        this.error.userIsOffline = true
        return
      }
      try {
        if (this.serviceIsArena) {
          await this.searchArena()
        } else if (this.serviceIsGfycat) {
          await this.searchGfycat()
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
    normalizeResults (data, service) {
      const arena = service === 'Are.na' && this.serviceIsArena
      const gyfcat = service === 'Gfycat' && this.serviceIsGfycat
      const backgrounds = service === 'Backgrounds' && this.serviceIsBackgrounds
      if (arena) {
        this.images = data.blocks.map(image => {
          let url
          if (this.imageIsFullSize) {
            url = image.image.original.url
          } else {
            url = image.image.display.url
          }
          return {
            id: image.id,
            sourcePageUrl: `https://www.are.na/block/${image.id}`,
            sourceUserName: image.user.username,
            previewUrl: image.image.display.url,
            url: url + '?img=.jpg'
          }
        })
      } else if (gyfcat) {
        this.images = data.gfycats.map(image => {
          if (this.gfycatIsStickers) {
            return {
              id: image.gfyId,
              previewUrl: image.gifUrl,
              url: image.gifUrl
            }
          } else {
            return {
              isVideo: true,
              id: image.gfyId,
              previewUrl: image.max1mbGif,
              url: image.mobileUrl
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
      if (this.isBackgroundImage) {
        this.updateHeight()
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
        if (!element) { return }
        element = element.getBoundingClientRect()
        const viewport = utils.visualViewport()
        const offset = viewport.width - (element.x + element.width)
        if (offset < 0) {
          this.showOnRightSide = true
        }
      })
    },
    updateHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        if (!element) { return }
        this.dialogHeight = utils.elementHeightFromHeader(element)
        element = this.$refs.results
        this.resultsSectionHeight = utils.elementHeightFromHeader(element, true)
      })
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
            this.updateHeight()
            return
          }
          this.scrollIntoView()
          this.focusSearchInput()
          if (this.search) {
            this.loading = true
          }
          this.searchService()
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

</style>
