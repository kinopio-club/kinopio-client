<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick, defineAsyncComponent } from 'vue'
import { useStore } from 'vuex'

import Loader from '@/components/Loader.vue'
import words from '@/data/words.js'
import newSpace from '@/data/new.json'
import cache from '@/cache.js'
import utils from '@/utils.js'
import consts from '@/consts.js'

import { nanoid } from 'nanoid'
import fuzzy from '@/libs/fuzzy.js'
import dayjs from 'dayjs'
import sortBy from 'lodash-es/sortBy'

const User = defineAsyncComponent({
  loader: () => import('@/components/User.vue')
})
const SpaceList = defineAsyncComponent({
  loader: () => import('@/components/SpaceList.vue')
})
const store = useStore()

const dialogElement = ref(null)
const newSpaceNameElement = ref(null)

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    }
  })
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
  shouldShowNewSpace: Boolean
})
watch(() => props.visible, async (value, prevValue) => {
  await nextTick()
  clearState()
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
  newSpaceIsVisible: false,
  newSpaceName: '',
  isLoadingNewSpace: false,
  dialogHeight: null
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const parentDialog = computed(() => 'spacePicker')
const activeUser = computed(() => {
  const currentUser = store.state.currentUser
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
  const currentUser = store.state.currentUser
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
    const isHidden = space.isHidden
    return !space.isHidden
  })
  if (props.search) {
    const filtered = fuzzy.filter(
      props.search,
      spaces,
      {
        pre: '',
        post: '',
        extract: (item) => {
          let name = item.name || ''
          return name
        }
      }
    )
    spaces = filtered.map(item => {
      let result = utils.clone(item.original)
      result.matchIndexes = item.indices
      return result
    })
  }
  return spaces
})
const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])

const handleFocusBeforeFirstItem = () => {
  if (state.newSpaceIsVisible) { return }
  toggleNewSpaceIsVisible()
}
const excludeCurrentSpace = () => {
  if (!props.shouldExcludeCurrentSpace) { return }
  const currentSpace = store.state.currentSpace
  state.spaces = state.spaces.filter(space => space.id !== currentSpace.id)
}
const updateSpaces = () => {
  if (props.userSpaces) {
    state.spaces = props.userSpaces
  } else {
    state.spaces = cache.getAllSpaces()
    updateWithRemoteSpaces()
  }
  excludeCurrentSpace()
}
const updateWithRemoteSpaces = async () => {
  if (!state.spaces.length) {
    state.isLoading = true
  }
  const currentUser = store.state.currentUser
  let spaces = await store.dispatch('api/getUserSpaces')
  spaces = utils.AddCurrentUserIsCollaboratorToSpaces(spaces, currentUser)
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
  store.commit('scrollElementIntoView', { element })
}
const triggerSignUpOrInIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerSignUpOrInIsVisible')
}
const toggleNewSpaceIsVisible = async () => {
  state.newSpaceIsVisible = !state.newSpaceIsVisible
  if (state.newSpaceIsVisible) {
    await nextTick()
    focusNewSpaceNameInput()
  }
}
const createNewSpace = async () => {
  if (state.isLoadingNewSpace) { return }
  if (!state.newSpaceName) {
    state.newSpaceName = words.randomUniqueName()
  }
  const currentUser = store.state.currentUser
  const user = { id: currentUser.id, color: currentUser.color, name: currentUser.name }
  state.isLoadingNewSpace = true
  let space = utils.clone(newSpace)
  space.name = state.newSpaceName
  space.id = nanoid()
  space.url = utils.url({ name: space.name, id: space.id })
  space.userId = user.id
  space.users.push(user)
  space.cards = []
  space.connections = []
  space.connectionTypes = []
  space = utils.newSpaceBackground(space, currentUser)
  space.background = space.background || consts.defaultSpaceBackground
  space = cache.updateIdsInSpace(space)
  console.log('🚚 create new space', space)
  if (currentUserIsSignedIn.value) {
    await store.dispatch('api/createSpace', space)
  }
  state.isLoadingNewSpace = false
  selectSpace(space)
}

const clearState = () => {
  state.newSpaceIsVisible = false
  state.newSpaceName = words.randomUniqueName()
}
const focusNewSpaceNameInput = () => {
  const element = newSpaceNameElement.value
  if (!element) { return }
  element.focus()
  element.setSelectionRange(0, 99999)
}

</script>

<template lang="pug">
dialog.narrow.space-picker(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="{top: dialogPositionTop, 'max-height': state.dialogHeight + 'px'}")
  template(v-if="parentIsCardDetails && !currentUserIsSignedIn")
    section
      p
        span To link to a space,
        span.badge.info you need to Sign Up or In
      button(@click.left.stop="triggerSignUpOrInIsVisible") Sign Up or In
  //- New Space
  section.options(v-if="shouldShowNewSpace")
    .row
      button(@click="toggleNewSpaceIsVisible" :class="{ active: state.newSpaceIsVisible }")
        img.icon(src="@/assets/add.svg")
        span New Space
    template(v-if="state.newSpaceIsVisible")
      .row
        .button-wrap
        input(placeholder="name" ref="newSpaceNameElement" v-model="state.newSpaceName" @keyup.space.prevent @keyup.escape.stop="toggleNewSpaceIsVisible" @keyup.stop @keyup.enter.exact="createNewSpace")
      .row
        button(@click="createNewSpace")
          span Create New Space
          Loader(:visible="state.isLoadingNewSpace")

  //- Type to Search
  section.info-section(v-if="parentIsCardDetails && !search")
    p
      img.icon.search(src="@/assets/search.svg")
      span Type to search spaces {{search}}
  //- Space List
  section.results-section
    Loader(:visible="loading")
    SpaceList(
      v-if="filteredSpaces.length"
      :hideFilter="hideFilter"
      :spaces="filteredSpaces"
      :showUserIfCurrentUserIsCollaborator="showUserIfCurrentUserIsCollaborator"
      :selectedSpace="selectedSpace"
      @selectSpace="selectSpace"
      :search="search"
      @focusBeforeFirstItem="handleFocusBeforeFirstItem"
      :parentDialog="parentDialog"
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
    padding-bottom 5px
    border-top none
</style>
