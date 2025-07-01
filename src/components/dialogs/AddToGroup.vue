<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

import GroupList from '@/components/GroupList.vue'
import AboutGroups from '@/components/subsections/AboutGroups.vue'
import Loader from '@/components/Loader.vue'
import AddGroup from '@/components/dialogs/AddGroup.vue'
import utils from '@/utils.js'

const globalStore = useGlobalStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['selectGroup', 'closeDialogs'])

const props = defineProps({
  visible: Boolean,
  groups: Array,
  selectedGroup: Object
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
    state.addGroupIsVisible = false
  }
})

const state = reactive({
  dialogHeight: null,
  addGroupIsVisible: false
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const isLoadingGroups = computed(() => globalStore.isLoadingGroups)

// select group

const selectGroup = (event, group) => {
  emit('selectGroup', group)
}

// child dialogs

const childDialogIsVisible = computed(() => {
  return state.addGroupIsVisible
})
const closeDialogs = () => {
  state.addGroupIsVisible = false
}
const toggleAddGroupIsVisible = () => {
  const value = !state.addGroupIsVisible
  closeDialogs()
  state.addGroupIsVisible = value
}
const toggleGroupsIsVisible = () => {
  globalStore.closeAllDialogs()
  globalStore.groupsIsVisible = true
}
</script>

<template lang="pug">
dialog.narrow.add-to-group(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}" :class="{'overflow-auto': !childDialogIsVisible}")
  section
    .row
      Loader(:visible="isLoadingGroups" :isSmall="true")
      span Add to Group
    .row
      .button-wrap
        button.small-button(@click.stop="toggleGroupsIsVisible")
          img.icon.group(src="@/assets/group.svg")
          span My Groups
      .button-wrap
        button.small-button(:class="{ active: state.addGroupIsVisible }" @click.stop="toggleAddGroupIsVisible")
          img.icon.add(src="@/assets/add.svg")
          span New
        AddGroup(:visible="state.addGroupIsVisible" @closeDialogs="closeDialogs")
  //- groups list
  section.results-section.results-section-border-top(v-if="props.groups.length")
    GroupList(:groups="props.groups" :selectedGroup="props.selectedGroup" @selectGroup="selectGroup")
  //- about groups
  AboutGroups(v-else)
</template>

<style lang="stylus">
dialog.add-to-group
  .loader
    vertical-align -2px
    margin-right 4px

</style>
