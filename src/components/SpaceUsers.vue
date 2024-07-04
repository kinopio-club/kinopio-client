<script setup>
import { reactive, computed, onMounted, onUnmounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick, defineAsyncComponent } from 'vue'
import { useStore } from 'vuex'

import User from '@/components/User.vue'
import SpaceUsersButton from '@/components/SpaceUsersButton.vue'
import utils from '@/utils.js'

import uniqBy from 'lodash-es/uniqBy'

const store = useStore()

const spaceUsersElement = ref(null)

const avatarWidth = 28

onMounted(() => {
  window.addEventListener('resize', updateMembersShouldShowUsersButton)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateMembersShouldShowUsersButton)
})

const props = defineProps({
  userDetailsIsInline: Boolean
})
const state = reactive({
  embersShouldShowUsersButton: false
})

const isEmbedMode = computed(() => store.state.isEmbedMode)
const isAddPage = computed(() => store.state.isAddPage)
const currentUser = computed(() => store.state.currentUser)
const currentSpace = computed(() => store.state.currentSpace)
const currentUserIsSpaceMember = computed(() => store.getters['currentUser/isSpaceMember']())

// members

const members = computed(() => currentSpace.value.users)
const users = computed(() => {
  let users = utils.clone(currentSpace.value.users)
  return users.filter(user => user.id !== currentUser.value.id)
})
const collaborators = computed(() => {
  let collaborators = currentSpace.value.collaborators
  return collaborators.filter(user => user.id !== currentUser.value.id)
})
watch(() => users.value, (value, prevValue) => {
  updateMembersShouldShowUsersButton()
})
watch(() => collaborators.value, (value, prevValue) => {
  updateMembersShouldShowUsersButton()
})

// non-members

const spectators = computed(() => {
  let spectators = currentSpace.value.spectators
  spectators = spectators.filter(user => user.id !== currentUser.value.id)
  spectators = uniqBy(spectators, 'id')
  return spectators
})

// const membersLength = computed(() => {
//   const items = members.value.concat(collaborators.value)
//   return items.length
// })
// const spectatorsLength = computed(() => {
//   const items = spectators.value
//   let length = items.length
//   if (!currentUserIsSpaceMember.value) {
//     length += 1
//   }
//   return length
// })

// spectators / collaborators / users / currentuser

// handle too many users

// numberOfUsers * avatarWidth)/pageWidth
const updateMembersShouldShowUsersButton = () => {
  // const viewportWidth = store.state.viewportWidth
  const viewportWidth = utils.visualViewport().width
  // const element = spaceUsersElement.value
  // const usersWidth = element.getBoundingClientRect().width
  const rightElementWrap = document.querySelector('header nav .right')
  const rightSideWidth = rightElementWrap.getBoundingClientRect().width
  const leftElementWrap = document.querySelector('header nav .left')
  const leftSideWidth = leftElementWrap.getBoundingClientRect().width
  const availableWidth = viewportWidth - leftSideWidth - rightSideWidth
  const minAvailableWidth = viewportWidth / 4
  if (availableWidth < minAvailableWidth) {
    state.embersShouldShowUsersButton = true
    console.error(viewportWidth, availableWidth, minAvailableWidth, state.embersShouldShowUsersButton)
  } else {
    state.embersShouldShowUsersButton = false
  }
}
// const shouldShowSpaceUsersButton = computed(() => {
//   const viewportWidth = store.state.viewportWidth
//   return true
// })
</script>

<template lang="pug">
//- Add Page
.space-users.add-page-user(v-if="isAddPage")
  .users
    User(:user="currentUser" :isClickable="true" :detailsOnRight="true" :key="currentUser.id" :shouldCloseAllDialogs="true" tabindex="0" :userDetailsIsInline="userDetailsIsInline")
//- Embed
.space-users.embed-users(v-else-if="isEmbedMode")
  .users
    User(v-for="user in members" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0" :userDetailsIsInline="userDetailsIsInline")

//- Space
.space-users(v-else ref="spaceUsersElement")
  //- spectators
  .users.spectators(v-if="spectators.length || !currentUserIsSpaceMember")
    User(v-for="user in spectators" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0" :userDetailsIsInline="userDetailsIsInline")
    User(v-if="!currentUserIsSpaceMember" :user="currentUser" :isClickable="true" :detailsOnRight="true" :key="currentUser.id" :shouldCloseAllDialogs="true" tabindex="0" :userDetailsIsInline="userDetailsIsInline")
  //- collaborators, members, you
  .users
    User(v-for="user in collaborators" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0" :userDetailsIsInline="userDetailsIsInline")
    User(v-for="user in users" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0" :userDetailsIsInline="userDetailsIsInline")
    User(v-if="currentUserIsSpaceMember" :user="currentUser" :isClickable="true" :detailsOnRight="true" :key="currentUser.id" :shouldCloseAllDialogs="true" tabindex="0" :userDetailsIsInline="userDetailsIsInline")
    //- TODO v-if shouldShowSpaceUsersButton
    SpaceUsersButton
</template>

<style lang="stylus">
.space-users
  display flex
  width 100%
  flex-shrink 1
  margin-left 6px
  > .users
    padding-right 6px
    display flex
    flex-wrap wrap
    justify-content flex-end
    align-content flex-start
</style>
