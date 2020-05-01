<template lang="pug">
dialog.image-picker(v-if="visible" :open="visible" @click.stop ref="dialog")
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
          video(v-if="image.isVideo" autoplay loop muted playsinline)
            source(:src="image.url")
          img(v-if="!image.isVideo" :src="image.url")
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
    visible: Boolean
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
  // maxHeight () {
  //   const dialog = this.$refs.dialog
  //   console.log(dialog)
  // }
  //   const favoritesDialog = document.querySelector('dialog.favorites')
  //   let height = 120
  //   if (favoritesDialog) {
  //     const dialogHeight = favoritesDialog.offsetHeight
  //     if (dialogHeight > 250) { height = dialogHeight }
  //   } else {
  //     return undefined
  //   }
  //   return height
  // }
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
          search_text: this.search
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
          console.log(image)
          return {
            id: image.id,
            sourcePageUrl: `https://www.are.na/block/${image.id}`,
            sourceUserName: image.user.username,
            url: image.image.large.url
          }
        })
      } else if (service === 'Gfycat' && this.serviceIsGfycat) {
        this.images = data.gfycats.map(image => {
          console.log(image)
          console.log('size gif mp4', image.gifSize, image.mp4Size, image.mp4Size / image.gifSize * 100, image.miniUrl)
          // console.log('gif vs mp4size ', image.images.downsized.size, image.images.preview.mp4_size)
          // console.log('height and width',image.images.downsized.height, image.images.downsized.width)

          return {
            isVideo: true,
            id: image.gfyId,
            // sourcePageUrl: image.url,
            // sourceUserName: '',
            // url: image.max2mbGif
            url: image.mobileUrl
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
      console.log('🔮selectImage', image)
      // TODO wire up to carddetails
      // if service is unsplash , then send a download req https://help.unsplash.com/en/articles/2511258-guideline-triggering-a-download
      this.$emit('selectImage', image)
    },
    // TODO might have issues w ios, see carddetails ismobile handling
    // TODO2 if copying carddetails, ignore pinchzoom stuff, always zoom/focus
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
    margin-left 2px
    padding-top 4px
    display flex
    .search
      margin-top -11px
      padding-right 5px
      cursor text
    .loader
      width 16px
      height 14px
      margin-right 3px
  // .arena
  //   width 18px
  // .gfycat
  //   height 12px
  // .segmented-button + button
  //   margin-right 6px
  .upload-button
    margin-left 6px

  .results-section
    padding 8px
    padding-top 0
    padding-bottom 0
    p
      margin-top 0
      padding-bottom 8px

  .image-list
    li
      position relative
    button
      position absolute
      top 6px
      right 6px

// .space-picker
//   .results-section
//     padding-top 4px
//     @media(max-height 700px)
//       max-height 40vh

</style>
