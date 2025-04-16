<script setup>
import { reactive, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'

import GroupLabel from '@/components/GroupLabel.vue'

const store = useStore()

const props = defineProps({
  spaceGroup: Object,
  visible: Boolean
})

const isSpaceMember = computed(() => store.getters['currentUser/isSpaceMember']())
const spacePrivacyIsOpen = computed(() => store.state.currentSpace.privacy === 'open')
const showInExplore = computed(() => store.state.currentSpace.showInExplore)
const isTemplate = computed(() => store.state.currentSpace.isTemplate)
const isHidden = computed(() => {
  return isSpaceMember.value && !showInExplore.value && !isTemplate.value && !props.spaceGroup
})
</script>

<template lang="pug">
.row.align-items-top.space-info-badges(v-if="visible && !isHidden")
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

  GroupLabel(v-if="props.spaceGroup" :group="props.spaceGroup" :showName="true")
</template>

<style lang="stylus">
.space-info-badges
  align-items flex-start
  flex-wrap wrap
  .sunglasses
    margin-left 1px
</style>
