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
  isStatic: Boolean
})

const state = reactive({
  moreOptionsIsVisible: false,
  previewImageIsHover: false
})

const cardIsCreatedByCurrentUser = computed(() => store.getters['currentUser/cardIsCreatedByCurrentUser'](props.card))
const canEditCard = computed(() => {
  if (isSpaceMember.value) { return true }
  if (canEditSpace.value && cardIsCreatedByCurrentUser.value) { return true }
  return false
})
const canEditSpace = computed(() => store.getters['currentUser/canEditSpace']())
const isSpaceMember = computed(() => store.getters['currentUser/isSpaceMember']())
const isLoadingOtherItems = computed(() => store.state.isLoadingOtherItems)
const changeSpace = () => {
  if (isInvite.value) {
    window.location = props.url
  }
  store.commit('closeAllDialogs')
  store.dispatch('currentSpace/changeSpace', props.otherSpace)
}

// space info

const isInvite = computed(() => utils.urlIsInvite(props.url))
const isRemoved = computed(() => {
  const space = props.otherSpace
  if (!space) { return }
  return space.isRemoved
})
const otherSpaceIsPrivate = computed(() => {
  if (!props.otherSpace?.privacy) { return }
  return props.otherSpace.privacy === 'private'
})

// preview image

const previewImageIsVisible = computed(() => {
  if (!props.otherSpace) { return }
  return props.card?.shouldShowOtherSpacePreviewImage && props.otherSpace?.previewImage
})
const toggleMoreOptionsIsVisible = () => {
  const value = !state.moreOptionsIsVisible
  state.moreOptionsIsVisible = value
}
const togglePreviewImageIsVisible = (value) => {
  store.dispatch('currentCards/update', {
    id: props.card.id,
    shouldShowOtherSpacePreviewImage: value
  })
}
const previewImageHover = (value) => {
  state.previewImageIsHover = value
}
</script>

<template lang="pug">
.row.other-space-preview
  .preview-content(:class="{ 'min-height': !isStatic && state.moreOptionsIsVisible }")
    //- buttons
    .content-buttons(v-if="canEditCard && otherSpace?.previewImage && !isStatic")
      .row
        .button-wrap
          button.small-button(@click.stop="toggleMoreOptionsIsVisible" :class="{active: state.moreOptionsIsVisible}")
            img.icon.down-arrow(src="@/assets/down-arrow.svg")
      //- all, text
      .row(v-if="state.moreOptionsIsVisible")
        .segmented-buttons
          button(@click="togglePreviewImageIsVisible(true)" :class="{active : previewImageIsVisible}")
            span All
          button(@click="togglePreviewImageIsVisible(false)" :class="{active : !previewImageIsVisible}")
            span Text
    a.preview-image-wrap.side-image(v-if="previewImageIsVisible" :href="url" @click.stop.prevent="changeSpace" @mouseover="previewImageHover(true)" @mouseleave="previewImageHover(false)")
      img.preview-image.clickable-item(:src="otherSpace?.previewImage")
    div
      template(v-if="!isLoadingOtherItems || !otherSpace")
        a(:href="url" :class="{ hover: state.previewImageIsHover }")
          //- badges
          .badge.info.inline-badge(v-if="isInvite")
            span Invite
          .badge.danger.inline-badge(v-if="isRemoved")
            img.icon(src="@/assets/remove.svg")
          //- space info
          template(v-if="otherSpace?.users")
            UserLabelInline(:user="otherSpace?.users[0]" :shouldHideName="true")
          span {{otherSpace?.name}}
            img.icon.private(v-if="otherSpaceIsPrivate" src="@/assets/lock.svg")
      template(v-else)
        Loader(:visible="true" :isSmall="true" :isStatic="!isLoadingOtherItems")
        span Space
</template>

<style lang="stylus">
.other-space-preview
  max-height 148px
  overflow hidden
  flex-wrap wrap
  &.row
    display flex
  .info-row
    align-items flex-start
  .preview-content
    width 100%
    position relative
    display flex
    align-items flex-start !important
    color var(--primary)
    text-decoration none
    word-break break-word
    background var(--secondary-hover-background)
    border-radius var(--entity-radius)
    padding var(--subsection-padding)
    &.min-height
      min-height 68px

  // from UrlPreviewCard
  .preview-image
    display block
    width 100%
    border-radius var(--entity-radius)
    background var(--primary-background)
    pointer-events none
    -webkit-touch-callout none // prevents safari mobile press-and-hold from interrupting

  a
    color var(--primary)
    text-decoration none
    &:hover,
    &.hover
      text-decoration underline

  a.preview-image-wrap
    max-height 120px
    overflow hidden
    padding-bottom 4px

  .side-image
    max-width 40%
    margin-right 6px
    display block
  .icon.private
    margin-left 5px

  .inline-badge
    display inline-block
    margin-right 6px

  .user-label-inline
    width 18px
    height 17px
    min-width initial
    min-height initial
    vertical-align -2px
  .anon-avatar
    top 6px !important

  .content-buttons
    z-index 1
    position absolute
    right 0
    top 0
    padding 4px
    pointer-events none
    .button-wrap,
    button
      pointer-events all
    .row
      justify-content flex-end

  .icon.down-arrow
    padding-right 3px
    vertical-align 2px

  .loader
    margin-right 6px
    vertical-align -2px
</style>
