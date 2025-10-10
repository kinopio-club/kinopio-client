<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useUploadStore } from '@/stores/useUploadStore'

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

const globalStore = useGlobalStore()
const boxStore = useBoxStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()
const uploadStore = useUploadStore()

const searchInputElement = ref(null)
const inputElement = ref(null)
const dialogElement = ref(null)

let unsubscribes

const props = defineProps({
  visible: Boolean,
  space: Object,
  box: Object
})
const emit = defineEmits(['updateSpaces'])

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
  refreshGradients()
  updateDefaultColor()

  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerUploadComplete') {
        const { spaceId, url, cardId } = args[0]
        if (cardId) { return }
        if (spaceId !== props.space?.id) { return }
        updateBackground(url)
      } else if (name === 'triggerUpdateTheme') {
        updateDefaultColor()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDialogHeight)
  unsubscribes()
})

const state = reactive({
  dialogHeight: null,
  colorPickerIsVisible: false,
  urlInputIsVisible: false,
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

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    if (state.service === 'background') {
      state.selectedImages = backgroundImages.value
    }
    state.backgroundTint = props.space?.backgroundTint
    closeDialogs()
    clearErrors()
    // delay fetching community backgrounds to prevent render blocking
    setTimeout(updateCommunityBackgroundImages, 200)
    updateDialogHeight()
  } else {
    if (state.error.isNotImageUrl) {
      removeBackground()
    }
    globalStore.clearNotificationsWithPosition()
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)
const currentUser = computed(() => userStore.getUserAllState)
const currentUserIsMember = computed(() => userStore.getUserIsSpaceMember)
const itemTypeString = computed(() => {
  if (props.space) {
    return 'Space'
  } else {
    return 'Box'
  }
})
const imageListIsSmall = computed(() => Boolean(props.box))
const stretchIsVisible = computed(() => Boolean(props.box))

// dialog

const toggleColorPicker = () => {
  const isVisible = state.colorPickerIsVisible
  closeDialogs()
  state.colorPickerIsVisible = !isVisible
}
const triggerSignUpOrInIsVisible = () => {
  globalStore.closeAllDialogs()
  globalStore.triggerSignUpOrInIsVisible()
}
const closeDialogs = async () => {
  state.colorPickerIsVisible = false
}
const updatePreviewImage = async () => {
  if (props.box) { return }
  await nextTick()
  spaceStore.updateSpacePreviewImage()
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
  globalStore.pinchCounterZoomDecimal = 1
}
const toggleUrlInputIsVisible = () => {
  state.urlInputIsVisible = !state.urlInputIsVisible
}

// background gradients

const refreshGradients = () => {
  const numberOfGradients = 6
  const gradients = []
  times(numberOfGradients, (index) => {
    const gradient = utils.backgroundGradientLayers()
    gradient.id = nanoid()
    gradients.push(gradient)
  })
  if (props.space?.backgroundGradient) {
    gradients[0] = props.space?.backgroundGradient
  }
  state.gradients = gradients
}
const selectGradient = async (index) => {
  const gradient = state.gradients[index]
  const updates = {
    backgroundIsGradient: true,
    backgroundGradient: gradient
  }
  await spaceStore.updateSpace(updates)
  updatePreviewImage()
}
const gradientIsActive = (gradient) => {
  if (!props.space?.backgroundIsGradient) { return }
  return props.space?.backgroundGradient.id === gradient.id
}

// background images list

const isCurrentBackground = (image) => {
  return image.url === background.value
}
const currentBackgroundUrl = computed(() => {
  if (props.space?.backgroundIsGradient) { return }
  return background.value
})
const backgroundImages = computed(() => {
  let images = backgroundImagesJSON
  images = images.filter(image => !image.isArchived)
  if (!consts.isDevelopment()) {
    images = images.filter(image => !image.isDebug)
  }
  return images
})
const updateCommunityBackgroundImages = async () => {
  state.communityBackgroundsIsLoading = true
  if (state.communityBackgroundImages.length) {
    state.communityBackgroundsIsLoading = false
    return
  }
  let images = await apiStore.communityBackgrounds()
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

// update background

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
    if (props.box) {
      return props.box.background
    } else {
      return props.space?.background
    }
  },
  set (url) {
    updateBackground(url)
  }
})
const updateBackground = async (url) => {
  url = url.url || url
  if (url === background.value) {
    return
  }
  if (props.box) {
    const updates = {
      id: props.box.id,
      background: url
    }
    await boxStore.updateBox(updates)
  } else {
    const updates = {
      backgroundIsGradient: false,
      background: url
    }
    await spaceStore.updateSpace(updates)
  }
  updatePreviewImage()
  checkIfImageIsUrl()
}
const removeBackgroundAll = async () => {
  removeBackground()
  removeBackgroundTint()
  updatePreviewImage()
}
const removeBackground = async () => {
  await updateBackground('')
  closeDialogs()
  updatePreviewImage()
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
const uploadFile = async () => {
  clearErrors()
  const spaceId = props.space?.id
  const input = inputElement.value
  const file = input.files[0]
  const userIsUpgraded = userStore.isUpgraded
  const isFileTooBig = utils.isFileTooBig({ file, userIsUpgraded })
  if (isFileTooBig) {
    state.error.sizeLimit = true
    return
  }
  try {
    if (props.box) {
      await uploadStore.uploadFile({ file, boxId: props.box.id })
    } else {
      await uploadStore.uploadFile({ file, spaceId })
    }
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
  const pendingUploads = uploadStore.pendingUploads
  return pendingUploads.find(upload => {
    const isCurrentSpace = upload.spaceId === props.space?.id
    const isInProgress = upload.percentComplete < 100
    return isCurrentSpace && isInProgress
  })
})
const remotePendingUpload = computed(() => {
  const remotePendingUploads = globalStore.remotePendingUploads
  return remotePendingUploads.find(upload => {
    const isInProgress = upload.percentComplete < 100
    const isSpace = upload.spaceId === props.space?.id
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
const updateBackgroundTint = async (value) => {
  state.backgroundTint = value
  if (props.space) {
    await spaceStore.updateSpace({ backgroundTint: value })
    emit('updateSpaces')
    updatePreviewImage()
  }
}
const removeBackgroundTint = async () => {
  await updateBackgroundTint('')
  closeDialogs()
  emit('updateSpaces')
  updatePreviewImage()
}

// recent

const recentImagesFromCacheSpaces = async () => {
  const spaces = await cache.getAllSpaces()
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
const updateService = async (service) => {
  state.service = service
  if (service === 'background') {
    state.selectedImages = backgroundImages.value
  } else if (service === 'recent') {
    const images = await recentImagesFromCacheSpaces()
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
    const defaultSearches = ['animals', 'flowers', 'forest', 'ocean']
    const defaultSearch = sample(defaultSearches)
    const search = state.search || defaultSearch
    const data = await apiStore.imageSearch(search)
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

// stretch

const backgroundIsStretch = computed(() => props.box.backgroundIsStretch)
const toggleBackgroundIsStretch = () => {
  const value = !backgroundIsStretch.value
  const update = {
    id: props.box.id,
    backgroundIsStretch: value
  }
  boxStore.updateBox(update)
}

</script>

<template lang="pug">
dialog.background-picker.wide(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref='dialogElement' :style="{'max-height': state.dialogHeight + 'px'}")
  section.title-section
    .row.title-row
      div
        BackgroundPreview(:space="props.space" :box="props.box")
        span.title Background
      .row
        .button-wrap
          button.small-button(:class="{active: state.urlInputIsVisible}" @click="toggleUrlInputIsVisible")
            span URL
        .button-wrap(v-if="currentUserIsMember")
          button.small-button(@click.left="removeBackgroundAll")
            img.icon.cancel(src="@/assets/add.svg")
            span Clear

  //- url input
  section(@mouseup.stop @touchend.stop)
    .row(v-if="state.urlInputIsVisible")
      input(
        rows="1"
        placeholder="Paste an image URL or upload"
        v-model="background"
        data-type="name"
        maxlength="400"
        :disabled="!currentUserIsMember"
      )
    template(v-if="!currentUserIsMember")
      .row
        span.badge.info
          img.icon.cancel(src="@/assets/add.svg")
          span {{itemTypeString}} is Read Only

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
    template(v-if="currentUserIsMember")
      .row
        //- Tint
        .button-wrap(v-if="!props.box")
          button.change-color(@click.left.stop="toggleColorPicker" :class="{active: state.colorPickerIsVisible}")
            span.current-color(:style="{ background: backgroundTintBadgeColor }")
            span Tint
          ColorPicker(:currentColor="state.backgroundTint || '#fff'" :visible="state.colorPickerIsVisible" @selectedColor="updateBackgroundTint" :removeIsVisible="true" @removeColor="removeBackgroundTint" :shouldLightenColors="true" :luminosityIsLight="true")
        //- Type
        .segmented-buttons
          button(@click.left.stop="updateService('background')" :class="{ active: state.service === 'background'}")
            img.icon.flower(src="@/assets/flower.svg")
          button(@click.left.stop="updateService('pexels')" :class="{ active: serviceIsPexels}")
            img.icon(src="@/assets/search.svg")
          //- button(@click.left.stop="updateService('recent')" :class="{ active: serviceIsRecent}")
          //-   img.icon.time(src="@/assets/time.svg")
        //- Upload
        .button-wrap
          button(@click.left.stop="selectFile")
            span Upload
          input.hidden(type="file" ref="inputElement" @change="uploadFile" accept="image/*")
        //- Stretch
        .button-wrap(v-if="stretchIsVisible")
          label.show-users(title="Stretch Background" :class="{active: backgroundIsStretch}" @click.left.prevent.stop="toggleBackgroundIsStretch" @keydown.stop.enter="toggleBackgroundIsStretch")
            input(type="checkbox" v-model="backgroundIsStretch")
            span Stretch

  //- results
  template(v-if="currentUserIsMember")
    //- backgrounds
    template(v-if="serviceIsBackground")
      //- gradient backgrounds
      section.results-section.title-row(v-if="!props.box")
        ul.results-list.gradients-list
          li.gradient-li(v-for="(gradient, index) in state.gradients" @click="selectGradient(index)" :key="gradient.id" :class="{ active: gradientIsActive(gradient) }")
            SpaceBackgroundGradients(:visible="true" :layers="gradient")
        .right-side-button-wrap(@click="refreshGradients")
          button.small-button
            img.refresh.icon(src="@/assets/refresh.svg")
      //- built-in backgrounds
      section.results-section
        ImageList(:images="state.selectedImages" :activeUrl="currentBackgroundUrl" @selectImage="updateBackground" :isSmall="imageListIsSmall")
      //- community backgrounds
      section.results-section.community-backgrounds-section
        .row.title-row
          p.row-title Community Backgrounds
          a.right-side-button-wrap(target="_blank" href="https://www.are.na/kinopio/community-backgrounds")
            button.small-button
              img.icon.arena(src="@/assets/arena.svg")
        Loader(:visible="state.communityBackgroundsIsLoading")
        ImageList(v-if="!state.communityBackgroundsIsLoading" :images="state.communityBackgroundImages" :activeUrl="background" @selectImage="updateBackground" :isSmall="imageListIsSmall")

    //- recent
    //- template(v-else-if="serviceIsRecent")
    //-   section.results-section
    //-     .row
    //-       p.row-title Recently Used
    //-     ImageList(:images="state.selectedImages" :activeUrl="background" @selectImage="updateBackground" :isSmall="imageListIsSmall")

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
            li(@click.left="updateBackground(image.url)" tabindex="0" v-on:keydown.enter="updateBackground(image.url)" :class="{ active: isCurrentBackground(image)}")
              img(:src="image.previewUrl")
</template>

<style lang="stylus">
dialog.background-picker
  overflow auto
  min-height 400px
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
    padding-right 4px

  .gradients-list
    display flex
    flex-wrap nowrap
    align-items flex-start
    li
      width 40px
      max-width 17%
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
      width 90%
</style>
