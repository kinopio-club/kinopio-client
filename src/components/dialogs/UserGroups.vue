<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import GroupLabel from '@/components/GroupLabel.vue'
import GroupDetails from '@/components/dialogs/GroupDetails.vue'
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

// groups picker list

const groups = computed(() => store.getters['groups/byUser']())

// const groups = computed(() => {
//   const user = store.state.currentUser
//   const groupIds = utils.clone(store.state.groups.ids)
//   const groups = groupIds.map(id => store.getters['groups/byId'](id))
//   let groupUserGroups = groups.filter(group => {
//     return group.users.find(groupUser => {
//       const groupUserId = groupUser.id || groupUser.userId
//       return groupUserId === user.id
//     })
//   })
//   groupUserGroups = uniqBy(groupUserGroups, 'id')
//   return groupUserGroups
// })

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
const toggleGroupDetailsIsVisible = (group) => {
  if (groupIsVisible(group)) {
    state.groupDetailsIsVisibleForGroupId = ''
  } else {
    state.groupDetailsIsVisibleForGroupId = group.id
  }
}
</script>

<template lang="pug">
dialog.narrow.groups(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    .row.title-row
      span Groups
      .button-wrap
        button.small-button(:class="{ active: state.addGroupIsVisible }" @click.stop="toggleAddGroupIsVisible")
          img.icon.add(src="@/assets/add.svg")
          span Group
        AddGroup(:visible="state.addGroupIsVisible" @closeDialogs="closeDialogs")

  //- group picker
  template(v-if="isLoadingGroups")
    section
      Loader(:visible="true")

  template(v-else-if="groups.length")
    section.results-section
      ul.results-list
        template(v-for="group in groups")
          li(:class="{ active: groupIsVisible(group) }" @click.stop="toggleGroupDetailsIsVisible(group)")
            GroupLabel(:group="group" :showName="true")
            GroupDetails(:visible="groupIsVisible(group)" :group="group")
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
  ul.results-list
    overflow initial
    li
      align-items center
      position relative
    dialog.group-details
      left -30px
      top 30px
</style>
