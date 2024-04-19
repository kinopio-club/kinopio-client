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
  card: Object,
  isSelected: Boolean,
  selectedColor: String
})

const updateDimensions = () => {
  store.dispatch('currentCards/updateDimensions', { cards: [props.card] })
}

// space info

const otherSpaceIsPrivate = computed(() => {
  if (!props.otherSpace.privacy) { return }
  return props.otherSpace.privacy === 'private'
})
const isLoadingOtherItems = computed(() => store.state.isLoadingOtherItems)
const otherSpaceName = computed(() => {
  let name = props.otherSpace.name
  return name
})
const isRemoved = computed(() => {
  const space = props.otherSpace
  if (!space) { return }
  return space.isRemoved
})
const urlIsInvite = computed(() => utils.urlIsInvite(props.url))

// preivew image

const shouldShowPreviewImage = computed(() => props.card.shouldShowOtherSpacePreviewImage)
const previewImage = computed(() => props.otherSpace?.previewImage)
const previewImageIsVisible = computed(() => shouldShowPreviewImage.value && previewImage.value)

</script>

<template lang="pug">
.other-space-preview-card
  //- preview image
  .preview-image-wrap(v-if="previewImageIsVisible")
    img.preview-image(:src="previewImage" :class="{selected: props.isSelected}" @load="updateDimensions" ref="image")
  .badge.link-badge(:class="{ 'preview-image-is-visible': previewImageIsVisible }" :style="{ background: props.selectedColor }")
    //- badges
    .badge.info.inline-badge(v-if="urlIsInvite")
      span Invite
    .badge.danger.inline-badge(v-if="isRemoved")
      img.icon(src="@/assets/remove.svg")
    //- space info
    template(v-if="props.otherSpace")
      template(v-if="props.otherSpace.users")
        UserLabelInline(:user="props.otherSpace.users[0]" :shouldHideName="true")
      span.space-name {{otherSpaceName}}
      img.icon.private(v-if="otherSpaceIsPrivate" src="@/assets/lock.svg")
    template(v-else)
      Loader(:visible="true" :isSmall="true" :isStatic="!isLoadingOtherItems")
      span Space
</template>

<style lang="stylus">
.other-space-preview-card
  text-decoration none
  margin 0
  > .badge
    display block
    margin 0
  .inline-badge
    display inline-block
    margin-right 6px
  .user-label-inline
    margin-right 6px
  .preview-image-is-visible
    border-top-left-radius 0
    border-top-right-radius 0
    padding var(--subsection-padding)

  .anon-avatar
    top 6px !important

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
  .space-name
    overflow-wrap break-word

</style>
