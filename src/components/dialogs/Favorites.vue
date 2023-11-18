<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Loader from '@/components/Loader.vue'
import SpaceList from '@/components/SpaceList.vue'
import UserList from '@/components/UserList.vue'
import utils from '@/utils.js'
const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    }
  })
})

const props = defineProps({
  visible: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    closeDialogs()
    updateFavorites()
    updateDialogHeight()
  } else {
    updateFavoriteSpaceIsEdited()
  }
})

const state = reactive({
  spacesIsVisible: true,
  userDetailsPosition: {}
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const userDetailsIsVisible = computed(() => store.state.userDetailsIsVisible)
const userDetailsSelectedUser = computed(() => {
  if (!userDetailsIsVisible.value) { return }
  return store.state.userDetailsUser
})
const currentUser = computed(() => store.state.currentUser)
const favoriteUsers = computed(() => store.state.currentUser.favoriteUsers)
const favoriteSpaces = computed(() => store.state.currentUser.favoriteSpaces)
const loading = computed(() => store.state.isLoadingFavorites)
const isEmpty = computed(() => {
  const noSpaces = state.spacesIsVisible && !favoriteSpaces.value.length
  const noPeople = !state.spacesIsVisible && !favoriteUsers.value.length
  if (noSpaces || noPeople) { return true }
  return false
})
const favoriteSpacesOrderedByEdited = computed(() => {
  let spaces = utils.clone(favoriteSpaces.value)
  spaces = spaces.map(space => {
    space.editedAt = space.editedAt || space.updatedAt || space.createdAt
    space.editedAt = new Date(space.editedAt)
    return space
  })
  spaces = spaces.sort((a, b) => b.editedAt - a.editedAt)
  return spaces
})

const showSpaces = () => {
  state.spacesIsVisible = true
  closeDialogs()
  updateDialogHeight()
}
const hideSpaces = () => {
  state.spacesIsVisible = false
  closeDialogs()
  updateDialogHeight()
}
const changeSpace = (space) => {
  const spaceUser = space.user || space.users[0]
  const isSpaceUser = spaceUser.id === currentUser.value.id
  const isNotSignedIn = !store.getters['currentUser/isSignedIn']
  if (isSpaceUser && isNotSignedIn) {
    store.dispatch('currentSpace/changeSpace', space)
  } else {
    store.dispatch('currentSpace/changeSpace', space)
  }
}
const toggleUserDetails = (event, user) => {
  closeDialogs()
  showUserDetails(event, user)
}
const showUserDetails = async (event, user) => {
  let element = event.target
  let options = { element, shouldIgnoreZoom: true }
  let position = utils.childDialogPositionFromParent(options)
  store.commit('userDetailsUser', user)
  store.commit('userDetailsPosition', position)
  store.commit('userDetailsIsVisible', true)
  // offset position
  await nextTick()
  const child = document.querySelector('.user-details')
  const rect = child.getBoundingClientRect()
  options = { element, offsetX: 100, offsetY: -(rect.height + 8), shouldIgnoreZoom: true }
  position = utils.childDialogPositionFromParent(options)
  const userDetailsDialogWidth = 225
  position.x = position.x - userDetailsDialogWidth
  store.commit('userDetailsPosition', position)
}
const closeDialogs = () => {
  store.commit('userDetailsIsVisible', false)
}
const updateFavorites = async () => {
  await store.dispatch('currentUser/restoreUserFavorites')
}
const updateFavoriteSpaceIsEdited = () => {
  const spaces = favoriteSpaces.value.filter(space => space.isEdited)
  if (!spaces.length) { return }
  spaces.forEach(space => {
    store.commit('currentUser/updateFavoriteSpaceIsEdited', space.id)
  })
  store.dispatch('api/addToQueue', {
    name: 'updateUserVisitSpaces',
    body: spaces
  })
}

</script>

<template lang="pug">
dialog.narrow.favorites(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    .row
      .segmented-buttons
        button(@click.left.stop="showSpaces" :class="{ active: state.spacesIsVisible }")
          span Spaces
          Loader(:visible="loading")
        button(@click.left.stop="hideSpaces" :class="{ active: !state.spacesIsVisible }")
          span People
          Loader(:visible="loading")

    template(v-if="isEmpty")
      p Spaces and people you {{' '}}
        img.icon(src="@/assets/heart.svg")
        span can be found here.
      p
        img.icon(src="@/assets/heart.svg")
        span Spaces to know when they've been updated

      p(v-if="loading")
        Loader(:visible="loading")

  section.results-section(v-if="!isEmpty && visible")
    //- Spaces
    div(v-show="state.spacesIsVisible")
      SpaceList(:spaces="favoriteSpacesOrderedByEdited" :showUser="true" @selectSpace="changeSpace")
    //- People
    div(v-show="!state.spacesIsVisible")
      UserList(:users="favoriteUsers" :selectedUser="userDetailsSelectedUser" @selectUser="toggleUserDetails" :isClickable="true")
</template>

<style lang="stylus">
dialog.favorites
  left initial
  right 8px
  .user-details
    left 50%
</style>
