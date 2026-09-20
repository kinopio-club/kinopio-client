<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useGroupStore } from '@/stores/useGroupStore'

import utils from '@/utils.js'
import UserList from '@/components/UserList.vue'
import GroupLabel from '@/components/GroupLabel.vue'
import GroupDetails from '@/components/dialogs/GroupDetails.vue'

import uniqBy from 'lodash-es/uniqBy'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const groupStore = useGroupStore()

const dialogElement = ref(null)
let unsubscribes

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'closeAllDialogs' || name === 'triggerCloseGroupDetailsDialog') {
        closeDialogs()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDialogHeight)
  if (unsubscribes) {
    unsubscribes()
  }
})

const props = defineProps({
  visible: Boolean
})

const state = reactive({
  dialogHeight: null,
  currentGroupId: ''
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

const contributors = computed(() => globalStore.getOtherUsers)
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
  state.currentGroupId = ''
}

// groups

const spaceGroups = computed(() => groupStore.getCurrentSpaceGroups)
const toggleGroupDetails = (group) => {
  if (state.currentGroupId === group.id) {
    state.currentGroupId = ''
  } else {
    state.currentGroupId = group.id
  }
}
const groupDetailsIsVisible = (group) => {
  return group.id === state.currentGroupId
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
  section.title-section
    p Space Users
    p.badge.success(v-if="spaceIsOpen")
      img.icon.open(src="@/assets/comment.svg")
      span Space privacy is Open, so anyone can leave comments
  //- users
  section.results-section(v-if="users.length")
    UserList(
      :users="users"
      :selectedUsers="[selectedUser]"
      @selectUser="toggleUserDetails"
      :showCollaboratorActions="currentUserCanEditSpace"
    )
  //- groups
  section(v-if="spaceGroups.length")
    .row.group-row
      .button-wrap(v-for="group in spaceGroups" :key="group.id" @click.stop)
        GroupLabel(
          :group="group"
          :showName="true"
          :isButton="true"
          :isActive="groupDetailsIsVisible(group)"
          @selectGroup="toggleGroupDetails"
        )
        GroupDetails(:visible="groupDetailsIsVisible(group)" :group="group")

  section.title-section(v-if="contributors.length")
    p
      img.icon.open(src="@/assets/open.svg")
      span Outside contributors
  section.results-section(v-if="contributors.length")
    UserList(
      :users="contributors"
      :selectedUsers="[selectedUser]"
      @selectUser="toggleUserDetails"
      :shouldHideOptionsButton="true"
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
  .group-row
    flex-wrap wrap
    gap 4px
    > .button-wrap
      margin 0
      > .group-label
        > .badge
          margin 0
</style>
