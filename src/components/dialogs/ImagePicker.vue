<template lang="pug">
dialog.narrow.image-picker(v-if="visible" :open="visible" @click.stop ref="dialog")
  section
    .row
      .segmented-buttons
        button(@click.stop="toggleServiceIsArena" :class="{active : serviceIsArena}")
          span Are.na
        button(@click.stop="toggleServiceIsGfycat" :class="{active : serviceIsGfycat}")
          span Gfycat

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

  section.results-section
    p(v-if="isNoSearchResults") Nothing found on {{service}} for {{search}}
    ul.results-list.image-list
      template(v-for="(image in images")
        li(@click="selectImage(image)" tabindex="0" :key="image.id" v-on:keyup.enter="selectImage(image)")
          //- video(v-if="image.isVideo" autoplay loop muted playsinline)
          //-   source(:src="image.url")
          img(:src="image.previewUrl")
          a(v-if="image.sourcePageUrl" :href="image.sourcePageUrl" target="_blank" @click.stop)
            button {{image.sourceUserName}} →
</template>

<script>
import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfil
import debounce from 'lodash-es/debounce'

import Loader from '@/components/Loader.vue'

export default {
  name: 'ImagePicker',
  components: {
    Loader
  },
  props: {
    visible: Boolean,
    initialSearch: String
  },
  data () {
    return {
      images: [],
      search: '',
      service: 'Are.na',
      gfycatIsStickers: false,
      loading: false
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
      if (this.search && !this.loading && !this.images.length) {
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
    searchService: debounce(async function () {
      this.loading = true
      if (!this.search) {
        this.loading = false
        return
      }
      if (this.serviceIsArena) {
        const url = new URL('https://api.are.na/v2/search/blocks')
        const params = {
          q: this.search,
          'filter[type]': 'image'
        }
        url.search = new URLSearchParams(params).toString()
        const response = await fetch(url)
        const data = await response.json()
        this.normalizeResults(data, 'Are.na')
      } else if (this.serviceIsGfycat) {
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
      }
      this.loading = false
    }, 350),
    normalizeResults (data, service) {
      if (service === 'Are.na' && this.serviceIsArena) {
        this.images = data.blocks.map(image => {
          return {
            id: image.id,
            sourcePageUrl: `https://www.are.na/block/${image.id}`,
            sourceUserName: image.user.username,
            previewUrl: image.image.large.url,
            url: image.image.large.url
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
      const element = this.$refs.searchInput
      const length = this.search.length
      element.focus()
      element.setSelectionRange(length, length)
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
      scrollIntoView(element, {
        behavior: 'smooth',
        scrollMode: 'if-needed'
      })
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.scrollIntoView()
          this.focusSearchInput()
          this.search = this.initialSearch
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
    p
      margin-top 0
      padding-bottom 8px

  .image-list
    li
      position relative
      width 100%
      img
        border-radius 3px
    button
      position absolute
      top 6px
      right 10px
</style>
