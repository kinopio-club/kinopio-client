<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Loader from '@/components/Loader.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'
import utils from '@/utils.js'
const store = useStore()

const props = defineProps({
  otherSpace: Object,
  url: String,
  parentCardId: String,
  isInvite: Boolean,
  screenshotIsVisible: Boolean,
  isSelected: Boolean,
  selectedColor: String
})

const otherSpaceIsPrivate = computed(() => {
  if (!props.otherSpace.privacy) { return }
  return props.otherSpace.privacy === 'private'
})
const isLoadingOtherItems = computed(() => store.state.isLoadingOtherItems)

const isActive = computed(() => {
  const isFromParentCard = store.state.currentSelectedOtherItem.parentCardId === props.parentCardId
  const otherSpaceDetailsIsVisible = store.state.otherSpaceDetailsIsVisible
  return otherSpaceDetailsIsVisible && isFromParentCard
})

const otherSpaceName = computed(() => {
  let name = props.otherSpace.name
  return name
})

const isRemoved = computed(() => {
  const space = props.otherSpace
  if (!space) { return }
  return space.isRemoved
})

const isScreenshotVisible = computed(() => props.screenshotIsVisible && props.otherSpace.screenshotUrl)
</script>

<template lang="pug">
a.other-space-preview(@click.prevent.stop.left :href="props.url" ref="badge")
  template(v-if="isScreenshotVisible")
    .preview-image-wrap
      img.preview-image(:src="props.otherSpace.screenshotUrl" :class="{selected: props.isSelected}" @load="updateDimensions" ref="image")

  .badge.link-badge(:class="{ active: isActive, 'is-screenshot-visible': isScreenshotVisible }" :style="{ background: props.selectedColor }")
    template(v-if="props.isInvite")
      .badge.info.invite-badge Invite
    template(v-if="isRemoved")
      .badge.danger
        img.icon(src="@/assets/remove.svg")
    template(v-if="props.otherSpace")
      template(v-if="props.otherSpace.users")
        UserLabelInline(:user="props.otherSpace.users[0]" :shouldHideName="true")
      span {{otherSpaceName}}
      img.icon.private(v-if="otherSpaceIsPrivate" src="@/assets/lock.svg")
    template(v-else)
      Loader(:visible="true" :isSmall="true" :isStatic="!isLoadingOtherItems")
      span Loading…

</template>

<style lang="stylus">
.other-space-preview
  text-decoration none
  margin 0
  .badge
    display block
    margin 0
  .invite-badge
    display inline-block
    margin-right 6px
  .user-label-inline
    margin-right 6px
  .is-screenshot-visible
    border-top-left-radius 0
    border-top-right-radius 0
    padding var(--subsection-padding)

  // from UrlPreviewCard
  .preview-image-wrap
    display flex
  .preview-image
    width 100%
    border-radius var(--entity-radius)
    background var(--primary-background)
    pointer-events none
    -webkit-touch-callout none // prevents safari mobile press-and-hold from interrupting
    border-bottom-left-radius 0
    border-bottom-right-radius 0
    &.selected
      mix-blend-mode color-burn
  .anon-avatar
    top 6px !important
</style>
