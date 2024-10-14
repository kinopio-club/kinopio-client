<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import GroupList from '@/components/GroupList.vue'
import AboutGroups from '@/components/AboutGroups.vue'
import UpgradedUserRequired from '@/components/UpgradedUserRequired.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['selectGroup', 'clearGroup', 'closeDialogs'])

const props = defineProps({
  visible: Boolean,
  groups: Array,
  selectedGroup: Object
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
  }
})

const state = reactive({
  dialogHeight: null
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const currentUserIsUpgraded = computed(() => store.state.currentUser.isUpgraded)
const isLoadingGroups = computed(() => store.state.isLoadingGroups)
const upgradeMessage = computed(() => 'to create and manage Groups')

// groups list

const isGroups = computed(() => {
  return Boolean(props.groups.length)
})
const groupsListIsVisible = computed(() => currentUserIsUpgraded.value && isGroups.value)

// select group

const clearGroup = () => {
  emit('clearGroup')
}
const selectGroup = (event, group) => {
  emit('selectGroup', group)
}
</script>

<template lang="pug">
dialog.narrow.group-picker(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section(:class="{ 'title-section': groupsListIsVisible }")
    .row.title-row
      span Add to Group
      button.small-button(v-if="props.selectedGroup" @click.left="clearGroup")
        img.icon.cancel(src="@/assets/add.svg")
        span Clear
    //- loading
    Loader(:visible="isLoadingGroups && !isGroups")
  //- groups list
  section.results-section(v-if="groupsListIsVisible")
    GroupList(:groups="props.groups" :selectedGroup="props.selectedGroup" @selectGroup="selectGroup")
  //- about groups
  AboutGroups(v-else)
  UpgradedUserRequired(:message="upgradeMessage")
</template>

<style lang="stylus">
dialog.group-picker
  overflow auto
</style>
