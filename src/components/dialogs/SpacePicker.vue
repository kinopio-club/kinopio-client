<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'

import User from '@/components/User.vue'
import SpaceList from '@/components/SpaceList.vue'
import Loader from '@/components/Loader.vue'
import newSpace from '@/data/new.json'
import cache from '@/cache.js'
import utils from '@/utils.js'
import consts from '@/consts.js'

import { nanoid } from 'nanoid'
import fuzzy from '@/libs/fuzzy.js'
import dayjs from 'dayjs'
import sortBy from 'lodash-es/sortBy'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['selectSpace'])

const props = defineProps({
  visible: Boolean,
  selectedSpace: Object,
  shouldExcludeCurrentSpace: Boolean,
  userSpaces: Array,
  user: Object,
  loading: Boolean,
  showUserIfCurrentUserIsCollaborator: Boolean,
  parentIsCardDetails: Boolean,
  position: Object,
  search: String,
  cursorPosition: Number,
  showCreateNewSpaceFromSearch: Boolean
})
watch(() => props.visible, async (value, prevValue) => {
  await nextTick()
  if (value) {
    updateDialogHeight()
    updateSpaces()
    scrollIntoView()
    state.isLoading = props.loading
  }
})
watch(() => props.userSpaces, (value, prevValue) => {
  updateSpaces()
}, { deep: true })

const state = reactive({
  isLoading: false,
  spaces: [],
  isLoadingNewSpace: false,
  dialogHeight: null
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const parentDialog = computed(() => 'spacePicker')
const activeUser = computed(() => {
  const currentUser = userStore.getUserAllState
  return props.user || currentUser
})
const hideFilter = computed(() => {
  if (props.parentIsCardDetails) {
    return true
  } else {
    return false
  }
})
const activeUserIsCurrentUser = computed(() => {
  const currentUser = userStore.getUserAllState
  return activeUser.value.id === currentUser.id
})
const dialogPositionTop = computed(() => {
  if (props.position) {
    return props.position.top + 'px'
  } else {
    return undefined
  }
})
const filteredSpaces = computed(() => {
  let spaces = state.spaces
  if (!props.parentIsCardDetails) { return spaces }
  spaces = spaces.filter(space => {
    const isHidden = spaceStore.getSpaceIsHiddenById(space.id)
    return !isHidden
  })
  if (props.search) {
    const filtered = fuzzy.filter(
      props.search,
      spaces,
      {
        pre: '',
        post: '',
        extract: (item) => {
          const name = item.name || ''
          return name
        }
      }
    )
    spaces = filtered.map(item => {
      const result = utils.clone(item.original)
      result.matchIndexes = item.indices
      return result
    })
  }
  return spaces
})
const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)

const excludeCurrentSpace = () => {
  if (!props.shouldExcludeCurrentSpace) { return }
  const currentSpace = spaceStore.getSpaceAllState
  state.spaces = state.spaces.filter(space => space.id !== currentSpace.id)
}
const updateSpaces = async () => {
  if (props.userSpaces) {
    state.spaces = props.userSpaces
  } else {
    state.spaces = await cache.getAllSpaces()
    updateWithRemoteSpaces()
  }
  excludeCurrentSpace()
}
const updateWithRemoteSpaces = async () => {
  if (!state.spaces.length) {
    state.isLoading = true
  }
  const currentUser = userStore.getUserAllState
  let spaces = await apiStore.getUserSpaces()
  spaces = utils.addCurrentUserIsCollaboratorToSpaces(spaces, currentUser)
  state.isLoading = false
  if (!spaces) { return }
  state.spaces = spaces
  excludeCurrentSpace()
}
const selectSpace = (space) => {
  emit('selectSpace', space)
}
const scrollIntoView = () => {
  const element = dialogElement.value
  globalStore.scrollElementIntoView({ element })
}
const triggerSignUpOrInIsVisible = () => {
  globalStore.closeAllDialogs()
  globalStore.triggerSignUpOrInIsVisible()
}
const createNewSpace = async (name) => {
  if (state.isLoadingNewSpace) { return }
  name = name || utils.newSpaceName()
  const currentUser = userStore.getUserAllState
  const user = { id: currentUser.id, color: currentUser.color, name: currentUser.name }
  state.isLoadingNewSpace = true
  try {
    let space = utils.clone(newSpace)
    space.name = name
    space.id = nanoid()
    space.url = utils.url({ name: space.name, id: space.id })
    space.userId = user.id
    space.users.push(user)
    space.cards = []
    space.connections = []
    space.connectionTypes = []
    space = utils.newSpaceBackground(space, currentUser)
    space.background = space.background || consts.defaultSpaceBackground
    space = await cache.updateIdsInSpace(space)
    console.info('🚚 create new space', space)
    selectSpace(space)
    if (currentUserIsSignedIn.value) {
      await apiStore.createSpace(space)
    }
  } catch (error) {
    console.error('🚒 createNewSpace', name, error)
  }
  state.isLoadingNewSpace = false
}

const spaceListIsVisible = computed(() => {
  if (props.parentIsCardDetails) {
    return currentUserIsSignedIn.value
  } else {
    return true
  }
})
</script>

<template lang="pug">
dialog.narrow.space-picker(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="{top: dialogPositionTop, 'max-height': state.dialogHeight + 'px'}")
  template(v-if="parentIsCardDetails && !currentUserIsSignedIn")
    section
      p
        span To link to a space,
        span.badge.info you need to Sign Up or In
      button(@click.left.stop="triggerSignUpOrInIsVisible") Sign Up or In

  //- Type to Search
  section.info-section(v-if="parentIsCardDetails && !search && currentUserIsSignedIn")
    p
      img.icon.search(src="@/assets/search.svg")
      span Type to search spaces {{search}}
  //- Space List
  section.results-section(v-if="spaceListIsVisible")
    Loader(:visible="loading")
    SpaceList(
      v-if="filteredSpaces.length"
      :hideFilter="hideFilter"
      :spaces="filteredSpaces"
      :showUserIfCurrentUserIsCollaborator="showUserIfCurrentUserIsCollaborator"
      :selectedSpace="selectedSpace"
      @selectSpace="selectSpace"
      :search="search"
      :parentDialog="parentDialog"
      :showCreateNewSpaceFromSearch="props.showCreateNewSpaceFromSearch"
      :shouldEmitcreateNewSpace="true"
      @createNewSpace="createNewSpace"
    )
    .error-container(v-if="!filteredSpaces.length && !loading")
      User(:user="activeUser" :isClickable="false" :key="activeUser.id")
      span(v-if="activeUserIsCurrentUser && search") has no spaces matching {{search}}
      span(v-else-if="activeUserIsCurrentUser") has no spaces
      span(v-else) has no public spaces
</template>

<style lang="stylus">
dialog.space-picker
  min-height 150px
  overflow auto
  .title-row
    flex-direction row-reverse
  .results-section
    padding-top 4px
    @media(max-height 700px)
      max-height 50vh
    @media(max-height 400px)
      max-height 40vh
  .error-container
    padding 4px
    display flex
    align-items center
    .user
      margin-right 6px
  .info-section
    padding-bottom 4px
    border-top 0
  section.options
    margin 0
    width 100%
    padding-bottom 0
    border-top none
</style>
