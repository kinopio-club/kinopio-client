<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'
import UserList from '@/components/UserList.vue'

import uniqBy from 'lodash-es/uniqBy'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})

const props = defineProps({
  visible: Boolean
})

const state = reactive({
  dialogHeight: null
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const currentUserCanEditSpace = computed(() => userStore.getUserCanEditSpace)
const spaceIsOpen = computed(() => spaceStore.getSpaceIsOpen)

// users

const users = computed(() => spaceStore.getSpaceAndGroupMembers)
const selectedUser = computed(() => {
  const userDetailsIsVisible = globalStore.userDetailsIsVisible
  if (!userDetailsIsVisible) { return }
  return globalStore.userDetailsUser
})
const toggleUserDetails = (event, user) => {
  closeDialogs()
  showUserDetails(event, user)
}
const showUserDetails = (event, user) => {
  const shouldHideUserDetails = user.id === globalStore.userDetailsUser?.id
  if (shouldHideUserDetails) {
    closeDialogs()
    globalStore.userDetailsUser = {}
    return
  }
  const element = event.target
  const options = { element, offsetX: 0, shouldIgnoreZoom: true }
  const position = utils.childDialogPositionFromParent(options)
  globalStore.userDetailsUser = user
  globalStore.userDetailsPosition = position
  globalStore.userDetailsIsVisible = true
}
const closeDialogs = () => {
  globalStore.userDetailsIsVisible = false
  state.groupIsVisible = false
}
</script>

<template lang="pug">
dialog.narrow.space-users(
  v-if="props.visible"
  :open="props.visible"
  @click.left.stop="closeDialogs"
  ref="dialogElement"
  :style="{'max-height': state.dialogHeight + 'px'}"
)
  section
    p Users Who Can Edit This Space
    p.badge.success(v-if="spaceIsOpen")
      img.icon.open(src="@/assets/open.svg")
      span Space privacy is Open, so anyone can leave comments
  //- users
  section.results-section(v-if="users.length")
    UserList(
      :users="users"
      :selectedUser="selectedUser"
      @selectUser="toggleUserDetails"
      :showCollaboratorActions="currentUserCanEditSpace"
    )
</template>

<style lang="stylus">
dialog.space-users
  left initial
  right 16px
  top 16px
  .results-section
    border-top 1px solid var(--primary-border)
    padding-top 4px
</style>
