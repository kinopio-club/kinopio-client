<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'

import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'
import consts from '@/consts.js'

import { nanoid } from 'nanoid'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()

let unsubscribes

onMounted(() => {
  const globalStoreUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerArenaAuthenticationError') {
        state.error.unknownServerError = true
      }
    }
  )
  unsubscribes = () => {
    globalStoreUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
})

let arena = {}
// arena apps registered to hi@kinopio.club
if (consts.isDevelopment()) {
  arena = {
    clientId: '19f13b17093a5f1c9b227426cbb50571c18ffe50855a7e5f98dafb71f10d71f8',
    redirectUri: 'urn:ietf:wg:oauth:2.0:oob'
  }
} else {
  arena = {
    clientId: 'adadc4aae0148aa84b14c18ce44392a33d1e564996bfcd1cf44d64ca6324c734',
    redirectUri: 'https://kinopio.club/update-arena-access-token'
  }
}

const dialogElement = ref(null)

const emit = defineEmits(['updateSpaces'])

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  channelUrl: '',
  loading: false,
  error: {
    invalidUrl: false,
    channelNotFound: false,
    channelNotFoundName: '',
    unknownServerError: false
  },
  dialogHeight: null
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const arenaAccessToken = computed(() => userStore.arenaAccessToken)
const isAuthenticatingWithArena = computed(() => globalStore.isAuthenticatingWithArena)
const authorizeUrl = computed(() => {
  if (isAuthenticatingWithArena.value) { return }
  return `http://dev.are.na/oauth/authorize?client_id=${arena.clientId}&redirect_uri=${arena.redirectUri}&response_type=code`
})

const forgetArenaAccessToken = () => {
  userStore.updateUser({ arenaAccessToken: '' })
  globalStore.addNotification({ message: 'Removed your Are.na access token from Kinopio', type: 'success' })
}
const importChannel = async () => {
  if (state.loading) { return }
  state.loading = true
  const channelPath = channelPathFromUrl()
  if (!channelPath) {
    state.error.invalidUrl = true
    state.loading = false
    return
  }
  const channel = await getChannelContents(channelPath)
  await createSpace(channel)
  clearForm()
  state.loading = false
  emit('updateSpaces')
}
const clearErrors = () => {
  for (const errorType in state.error) {
    state.error[errorType] = false
  }
}
const clearForm = () => {
  state.channelUrl = ''
  clearErrors()
}
const channelPathFromUrl = () => {
  const urlPattern = new RegExp(/(http[s]?:\/\/)?[^\s(["<,>]*\.[^\s.[",><]+/igm)
  const urls = state.channelUrl.match(urlPattern)
  if (!urls) { return }
  const url = utils.normalizeUrl(urls[0])
  const index = url.lastIndexOf('/') + 1
  return url.slice(index, url.length)
}
const getChannelContents = async (channel) => {
  try {
    const maxBlocks = 100
    const headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' })
    headers.append('Authorization', `Bearer ${arenaAccessToken.value}`)
    const options = {
      method: 'GET',
      headers
    }
    const response = await fetch(`https://api.are.na/v2/channels/${channel}?per=${maxBlocks}&sort=position&direction=desc`, options)
    if (response.status !== 200) {
      throw { response, status: response.status }
    }
    return response.json()
  } catch (error) {
    console.error('🚒', error)
    if (error.status === 404) {
      state.error.channelNotFoundName = channel
      state.error.channelNotFound = true
    } else {
      state.error.unknownServerError = true
    }
    state.loading = false
  }
}
const trimName = (name) => {
  return name.substring(0, consts.cardCharacterLimit)
}
const createSpace = async (channel) => {
  const space = utils.emptySpace(nanoid())
  space.cacheDate = new Date().getTime()
  space.name = channel.title
  const metaCard = {
    id: nanoid(),
    x: 40,
    y: 100,
    z: channel.contents.length + 1,
    name: trimName(state.channelUrl),
    frameId: 2
  }
  space.cards.push(metaCard)
  channel.contents.forEach(block => {
    const currentIndex = space.cards.length
    const lastCard = space.cards[currentIndex - 1]
    const card = createCard(block, { currentIndex, lastCard })
    space.cards.push(card)
  })
  await importSpace(space)
}
const importSpace = async (space) => {
  console.info('🌳 importSpace', space)
  try {
    cache.saveSpace(space)
    await apiStore.createSpace(space)
    spaceStore.changeSpace(space)
    globalStore.addNotification({ message: 'Are.na channel imported', type: 'success' })
    globalStore.closeAllDialogs()
  } catch (error) {
    console.error('🚒 importSpace', error)
  }
}
const createCard = (block, position) => {
  const card = { id: nanoid() }
  const type = block.class
  const title = block.title
  console.info('**', block, type)
  if (type === 'Link') {
    let url = block.image.display.url
    if (!utils.urlIsImage(url)) {
      url = block.image.original.url
    }
    card.name = `${url} ${block.source.url}`
  } else if (type === 'Text') {
    card.name = `${title} – ${block.content}`
  } else if (type === 'Media') {
    card.name = `${title} – ${block.image.original.url}`
  } else if (type === 'Attachment') {
    card.name = block.attachment.url
  } else if (type === 'Channel') {
    card.name = `${title} – https://are.na/${block.owner_slug}/${block.slug}`
  } else if (type === 'Image') {
    card.name = block.image.original.url
  } else {
    card.name = `${title} ${type}`
  }
  card.name = trimName(card.name)
  const { x, y, z } = cardPositions(position)
  card.x = x
  card.y = y
  card.z = z
  return card
}
const cardPositions = ({ currentIndex, lastCard }) => {
  let x, y
  const startX = 40
  const startY = 50
  const cardWidth = 235
  const cardHeight = 235
  const cardMargin = 20
  const viewportWidth = globalStore.viewportWidth - (cardWidth + cardMargin)
  x = startX
  y = startY
  if (lastCard) {
    const currentRow = Math.floor((currentIndex * (cardWidth + cardMargin)) / viewportWidth)
    const lastCardRow = Math.floor(((currentIndex - 1) * (cardWidth + cardMargin)) / viewportWidth)
    x = lastCard.x + cardWidth + cardMargin + startX
    y = ((cardHeight + cardMargin) * currentRow) + startY
    if (lastCardRow !== currentRow) {
      x = startX
    }
  }
  const z = currentIndex
  return { x, y, z }
}
</script>

<template lang="pug">
dialog.import-arena-channel.narrow(v-if="visible" :open="visible" @click.left.stop ref="dialogElement")
  section
    p Import Are.na Channel

  template(v-if="!arenaAccessToken")
    section
      p To import channels you need to connect your Are.na account to Kinopio
      .button-wrap
        a(:href="authorizeUrl")
          button(:class="{active: isAuthenticatingWithArena}")
            img.icon.arena(src="@/assets/arena.svg")
            span Authorize Kinopio
            Loader(:visible="isAuthenticatingWithArena")
      .badge.danger(v-if="error.unknownServerError") (シ_ _)シ Something went wrong, Please try again or contact support

  template(v-if="arenaAccessToken")
    section
      p Make a moodboard from the newest 100 blocks in a channel
      form(@submit.prevent="importChannel")
        .input-wrap
          input(type="url" placeholder="Are.na channel url" required @input="clearErrors" v-model="channelUrl")
          button.borderless.clear-input-wrap(@mouseup.left="clearForm" @touchend="clearForm")
            img.cancel.icon(src="@/assets/add.svg")

        .badge.danger.badge-with-url(v-if="error.invalidUrl") Url should look like
          br
          span https://www.are.na/user/channel-name
        .badge.danger(v-if="error.channelNotFound") Could not find {{error.channelNotFoundName}} on Are.na
        .badge.danger(v-if="error.unknownServerError") Are.na authentication failed, Please try again or contact support

        button(:class="{active: loading}" type="submit")
          img.icon.arena(src="@/assets/arena.svg")
          span Import
          Loader(:visible="loading")

    section
      button(@click.left="forgetArenaAccessToken") Forget Me
</template>

<style lang="stylus">
.import-arena-channel
  .badge
    margin-bottom 10px
  .badge-with-url
    word-break break-all
  .input-wrap
    display flex
  form
    margin-top 10px
</style>
