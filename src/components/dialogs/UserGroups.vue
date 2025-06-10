<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useGroupStore } from '@/stores/useGroupStore'

import utils from '@/utils.js'
import GroupList from '@/components/GroupList.vue'
import AddGroup from '@/components/dialogs/AddGroup.vue'
import AboutGroups from '@/components/subsections/AboutGroups.vue'
import Loader from '@/components/Loader.vue'

import uniqBy from 'lodash-es/uniqBy'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const groupStore = useGroupStore()

const dialogElement = ref(null)
let unsubscribes

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
  const globalStoreUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerCloseGroupDetailsDialog') {
        state.groupDetailsIsVisibleForGroupId = ''
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

const visible = computed(() => globalStore.groupsIsVisible)
watch(() => visible.value, (value, prevValue) => {
  if (value) {
    globalStore.shouldExplicitlyHideFooter = true
    closeDialogs()
    state.groupDetailsIsVisibleForGroupId = ''
    updateDialogHeight()
  }
})
const updateDialogHeight = async () => {
  if (!visible.value) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const state = reactive({
  dialogHeight: null,
  groupDetailsIsVisibleForGroupId: '',
  addGroupIsVisible: false
})
const closeDialogs = () => {
  state.addGroupIsVisible = false
  state.groupDetailsIsVisibleForGroupId = ''
}

const currentUserIsUpgraded = computed(() => userStore.isUpgraded)
const isLoadingGroups = computed(() => globalStore.isLoadingGroups)

// groups

const groups = computed(() => groupStore.getCurrentUserGroup)

// add group

const toggleAddGroupIsVisible = () => {
  const value = !state.addGroupIsVisible
  closeDialogs()
  state.addGroupIsVisible = value
}

// group details

const groupIsVisible = (group) => {
  return state.groupDetailsIsVisibleForGroupId === group.id
}
const toggleGroupDetailsIsVisible = (event, group) => {
  if (groupIsVisible(group)) {
    state.groupDetailsIsVisibleForGroupId = ''
  } else {
    state.groupDetailsIsVisibleForGroupId = group.id
  }
}
const selectedGroup = computed(() => {
  return { id: state.groupDetailsIsVisibleForGroupId }
})
</script>

<template lang="pug">
dialog.narrow.user-groups(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    .row.title-row
      div
        Loader(:visible="isLoadingGroups" :isSmall="true")
        span Groups
      //- add group
      .button-wrap
        button.small-button(:class="{ active: state.addGroupIsVisible }" @click.stop="toggleAddGroupIsVisible")
          img.icon.add(src="@/assets/add.svg")
          span Group
        AddGroup(:visible="state.addGroupIsVisible" @closeDialogs="closeDialogs")

  //- groups
  template(v-if="groups.length")
    section.results-section
      GroupList(:groups="groups" :selectedGroup="selectedGroup" @selectGroup="toggleGroupDetailsIsVisible" :groupDetailsIsVisibleForGroupId="state.groupDetailsIsVisibleForGroupId")
  //- groups info
  template(v-else)
    AboutGroups
</template>

<style lang="stylus">
dialog.user-groups
  left initial
  right 16px
  top 20px
  .results-section
    overflow initial
  .loader
    vertical-align -2px
    margin-right 4px
</style>
