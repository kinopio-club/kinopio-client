<script setup>
import { reactive, computed, onMounted, onUpdated, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
import BackgroundPreview from '@/components/BackgroundPreview.vue'
import ImageList from '@/components/ImageList.vue'
import backgroundImagesJSON from '@/data/backgroundImages.json'
import SpaceBackgroundGradients from '@/components/SpaceBackgroundGradients.vue'
import cache from '@/cache.js'
import consts from '@/consts.js'

import sample from 'lodash-es/sample'
import uniq from 'lodash-es/uniq'
import debounce from 'lodash-es/debounce'
import times from 'lodash-es/times'
import { nanoid } from 'nanoid'
const store = useStore()

const searchInputElement = ref(null)
const inputElement = ref(null)

const props = defineProps({
  visible: Boolean
})
const emit = defineEmits(['updateSpaces'])

onMounted(() => {
  refreshGradients()
  updateDefaultColor()
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerUploadComplete') {
      let { spaceId, url, cardId } = mutation.payload
      if (cardId) { return }
      if (spaceId !== store.state.currentSpace.id) { return }
      updateSpaceBackground(url)
    } else if (mutation.type === 'triggerUpdateTheme') {
      updateDefaultColor()
    }
  })
})

onUpdated(async () => {
  await nextTick()
  if (props.visible) {
    checkIfImageIsUrl()
  }
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    if (state.service === 'background') {
      state.selectedImages = backgroundImages.value
    }
    state.backgroundTint = store.state.currentSpace.backgroundTint
    closeDialogs()
    clearErrors()
    updateCommunityBackgroundImages()
  } else {
    if (state.error.isNotImageUrl) {
      removeBackground()
    }
    store.commit('clearNotificationsWithPosition')
  }
})

const state = reactive({
  colorPickerIsVisible: false,
  spaceBackgroundInputIsVisible: false,
  initialSearch: '',
  error: {
    isNotImageUrl: false,
    signUpToUpload: false,
    userIsOffline: false,
    sizeLimit: false,
    unknownUploadError: false,
    isNoSearchResults: false,
    unknownServerError: false
  },
  backgroundTint: '',
  defaultColor: '#e3e3e3',
  search: '',
  searchIsLoading: false,
  selectedImages: [],
  communityBackgroundsIsLoading: false,
  communityBackgroundImages: [],
  images: [],
  gradients: [],
  service: 'background' // background, recent, pexels
})

const canEditSpace = computed(() => store.getters['currentUser/canEditSpace']())
const currentSpace = computed(() => store.state.currentSpace)
const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])
const currentUser = computed(() => store.state.currentUser)

// dialog

const toggleColorPicker = () => {
  const isVisible = state.colorPickerIsVisible
  closeDialogs()
  state.colorPickerIsVisible = !isVisible
}
const triggerSignUpOrInIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerSignUpOrInIsVisible')
}
const closeDialogs = async () => {
  state.colorPickerIsVisible = false
}
const updatePageSizes = async () => {
  await nextTick()
  store.dispatch('updatePageSizes')
}
const updatePreviewImage = async () => {
  await nextTick()
  store.dispatch('currentSpace/createSpacePreviewImage')
}
const clearErrors = () => {
  state.error.isNotImageUrl = false
  state.error.signUpToUpload = false
  state.error.userIsOffline = false
  state.error.sizeLimit = false
  state.error.unknownUploadError = false
}
const clearSearch = async () => {
  state.search = ''
  state.searchIsLoading = false
  state.images = []
}

// input

const searchInput = computed({
  get () {
    return state.search
  },
  set (newValue) {
    state.search = newValue
    if (newValue) {
      searchService()
    }
  }
})
const focusAndSelectSearchInput = async () => {
  await nextTick()
  if (utils.isMobile()) { return }
  const element = searchInputElement.value
  if (!element) { return }
  element.focus()
  const length = element.value.length
  if (!length) { return }
  element.setSelectionRange(0, length)
}
const resetPinchCounterZoomDecimal = () => {
  store.commit('pinchCounterZoomDecimal', 1)
}

// background gradients

const refreshGradients = () => {
  const numberOfGradients = 6
  let gradients = []
  times(numberOfGradients, (index) => {
    let gradient = utils.backgroundGradientLayers()
    gradient.id = nanoid()
    gradients.push(gradient)
  })
  if (currentSpace.value.backgroundGradient) {
    gradients[0] = currentSpace.value.backgroundGradient
  }
  state.gradients = gradients
}
const selectGradient = (index) => {
  const gradient = state.gradients[index]
  const updates = {
    backgroundIsGradient: true,
    backgroundGradient: gradient
  }
  store.dispatch('currentSpace/updateSpace', updates)
  updatePageSizes()
  updatePreviewImage()
}
const gradientIsActive = (gradient) => {
  if (!currentSpace.value.backgroundIsGradient) { return }
  return currentSpace.value.backgroundGradient.id === gradient.id
}

// background images

const isCurrentSpaceBackground = (image) => {
  return image.url === background.value
}
const checkIfImageIsUrl = () => {
  const url = background.value
  if (!url) {
    state.error.isNotImageUrl = false
  } else if (utils.urlIsImage(url)) {
    state.error.isNotImageUrl = false
  } else {
    state.error.isNotImageUrl = true
  }
}
const background = computed({
  get () {
    return currentSpace.value.background
  },
  set (url) {
    updateSpaceBackground(url)
  }
})
const activeBackgroundUrl = computed(() => {
  if (currentSpace.value.backgroundIsGradient) { return }
  return background.value
})
const backgroundImages = computed(() => {
  let images = backgroundImagesJSON
  images = images.filter(image => !image.isArchived)
  return images
})
const updateSpaceBackground = (url) => {
  url = url.url || url
  const updates = {
    backgroundIsGradient: false,
    background: url
  }
  store.dispatch('currentSpace/updateSpace', updates)
  updatePageSizes()
  updatePreviewImage()
}
const removeBackgroundAll = async () => {
  removeBackground()
  removeBackgroundTint()
  updatePreviewImage()
}
const removeBackground = async () => {
  updateSpaceBackground('')
  closeDialogs()
  updatePreviewImage()
}
const updateCommunityBackgroundImages = async () => {
  state.communityBackgroundsIsLoading = true
  if (state.communityBackgroundImages.length) {
    state.communityBackgroundsIsLoading = false
    return
  }
  let images = await store.dispatch('api/communityBackgrounds')
  images = images.map(image => {
    return {
      url: image.original,
      thumbnailUrl: image.thumb,
      previewUrl: image.preview
    }
  })
  state.communityBackgroundImages = images
  state.communityBackgroundsIsLoading = false
}
const toggleSpaceBackgroundInputIsVisible = () => {
  state.spaceBackgroundInputIsVisible = !state.spaceBackgroundInputIsVisible
}

// upload

const selectFile = (event) => {
  if (!currentUserIsSignedIn.value) {
    state.error.signUpToUpload = true
    return
  }
  const input = inputElement.value
  input.click()
}
const isFileTooBig = (file) => {
  const sizeLimit = 1024 * 1024 * 1.250 // ~1mb
  if (file.size > sizeLimit) {
    return true
  }
}
const uploadFile = async () => {
  clearErrors()
  const spaceId = currentSpace.value.id
  const input = inputElement.value
  const file = input.files[0]
  if (isFileTooBig(file)) {
    state.error.sizeLimit = true
    return
  }
  try {
    await store.dispatch('upload/uploadFile', { file, spaceId })
  } catch (error) {
    console.warn('🚒', error)
    if (error.type === 'sizeLimit') {
      state.error.sizeLimit = true
    } else {
      state.error.unknownUploadError = true
    }
  }
}
const pendingUpload = computed(() => {
  const pendingUploads = store.state.upload.pendingUploads
  return pendingUploads.find(upload => {
    const isCurrentSpace = upload.spaceId === currentSpace.value.id
    const isInProgress = upload.percentComplete < 100
    return isCurrentSpace && isInProgress
  })
})
const remotePendingUpload = computed(() => {
  let remotePendingUploads = store.state.remotePendingUploads
  return remotePendingUploads.find(upload => {
    const isInProgress = upload.percentComplete < 100
    const isSpace = upload.spaceId === currentSpace.value.id
    return isInProgress && isSpace
  })
})

// tint

const updateDefaultColor = () => {
  state.defaultColor = utils.cssVariable('secondary-background')
}
const backgroundTintBadgeColor = computed(() => {
  const emptyColors = ['#fff', '#000', 'rgb(0, 0, 0)', 'rgb(255, 255, 255)']
  if (!state.backgroundTint || emptyColors.includes(state.backgroundTint)) {
    return state.defaultColor
  }
  return state.backgroundTint
})
const updateBackgroundTint = (value) => {
  state.backgroundTint = value
  store.dispatch('currentSpace/updateSpace', { backgroundTint: value })
  updatePageSizes()
  emit('updateSpaces')
  updatePreviewImage()
}
const removeBackgroundTint = async () => {
  updateBackgroundTint('')
  closeDialogs()
  emit('updateSpaces')
  updatePreviewImage()
}

// recent

const recentImagesFromCacheSpaces = () => {
  let spaces = cache.getAllSpaces()
  let images = []
  spaces.forEach(space => {
    if (!space.background) { return }
    images.push(space.background)
  })
  images = uniq(images)
  images = images.map(image => {
    const backgroundImage = backgroundImages.value.find(item => item.url === image)
    if (backgroundImage) {
      return backgroundImage
    }
    return { url: image }
  })
  images = images.filter(image => Boolean(image))
  const max = 30
  images = images.slice(0, max)
  return images
}

// services

const serviceIsPexels = computed(() => state.service === 'pexels')
const serviceIsRecent = computed(() => state.service === 'recent')
const serviceIsBackground = computed(() => state.service === 'background')
const updateService = (service) => {
  state.service = service
  if (service === 'background') {
    state.selectedImages = backgroundImages.value
  } else if (service === 'recent') {
    const images = recentImagesFromCacheSpaces()
    state.selectedImages = images
  } else if (service === 'pexels') {
    searchPexels()
    focusAndSelectSearchInput()
  }
}

// pexels

const searchPexels = async () => {
  state.searchIsLoading = true
  state.error.isNoSearchResults = false
  state.error.unknownServerError = false
  try {
    let url = new URL('https://api.pexels.com/v1/search')
    const headers = new Headers({
      'Authorization': consts.pexelsApiKey
    })
    const defaultSearches = [ 'animals', 'flowers', 'forest', 'ocean' ]
    const defaultSearch = sample(defaultSearches)
    let params = { query: state.search || defaultSearch }
    url.search = new URLSearchParams(params).toString()
    const response = await fetch(url, { method: 'GET', headers })
    const data = await response.json()
    state.images = data.photos.map(image => {
      return {
        id: image.id,
        previewUrl: image.src.tiny,
        url: image.src.large2x
      }
    })
    if (!state.images.length) {
      state.error.isNoSearchResults = true
    }
  } catch (error) {
    console.error('🚒 searchService', error)
    state.error.unknownServerError = true
  }
  state.searchIsLoading = false
}
const searchService = debounce(searchPexels, 350)

</script>

<template lang="pug">
dialog.background-picker.wide(v-if="visible" :open="visible" @click.left.stop="closeDialogs")
  section.title-section
    .row.title-row
      div
        BackgroundPreview(:space="currentSpace")
        span.title Background
      .row
        .button-wrap
          button.small-button(v-if="canEditSpace" :class="{active: state.spaceBackgroundInputIsVisible}" @click="toggleSpaceBackgroundInputIsVisible")
            span URL
        .button-wrap
          button.small-button(v-if="canEditSpace" @click.left="removeBackgroundAll")
            img.icon(src="@/assets/remove.svg")

  section(@mouseup.stop @touchend.stop)
    .row(v-if="canEditSpace && state.spaceBackgroundInputIsVisible")
      input(
        rows="1"
        placeholder="Paste an image URL or upload"
        v-model="background"
        data-type="name"
        maxlength="400"
      )

    template(v-if="!canEditSpace")
      .row
        .large-background-preview
          BackgroundPreview(:space="currentSpace")
      .row
        span.badge.info
          img.icon.cancel(src="@/assets/add.svg")
          span Space is Read Only

    //- upload progress
    .uploading-container(v-if="pendingUpload")
      img(v-if="pendingUpload" :src="pendingUpload.imageDataUrl")
      .badge.info(:class="{absolute : pendingUpload.imageDataUrl}")
        Loader(:visible="true")
        span {{pendingUpload.percentComplete}}%
    //- remote upload progress
    .uploading-container(v-if="remotePendingUpload")
      .badge.info
        Loader(:visible="true")
        span {{remotePendingUpload.percentComplete}}%

    //- errors
    .error-container(v-if="state.error.isNotImageUrl")
      p
        span.badge.danger
          img.icon.cancel(src="@/assets/add.svg")
          span Is not an image URL
    .error-container(v-if="state.error.signUpToUpload")
      p
        span To upload files,
        span.badge.info you need to Sign Up or In
      button(@click.left.stop="triggerSignUpOrInIsVisible") Sign Up or In
    .error-container(v-if="state.error.sizeLimit")
      p
        span.badge.danger
          img.icon.cancel(src="@/assets/add.svg")
          span Too Big
      p
        span Background images should be smaller than 1mb
    .error-container(v-if="state.error.unknownUploadError")
      .badge.danger (シ_ _)シ Something went wrong, Please try again or contact support

    //- buttons
    template(v-if="canEditSpace")
      .row
        //- Tint
        .button-wrap
          button.change-color(@click.left.stop="toggleColorPicker" :class="{active: state.colorPickerIsVisible}")
            span.current-color(:style="{ background: backgroundTintBadgeColor }")
            span Tint
          ColorPicker(:currentColor="state.backgroundTint || '#fff'" :visible="state.colorPickerIsVisible" @selectedColor="updateBackgroundTint" :removeIsVisible="true" @removeColor="removeBackgroundTint" :shouldLightenColors="true")
        //- Type
        .segmented-buttons
          button(@click.left.stop="updateService('background')" :class="{ active: state.service === 'background'}")
            img.icon.flower(src="@/assets/flower.svg")
          button(@click.left.stop="updateService('pexels')" :class="{ active: serviceIsPexels}")
            img.icon(src="@/assets/search.svg")
          button(@click.left.stop="updateService('recent')" :class="{ active: serviceIsRecent}")
            img.icon.time(src="@/assets/time.svg")
        //- Upload
        .button-wrap
          button(@click.left.stop="selectFile")
            span Upload
          input.hidden(type="file" ref="inputElement" @change="uploadFile" accept="image/*")

  //- results
  template(v-if="canEditSpace")
    //- backgrounds
    template(v-if="serviceIsBackground")
      //- gradient backgrounds
      section.results-section.title-row
        ul.results-list.gradients-list
          li.gradient-li(v-for="(gradient, index) in state.gradients" @click="selectGradient(index)" :key="gradient.id" :class="{ active: gradientIsActive(gradient) }")
            SpaceBackgroundGradients(:visible="true" :layers="gradient")
        .right-side-button-wrap(@click="refreshGradients")
          button.small-button
            img.refresh.icon(src="@/assets/refresh.svg")
      //- built-in backgrounds
      section.results-section
        ImageList(:images="state.selectedImages" :activeUrl="activeBackgroundUrl" @selectImage="updateSpaceBackground")
      //- community backgrounds
      section.results-section.community-backgrounds-section
        .row.title-row
          p.row-title Community Backgrounds
          a.right-side-button-wrap(target="_blank" href="https://www.are.na/kinopio/community-backgrounds")
            button.small-button
              img.icon.arena(src="@/assets/arena.svg")
        Loader(:visible="state.communityBackgroundsIsLoading")
        ImageList(v-if="!state.communityBackgroundsIsLoading" :images="state.communityBackgroundImages" :activeUrl="background" @selectImage="updateSpaceBackground")

    //- recent
    template(v-else-if="serviceIsRecent")
      section.results-section
        .row
          p.row-title Recently Used
        ImageList(:images="state.selectedImages" :activeUrl="background" @selectImage="updateSpaceBackground")

    //- search results
    template(v-else-if="serviceIsPexels")
      section.results-section.search-input-wrap
        .search-wrap
          img.icon.search(v-if="!state.searchIsLoading" src="@/assets/search.svg" @click.left="focusSearchInput")
          Loader(:visible="state.searchIsLoading")
          input(
            placeholder="Search Images on Pexels"
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
        .error-container(v-if="state.error.isNoSearchResults")
          .badge.danger Nothing found on Pexels for {{state.search}}
        .error-container(v-if="state.error.unknownServerError")
          .badge.danger (シ_ _)シ Something went wrong, Please try again or contact support
        ul.results-list.image-list
          template(v-for="image in state.images" :key="image.id")
            li(@click.left="updateSpaceBackground(image.url)" tabindex="0" v-on:keydown.enter="updateSpaceBackground(image.url)" :class="{ active: isCurrentSpaceBackground(image)}")
              img(:src="image.previewUrl")
</template>

<style lang="stylus">
dialog.background-picker
  width 255px
  overflow auto
  max-height calc(100vh - 120px) //- todesktop chromium fix
  max-height calc(100dvh - 120px)
  .title-row
    margin-left 0 !important
    .background-preview
      margin-right 6px
      .preview-wrap
        height 19px
        width 19px
  .large-background-preview
    .preview-wrap
      height 100px
      width 100px

  .title
    color var(--primary)
  section
    position relative
  textarea
    margin-bottom 6px
  .error-container
    margin-bottom 10px
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
  .hidden
    display none

  .arrow-up
    position absolute
    width 0
    height 0
    border-left 5px solid transparent
    border-right 5px solid transparent
    border-bottom 6px solid var(--secondary-background)
    top -6px
    left 42px

  @media(max-height 700px)
    .image-picker
      top -50px

  @media(max-width 500px)
    .image-picker
      left -68px

  .input-button-wrap
    margin-top -10px
    margin-right -8px

  .search-wrap
    .loader
      width 13px
      height 14px
      margin-right 3px
      flex-shrink 0
      margin-top 2px
  .results-section
    max-height initial
    .error-container
      margin 0
      margin-left 4px
      margin-bottom 4px
  .current-color
    display inline-block
    margin-right 6px
    vertical-align -1px
  .row-title
    margin-left 4px
  .community-backgrounds-section
    margin-top 10px
  .right-side-button-wrap
    pointer cursor
    padding-right 5px

  .gradients-list
    display flex
    flex-wrap nowrap
    align-items flex-start
    li
      width 40px
      height 40px
      position relative
      padding 3px
      padding-right 2px
      padding-bottom 2px
    .space-background-gradients
      display block
      top 3px
      left 3px
      width calc(100% - 6px)
      height calc(100% - 6px)
      border-radius var(--entity-radius)
      pointer-events all
</style>
