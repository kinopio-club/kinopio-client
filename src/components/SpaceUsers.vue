<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick, defineAsyncComponent } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'

import uniqBy from 'lodash-es/uniqBy'
const User = defineAsyncComponent({
  loader: () => import('@/components/User.vue')
})
const store = useStore()

const props = defineProps({
  userDetailsIsInline: Boolean
})

const isEmbedMode = computed(() => store.state.isEmbedMode)
const isAddPage = computed(() => store.state.isAddPage)
const currentUser = computed(() => store.state.currentUser)
const currentSpace = computed(() => store.state.currentSpace)
const currentUserIsSpaceMember = computed(() => store.getters['currentUser/isSpaceMember']())

const members = computed(() => currentSpace.value.users)
const users = computed(() => {
  let users = utils.clone(currentSpace.value.users)
  return users.filter(user => user.id !== currentUser.value.id)
})
const collaborators = computed(() => {
  let collaborators = currentSpace.value.collaborators
  return collaborators.filter(user => user.id !== currentUser.value.id)
})
const spectators = computed(() => {
  let spectators = currentSpace.value.spectators
  spectators = spectators.filter(user => user.id !== currentUser.value.id)
  spectators = uniqBy(spectators, 'id')
  return spectators
})
</script>

<template lang="pug">
//- Add Page
.space-users(v-if="isAddPage")
  .users
    User(:user="currentUser" :isClickable="true" :detailsOnRight="true" :key="currentUser.id" :shouldCloseAllDialogs="true" tabindex="0" :userDetailsIsInline="userDetailsIsInline")
//- Embed
.space-users(v-else-if="isEmbedMode")
  .users
    User(v-for="user in members" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0" :userDetailsIsInline="userDetailsIsInline")

//- Space
.space-users(v-else)
  //- spectators
  .users.spectators(v-if="spectators.length")
    User(v-for="user in spectators" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0" :userDetailsIsInline="userDetailsIsInline")
    User(v-if="!currentUserIsSpaceMember" :user="currentUser" :isClickable="true" :detailsOnRight="true" :key="currentUser.id" :shouldCloseAllDialogs="true" tabindex="0" :userDetailsIsInline="userDetailsIsInline")
  //- collaborators, members, you
  .users
    User(v-for="user in collaborators" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0" :userDetailsIsInline="userDetailsIsInline")
    User(v-for="user in users" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0" :userDetailsIsInline="userDetailsIsInline")
    User(v-if="currentUserIsSpaceMember" :user="currentUser" :isClickable="true" :detailsOnRight="true" :key="currentUser.id" :shouldCloseAllDialogs="true" tabindex="0" :userDetailsIsInline="userDetailsIsInline")
</template>

<style lang="stylus">
.space-users
  display flex
  > .users
    padding-right 6px
    max-width 40vw
    display flex
    flex-wrap wrap
    justify-content flex-end
    align-content flex-start
</style>
