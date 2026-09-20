<script setup>
import { reactive, computed, onMounted, watch, onBeforeUnmount } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useGroupStore } from '@/stores/useGroupStore'

import GroupLabel from '@/components/GroupLabel.vue'
import GroupDetails from '@/components/dialogs/GroupDetails.vue'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const groupStore = useGroupStore()

let unsubscribes

onMounted(() => {
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
  if (unsubscribes) {
    unsubscribes()
  }
})

const state = reactive({
  currentGroupId: ''
})

const isSpaceMember = computed(() => userStore.getUserIsSpaceMember)
const spacePrivacyIsOpen = computed(() => spaceStore.privacy === 'open')
const showInExplore = computed(() => spaceStore.showInExplore)
const isTemplate = computed(() => spaceStore.isTemplate)
const isVisible = computed(() => {
  return !isSpaceMember.value || showInExplore.value || isTemplate.value || spaceGroups.value.length
})

// groups

const spaceGroups = computed(() => groupStore.getCurrentSpaceGroups)
const closeDialogs = () => {
  state.currentGroupId = ''
}
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
.row.align-items-top.space-info-badges(v-if="isVisible")
  template(v-if="!isSpaceMember")
    .badge.info(v-if="!spacePrivacyIsOpen")
      span Read Only
    .badge.success(v-if="spacePrivacyIsOpen")
      img.icon.comment(src="@/assets/comment.svg")
      span Open to Comments
  .badge.status(v-if="showInExplore")
    img.icon.sunglasses(src="@/assets/sunglasses.svg")
    span In Explore
  .badge.secondary(v-if="isTemplate")
    img.icon.templates(src="@/assets/templates.svg")
    span Template

  .button-wrap(v-for="group in spaceGroups" :key="group.id" @click.stop)
    GroupLabel(
      :group="group"
      :showName="true"
      :isButton="isSpaceMember"
      :isActive="groupDetailsIsVisible(group)"
      @selectGroup="toggleGroupDetails"
    )
    GroupDetails(:visible="groupDetailsIsVisible(group)" :group="group")
</template>

<style lang="stylus">
.space-info-badges
  align-items flex-start
  flex-wrap wrap
  gap 4px
  > .badge,
  > .button-wrap
    margin 0
    .group-badge
      margin 0
  .sunglasses
    margin-left 1px
</style>
