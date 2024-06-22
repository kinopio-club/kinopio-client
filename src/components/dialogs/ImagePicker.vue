<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Loader from '@/components/Loader.vue'
import AIImageGeneration from '@/components/AIImageGeneration.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'
import consts from '@/consts.js'

import debounce from 'lodash-es/debounce'
import sample from 'lodash-es/sample'
const store = useStore()

const dialogElement = ref(null)
const searchInputElement = ref(null)
const inputElement = ref(null)
const resultsSectionElement = ref(null)

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'updatePageSizes') {
      clearHeights()
      updateDialogHeight()
    }
  })
})

const props = defineProps({
  visible: Boolean,
  initialSearch: String,
  cardUrl: String,
  cardId: String,
  removeIsVisible: Boolean
})
watch(() => props.visible, async (value, prevValue) => {
  await nextTick()
  if (value) {
    updateDialogHeight()
    updateServiceFromLastUsedService()
    state.search = state.initialSearch
    searchService()
    focusSearchInput()
    scrollIntoView()
  }
})

const emit = defineEmits(['removeImage', 'selectImage'])

const state = reactive({
  images: [],
  search: '',
  service: 'stickers', // 'stickers', 'gifs', 'pexels', 'ai'
  loading: true,
  dialogHeight: null,
  resultsSectionHeight: null,
  error: {
    unknownServerError: false,
    userIsOffline: false,
    signUpToUpload: false,
    sizeLimit: false,
    unknownUploadError: false
  }
})

const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])
const triggerSignUpOrInIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerSignUpOrInIsVisible')
}
const triggerUpgradeUserIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerUpgradeUserIsVisible')
}

// input

const searchInput = computed({
  get () {
    return state.search
  },
  set (newValue) {
    state.search = newValue
    if (newValue) {
      state.loading = true
      searchService()
    }
  }
})
const placeholder = computed(() => {
  let label = provider.value
  if (label === 'pexels') {
    label = 'images on Pexel'
  }
  return `Search ${utils.capitalizeFirstLetter(label)}`
})
const focusSearchInput = () => {
  if (utils.isMobile()) { return }
  const element = searchInputElement.value
  const length = searchInputElement.value.length
  element.focus()
  element.setSelectionRange(length, length)
  store.commit('triggerUpdateHeaderAndFooterPosition')
}
const clearSearch = () => {
  state.search = ''
  state.loading = false
  state.images = []
  searchService()
}

// services

const provider = computed(() => {
  if (state.service === 'stickers' || state.service === 'gifs') {
    return 'giphy'
  } else {
    return 'pexels'
  }
})
const serviceIsPexels = computed(() => state.service === 'pexels')
const serviceIsStickers = computed(() => state.service === 'stickers')
const serviceIsAI = computed(() => state.service === 'ai')
const serviceIsGifs = computed(() => state.service === 'gifs')
const lastUsedImagePickerService = computed(() => store.state.currentUser.lastUsedImagePickerService)
const toggleServiceIsPexels = () => {
  state.service = 'pexels'
  searchAgain()
  updateLastUsedImagePickerService()
}
const toggleServiceIsAI = () => {
  state.service = 'ai'
  updateLastUsedImagePickerService()
}
const toggleServiceIsStickers = () => {
  state.service = 'stickers'
  searchAgain()
  updateLastUsedImagePickerService()
}
const toggleServiceIsGifs = () => {
  state.service = 'gifs'
  searchAgain()
  updateLastUsedImagePickerService()
}
const updateLastUsedImagePickerService = () => {
  store.dispatch('currentUser/update', { lastUsedImagePickerService: state.service })
}
const updateServiceFromLastUsedService = () => {
  if (!lastUsedImagePickerService.value) { return }
  state.service = lastUsedImagePickerService.value
}

// search

const isNoSearchResults = computed(() => {
  if (state.error.unknownServerError || state.error.userIsOffline) {
    return false
  } else if (state.search && !state.loading && !state.images.length) {
    return true
  } else {
    return false
  }
})
const searchAgain = () => {
  state.images = []
  state.loading = true
  searchService()
}
const searchPexels = async () => {
  const defaultSearches = [ 'animals', 'flowers', 'forest', 'ocean' ]
  const defaultSearch = sample(defaultSearches)
  const search = state.search || defaultSearch
  const data = await store.dispatch('api/imageSearch', search)
  normalizeResults(data, 'pexels')
}
const searchGiphy = async (isStickers) => {
  let resource = 'gifs'
  let endpoint = 'trending'
  if (isStickers) {
    resource = 'stickers'
  }
  if (state.search) {
    endpoint = 'search'
  }
  const body = { search: state.search, endpoint, resource }
  const data = await store.dispatch('api/gifImageSearch', body)
  normalizeResults(data, 'giphy')
}
const searchService = debounce(async () => {
  clearErrors()
  state.loading = true
  const isOffline = !store.state.isOnline
  if (isOffline) {
    state.loading = false
    state.error.userIsOffline = true
    return
  }
  try {
    if (serviceIsPexels.value) {
      await searchPexels()
    } else if (serviceIsStickers.value) {
      const isStickers = true
      await searchGiphy(isStickers)
    } else if (serviceIsGifs.value) {
      await searchGiphy()
    }
  } catch (error) {
    console.error('🚒', error)
    state.images = []
    state.error.unknownServerError = true
  }
  state.loading = false
}, 350)
const normalizeResults = async (data, service) => {
  const pexels = service === 'pexels' && serviceIsPexels.value
  const giphy = service === 'giphy' && (serviceIsStickers.value || serviceIsGifs.value)
  // giphy
  if (pexels) {
    state.images = data.photos.map(image => {
      return {
        id: image.id,
        previewUrl: image.src.tiny,
        url: image.src.large
      }
    })
  } else if (giphy) {
    state.images = data.map(image => {
      // stickers
      if (serviceIsStickers.value) {
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
    await nextTick()
    updateDialogHeight()
    scrollIntoView()
  }
}
const clearErrors = () => {
  state.error.signUpToUpload = false
  state.error.sizeLimit = false
  state.error.unknownServerError = false
  state.error.userIsOffline = false
  state.error.unknownUploadError = false
}

// image

const cardPendingUpload = computed(() => {
  const pendingUploads = store.state.upload.pendingUploads
  return pendingUploads.find(upload => upload.cardId === props.cardId)
})
const removeImage = () => {
  emit('removeImage')
}
const selectImage = (image) => {
  emit('selectImage', image)
}
const isCardUrl = (image) => {
  return props.cardUrl === image.url
}
const selectFile = (event) => {
  clearErrors()
  if (!currentUserIsSignedIn.value) {
    state.error.signUpToUpload = true
    return
  }
  const input = inputElement.value
  input.click()
}

// upload files

const uploadOtherSelectedFiles = (otherSelectedFiles) => {
  if (!otherSelectedFiles.length) { return }
  try {
    const cardId = props.cardId
    const card = store.getters['currentCards/byId'](cardId)
    const positionOffset = 20
    const position = {
      x: card.x + positionOffset,
      y: card.y + positionOffset
    }
    store.dispatch('upload/addCardsAndUploadFiles', {
      files: otherSelectedFiles,
      position
    })
  } catch (error) {
    console.warn('🚒', error)
  }
}
const uploadSelectedFile = async (selectedFile) => {
  const cardId = props.cardId
  try {
    await store.dispatch('upload/uploadFile', { file: selectedFile, cardId })
  } catch (error) {
    console.warn('🚒', error)
    if (error.type === 'sizeLimit') {
      state.error.sizeLimit = true
    } else {
      state.error.unknownUploadError = true
    }
  }
}
const uploadFiles = async () => {
  const input = inputElement.value
  const files = Array.from(input.files)
  const selectedFile = files[0]
  const otherSelectedFiles = files.slice(1)
  uploadOtherSelectedFiles(otherSelectedFiles)
  uploadSelectedFile(selectedFile)
}

// styles

const clearHeights = () => {
  state.dialogHeight = null
  state.resultsSectionHeight = null
}
const scrollIntoView = () => {
  if (!props.visible) { return }
  const element = dialogElement.value
  if (!element) { return }
  utils.scrollIntoView({ element })
  store.commit('triggerUpdateHeaderAndFooterPosition')
}
const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  const dialogHeight = utils.elementHeight(element)
  updateResultsSectionHeight()
}
const updateResultsSectionHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = resultsSectionElement.value
  state.resultsSectionHeight = utils.elementHeight(element, true)
}
const resetPinchCounterZoomDecimal = () => {
  store.commit('pinchCounterZoomDecimal', 1)
}
</script>

<template lang="pug">
dialog.image-picker(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  //- card options
  section
    .row.title-row-flex
      .segmented-buttons
        button(@click.left.stop="toggleServiceIsStickers" :class="{active : serviceIsStickers}" title="stickers")
          img.icon.sticker(src="@/assets/sticker.svg")
        button(@click.left.stop="toggleServiceIsAI" :class="{active : serviceIsAI}" title="AI")
          span AI
        button(@click.left.stop="toggleServiceIsPexels" :class="{active : serviceIsPexels}" title="pexels")
          img.icon(src="@/assets/search.svg")
        button(@click.left.stop="toggleServiceIsGifs" :class="{active : serviceIsGifs}" title="gifs")
          span GIF
      .button-wrap
        button(@click.left.stop="selectFile") Upload
        input.hidden(type="file" ref="inputElement" @change="uploadFiles" multiple="true")

    //- upload progress
    .uploading-container(v-if="cardPendingUpload")
      img(v-if="cardPendingUpload" :src="cardPendingUpload.imageDataUrl")
      .badge.info(:class="{absolute : cardPendingUpload.imageDataUrl}")
        Loader(:visible="true")
        span {{cardPendingUpload.percentComplete}}%
    //- errors
    .error-container-top(v-if="state.error.signUpToUpload")
      p
        span To upload files,
        span.badge.info
          span you need to Sign Up or In
      button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
    .error-container-top(v-if="state.error.sizeLimit")
      p
        span.badge.danger
          img.icon.cancel(src="@/assets/add.svg")
          span Too Big
      p
        span To upload files over 5mb,
        span.badge.info upgrade for unlimited
      button(@click.left="triggerUpgradeUserIsVisible") Upgrade for Unlimited
    .error-container-top(v-if="state.error.unknownUploadError")
      .badge.danger
        span (シ_ _)シ Something went wrong, Please try again or contact support

  AIImageGeneration(@selectImage="selectImage" :visible="serviceIsAI" :initialPrompt="state.search" :cardUrl="cardUrl" @updateDialogHeight="updateDialogHeight")
    //-
  template(v-if="!serviceIsAI")
    //- search box
    section.results-section.search-input-wrap
      .search-wrap
        img.icon.search(v-if="!state.loading" src="@/assets/search.svg" @click.left="focusSearchInput")
        Loader(:visible="state.loading")
        input(
          :placeholder="placeholder"
          v-model="searchInput"
          ref="searchInputElement"
          @focus="resetPinchCounterZoomDecimal"
          @keyup.stop.backspace
          @keyup.stop.enter
          @mouseup.stop
          @touchend.stop
        )
        button.borderless.clear-input-wrap(@click.left="clearSearch")
          img.icon.cancel(src="@/assets/add.svg")
      .error-container(v-if="isNoSearchResults || state.error.unknownServerError || state.error.userIsOffline")
        p(v-if="isNoSearchResults") Nothing found on {{service}} for {{search}}
        .badge.danger(v-if="state.error.unknownServerError")
          span (シ_ _)シ Something went wrong, Please try again or contact support
        .badge.danger(v-if="state.error.userIsOffline")
          span Can't search {{service}} while offline, Please try again later

    //- search results
    section.results-section.search-results(ref="resultsSectionElement" :style="{'max-height': state.resultsSectionHeight + 'px'}")
      ul.results-list.image-list
        template(v-for="image in state.images" :key="image.id")
          li(@click.left="selectImage(image)" tabindex="0" v-on:keydown.enter="selectImage(image)" :class="{ active: isCardUrl(image)}")
            img(:src="image.previewUrl")
            a(v-if="image.sourcePageUrl" :href="image.sourcePageUrl" target="_blank" @click.left.stop)
              button.small-button
                span(v-if="image.sourceName") {{image.sourceName}}{{' '}}
                img.icon.visit(src="@/assets/visit.svg")
</template>

<style lang="stylus">
dialog.image-picker
  min-height 200px
  max-height 70vh
  overflow auto
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
      border-radius var(--small-entity-radius)
    .badge
      display inline-block
      &.absolute
        position absolute
        top 6px
        left 6px

  .sticker
    vertical-align -2px

  .search-results
    min-height 200px

</style>
