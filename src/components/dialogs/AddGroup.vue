<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useGroupStore } from '@/stores/useGroupStore'

import utils from '@/utils.js'
import GroupLabel from '@/components/GroupLabel.vue'
import Loader from '@/components/Loader.vue'
import UpgradedUserRequired from '@/components/UpgradedUserRequired.vue'
import GroupDetailsInfo from '@/components/GroupDetailsInfo.vue'

import randomColor from 'randomcolor'

const userStore = useUserStore()
const spaceStore = useSpaceStore()
const groupStore = useGroupStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['closeDialogs'])

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  dialogHeight: null,
  group: {
    name: 'Group Name',
    color: randomColor(),
    emoji: null
  },
  loading: {
    createGroup: false
  },
  error: {
    missingName: false,
    unknownServerError: false
  }
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

const closeDialogs = () => {
  // globalStore.triggerCloseChildDialogs()
}
const clearErrors = () => {
  state.error.missingName = false
  state.error.unknownServerError = false
}

// upgrade user required

const currentUserIsUpgraded = computed(() => userStore.isUpgraded)
const upgradeMessage = computed(() => 'to create and manage Groups')

// group

const updateGroup = (updates) => {
  const keys = Object.keys(updates)
  keys.forEach(key => {
    state.group[key] = updates[key]
  })
// apply update keys to state.group
}
const createGroup = async () => {
  if (state.loading.createGroup) { return }
  clearErrors()
  if (!state.group.name) {
    state.error.missingName = true
    return
  }
  try {
    state.loading.createGroup = true
    groupStore.createGroup(state.group)
    emit('closeDialogs')
  } catch (error) {
    console.error('🚒 createGroup', error)
    state.unknownServerError = true
  }
  state.loading.createGroup = false
}

</script>

<template lang="pug">
dialog.narrow.add-group(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  UpgradedUserRequired(:message="upgradeMessage")
  section(v-if="currentUserIsUpgraded")
    GroupDetailsInfo(:group="state.group" @updateGroup="updateGroup")
    .row
      button(:class="{ active: state.loading.createGroup }" @click.stop="createGroup")
        img.icon.add(src="@/assets/add.svg")
        GroupLabel(:group="state.group")
        span Create Group
        Loader(:visible="state.loading.createGroup")
    //- errors
    .row(v-if="state.error.missingName")
      .badge.danger Group name missing
    .row(v-if="state.unknownServerError")
      .badge.danger (シ_ _)シ Something went wrong, Please try again or contact support

</template>

<style lang="stylus">
dialog.add-group
  left initial
  right 8px
</style>
