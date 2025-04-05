<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import GroupList from '@/components/GroupList.vue'
import AddGroup from '@/components/dialogs/AddGroup.vue'
import AboutGroups from '@/components/subsections/AboutGroups.vue'
import Loader from '@/components/Loader.vue'

import uniqBy from 'lodash-es/uniqBy'

const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
  store.subscribe(mutation => {
    if (mutation.type === 'triggerCloseGroupDetailsDialog') {
      state.groupDetailsIsVisibleForGroupId = ''
    }
  })
})

const visible = computed(() => store.state.groupsIsVisible)
watch(() => visible.value, (value, prevValue) => {
  if (value) {
    store.commit('shouldExplicitlyHideFooter', true)
    closeDialogs()
    state.groupDetailsIsVisibleForGroupId = ''
    updateDialogHeight()
  }
})
const updateDialogHeight = async () => {
  if (!visible.value) { return }
  await nextTick()
  let element = dialogElement.value
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

const currentUserIsUpgraded = computed(() => store.state.currentUser.isUpgraded)
const isLoadingGroups = computed(() => store.state.isLoadingGroups)

// groups

const groups = computed(() => store.getters['groups/byUser']())

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
dialog.narrow.groups(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
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
dialog.groups
  left initial
  right 16px
  top 20px
  .results-section
    overflow initial
  .loader
    vertical-align -2px
    margin-right 4px
</style>
