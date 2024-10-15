<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import GroupList from '@/components/GroupList.vue'
import AboutGroups from '@/components/subsections/AboutGroups.vue'
import Loader from '@/components/Loader.vue'
import AddGroup from '@/components/dialogs/AddGroup.vue'
import utils from '@/utils.js'

const store = useStore()

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
  }
})

const state = reactive({
  dialogHeight: null,
  addGroupIsVisible: false
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const currentUserIsUpgraded = computed(() => store.state.currentUser.isUpgraded)
const isLoadingGroups = computed(() => store.state.isLoadingGroups)

// groups list

const isGroups = computed(() => {
  return Boolean(props.groups.length)
})
const groupsListIsVisible = computed(() => currentUserIsUpgraded.value && isGroups.value)

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

</script>

<template lang="pug">
dialog.narrow.add-to-group(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}" :class="{'overflow-auto': !childDialogIsVisible}")
  section(:class="{ 'title-section': groupsListIsVisible }")
    .row.title-row
      span Add to Group
      .button-wrap
        button.small-button(:class="{ active: state.addGroupIsVisible }" @click.stop="toggleAddGroupIsVisible")
          img.icon.add(src="@/assets/add.svg")
          span Group
        AddGroup(:visible="state.addGroupIsVisible" @closeDialogs="closeDialogs")
    //- loading
    Loader(:visible="isLoadingGroups && !isGroups")
  //- groups list
  section.results-section(v-if="groupsListIsVisible")
    GroupList(:groups="props.groups" :selectedGroup="props.selectedGroup" @selectGroup="selectGroup")
  //- about groups
  AboutGroups(v-else)
</template>

<style lang="stylus">
// dialog.add-to-group
</style>
