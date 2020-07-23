<template lang="pug">
dialog.narrow.image-picker(v-if="visible" :open="visible" @click.stop ref="dialog")
  section
    .row
      .segmented-buttons
        button(@click.stop="toggleServiceIsArena" :class="{active : serviceIsArena}")
          span Are.na
        button(@click.stop="toggleServiceIsGfycat" :class="{active : serviceIsGfycat}")
          span Gfycat
      .button-wrap
        button(@click.stop="selectFile") Upload
        input.hidden(type="file" ref="input" @change="uploadFile")

    label(v-if="serviceIsGfycat" :class="{active: gfycatIsStickers}" @click.prevent="toggleGfycatIsStickers" @keydown.stop.enter="toggleGfycatIsStickers")
      input(type="checkbox" v-model="gfycatIsStickers")
      span Stickers

  section.results-section
    .search-wrap
      img.icon.search(v-if="!loading" src="@/assets/search.svg" @click="focusSearchInput")
      Loader(:visible="loading")
      input(
        :placeholder="placeholder"
        v-model="searchInput"
        ref="searchInput"
        @keyup.stop.backspace
        @keyup.stop.enter
      )
      button.borderless.clear-input-wrap(@click="clearSearch")
        img.icon(src="@/assets/add.svg")
    .error-container
      p(v-if="isNoSearchResults") Nothing found on {{service}} for {{search}}
      .badge.danger(v-if="error.unknownServerError") (シ_ _)シ Something went wrong, Please try again or contact support
      .badge.danger(v-if="error.userIsOffline") Can't search {{service}} while offline, Please try again later

  section.results-section
    ul.results-list.image-list
      template(v-for="(image in images")
        li(@click="selectImage(image)" tabindex="0" :key="image.id" v-on:keydown.enter="selectImage(image)" :class="{ active: isCardUrl(image)}")
          //- video(v-if="image.isVideo" autoplay loop muted playsinline)
          //-   source(:src="image.url")
          img(:src="image.previewUrl")
          a(v-if="image.sourcePageUrl" :href="image.sourcePageUrl" target="_blank" @click.stop)
            button {{image.sourceUserName}} →

</template>

<script>
import debounce from 'lodash-es/debounce'

import scrollIntoView from '@/scroll-into-view.js'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

export default {
  name: 'ImagePicker',
  components: {
    Loader
  },
  props: {
    visible: Boolean,
    initialSearch: String,
    cardUrl: String
  },
  data () {
    return {
      images: [],
      search: '',
      service: 'Are.na',
      gfycatIsStickers: false,
      loading: false,
      error: {
        unknownServerError: false,
        userIsOffline: false
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
    serviceIsArena () {
      if (this.service === 'Are.na') {
        return true
      } else {
        return false
      }
    },
    serviceIsGfycat () {
      if (this.service === 'Gfycat') {
        return true
      } else {
        return false
      }
    },
    isNoSearchResults () {
      if (this.error.unknownServerError || this.error.userIsOffline) {
        return false
      } else if (this.search && !this.loading && !this.images.length) {
        return true
      } else {
        return false
      }
    }
  },
  methods: {
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
      this.error.unknownServerError = false
      this.error.userIsOffline = false
    },
    normalizeResults (data, service) {
      if (service === 'Are.na' && this.serviceIsArena) {
        this.images = data.blocks.map(image => {
          return {
            id: image.id,
            sourcePageUrl: `https://www.are.na/block/${image.id}`,
            sourceUserName: image.user.username,
            previewUrl: image.image.large.url,
            url: image.image.large.url + '?img=.jpg'
          }
        })
      } else if (service === 'Gfycat' && this.serviceIsGfycat) {
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
      const element = this.$refs.dialog
      const isTouchDevice = this.$store.state.isTouchDevice
      scrollIntoView.scroll(element, isTouchDevice)
      this.$store.commit('triggerUpdatePositionInVisualViewport')
    },
    isCardUrl (image) {
      return this.cardUrl === image.url
    },
    selectFile (event) {
      // if (this.loading) { return } this shouldn't matter
      const input = this.$refs.input
      input.click()
    },

    // move to a global place/plugin/util?
    uploadFile (file) {
      // try catch
      console.log('🍡', file)

      // close dialog
      // show loader in card, cancellable? (nonlinear uploader)
      // not cancellable cuz notion, trello and arena aren't cancellable :. not worth the complexity

      // new module currentUploads

      // var uploadData = { ratio: Observable(0) };
      // self.pendingUploads.push(uploadData);
      // return self.getPolicy()
      //     .then(function (policy) {
      //     return S3Uploader(policy).upload({
      //         key: file.name,
      //         blob: file
      //     }).progress(self.generateUploadProgressEventHandler(uploadData));
      // }).finally(function () {
      //     self.pendingUploads.remove(uploadData);
      //     self.currentProject().updatedAt((new Date()).toISOString());
      //     return self.currentProject().save(self.api());
      // });
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.scrollIntoView()
          this.focusSearchInput()
          this.search = this.initialSearch
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
      width 16px
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

</style>
