<template lang="pug">
dialog.image-picker(v-if="visible" :open="visible" @click.stop ref="dialog")
  section
    .row
      .segmented-buttons
        button(@click.stop="toggleServiceIsArena" :class="{active : serviceIsArena}")
          //- img.icon.arena(src="@/assets/arena.svg")
          span Are.na
        button(@click.stop="toggleServiceIsGiphy" :class="{active : serviceIsGiphy}")
          //- img.icon.giphy(src="@/assets/giphy.svg")
          span Giphy
        //- button
        //-   span Unsplash
          // dont do if it's the only service that needs a server proxy to use
      //- button.upload-button Upload

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

    p(v-if="isNoSearchResults") Nothing found on {{service}} for {{search}}
    ul.results-list.image-list
      template(v-for="(image in images")
        li(@click="selectImage(image)" tabindex="0" v-on:keyup.enter="selectImage(image)")
          img(:src="image.url")
          a(:href="image.sourcePageUrl" target="_blank" @click.stop)
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
    serviceIsGiphy () {
      if (this.service === 'Giphy') {
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
    toggleServiceIsArena () { this.service = 'Are.na' },
    toggleServiceIsGiphy () { this.service = 'Giphy' },
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
      } else if (this.serviceIsGiphy) {
        console.log('Giphy', this.search)
      }
      this.loading = false
    }, 250),
    normalizeResults (data, service) {
      console.log(service, this.service)
      if (service === 'Are.na' && this.service === service) {
        this.images = data.blocks.map(image => {
          return {
            sourcePageUrl: `https://www.are.na/block/${image.id}`,
            sourceUserName: image.user.username,
            url: image.image.large.url
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
          // this.updateSpaces()
          this.scrollIntoView()
          this.focusSearchInput()
        }
      })
    }
    // userSpaces (userSpaces) {
    //   this.updateSpaces()
    // }
  }
}
</script>

<style lang="stylus">
.image-picker
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
  // .giphy
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
