<script setup>
import { reactive, computed, onMounted, watch } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useGroupStore } from '@/stores/useGroupStore'

import GroupLabel from '@/components/GroupLabel.vue'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const groupStore = useGroupStore()

const isSpaceMember = computed(() => userStore.getUserIsSpaceMember)
const spacePrivacyIsOpen = computed(() => spaceStore.privacy === 'open')
const spaceGroups = computed(() => groupStore.getCurrentSpaceGroups)
const showInExplore = computed(() => spaceStore.showInExplore)
const isTemplate = computed(() => spaceStore.isTemplate)
const isVisible = computed(() => {
  return !isSpaceMember.value || showInExplore.value || isTemplate.value || spaceGroups.value.length
})
const toggleGroupSpaceFilter = (group) => {
  globalStore.triggerToggleGroupSpaceFilter(group)
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

  template(v-for="group in spaceGroups")
    GroupLabel(
      :group="group"
      :showName="true"
      :isButton="isSpaceMember"
      @selectGroup="toggleGroupSpaceFilter"
    )
</template>

<style lang="stylus">
.space-info-badges
  align-items flex-start
  flex-wrap wrap
  .sunglasses
    margin-left 1px
</style>
