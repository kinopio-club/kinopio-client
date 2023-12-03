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

const state = reactive({
  moreOptionsIsVisible: false
})

const card = computed(() => store.getters['currentCards/byId'](props.parentCardId))
const cardIsCreatedByCurrentUser = computed(() => store.getters['currentUser/cardIsCreatedByCurrentUser'](card.value))
const canEditSpace = computed(() => store.getters['currentUser/canEditSpace']())
const isSpaceMember = computed(() => store.getters['currentUser/isSpaceMember']())
const canEditCard = computed(() => {
  if (isSpaceMember.value) { return true }
  if (canEditSpace.value && cardIsCreatedByCurrentUser.value) { return true }
  return false
})

const otherSpaceIsPrivate = computed(() => {
  if (!props.otherSpace.privacy) { return }
  return props.otherSpace.privacy === 'private'
})
const loading = computed(() => store.state.isLoadingOtherItems)

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

const isScreenshotVisible = computed(() => {
  if (!props.otherSpace) { return }
  return props.screenshotIsVisible && props.otherSpace.screenshotUrl
})

const toggleMoreOptionsIsVisible = () => {
  const value = !state.moreOptionsIsVisible
  state.moreOptionsIsVisible = value
}

const changeSpace = () => {
  if (utils.urlIsInvite(props.url)) {
    window.location = props.url
  }
  store.commit('closeAllDialogs')
  store.dispatch('currentSpace/changeSpace', props.otherSpace)
}
const updateDimensions = () => {
  store.dispatch('currentCards/updateDimensions', { cards: [card.value] })
}

</script>

<template lang="pug">
.row.other-space-preview
  Loader(:visible="loading")
  template(v-if="!loading")
    .preview-content(:style="{background: selectedColor}")
      //- card details buttons
      .content-buttons(v-if="canEditCard && otherSpace.screenshotUrl")
        .row
          .button-wrap
            button.icon-only-button(@click.stop="toggleMoreOptionsIsVisible" :class="{active: state.moreOptionsIsVisible}")
              img.icon.down-arrow(src="@/assets/down-arrow.svg")
        //- all, text, none
        .row(v-if="state.moreOptionsIsVisible")
          .segmented-buttons
            button(@click="showAll" :class="{active : isScreenshotVisible}")
              span All
            button(@click="showInfo" :class="{active : !isScreenshotVisible}")
              span Text

      //- img.hidden(v-if="card.urlPreviewImage" :src="card.urlPreviewImage" @load="updateImageCanLoad")
      a.preview-image-wrap.side-image(v-if="isScreenshotVisible" :href="url" @click.stop.prevent="changeSpace")
        //- TODO @click change space
        img.preview-image.clickable-item(:src="otherSpace.screenshotUrl" @load="updateDimensions")
      .row.info-row(:style="{background: selectedColor}")
        div
          template(v-if="props.isInvite")
            .badge.info.invite-badge Invite
          .row.info-row
            template(v-if="otherSpace.users")
              UserLabelInline(:user="otherSpace.users[0]" :shouldHideName="true")
            span {{otherSpaceName}}
              img.icon.private(v-if="otherSpaceIsPrivate" src="@/assets/lock.svg")

  //- template(v-if="isScreenshotVisible")
  //-   .preview-image-wrap
  //-     img.preview-image(:src="props.otherSpace.screenshotUrl" :class="{selected: props.isSelected}" @load="updateDimensions" ref="image")

  //- .badge.link-badge(:class="{ active: isActive, 'is-screenshot-visible': isScreenshotVisible }" :style="{ background: props.selectedColor }")
  //-   template(v-if="props.isInvite")
  //-     .badge.info.invite-badge Invite
  //-   template(v-if="isRemoved")
  //-     .badge.danger
  //-       img.icon(src="@/assets/remove.svg")
  //-   template(v-if="props.otherSpace")
  //-     template(v-if="props.otherSpace.users")
  //-       UserLabelInline(:user="props.otherSpace.users[0]" :shouldHideName="true")
  //-     span {{otherSpaceName}}
  //-     img.icon.private(v-if="otherSpaceIsPrivate" src="@/assets/lock.svg")
  //-   template(v-else)
  //-     Loader(:visible="true" :isSmall="true" :isStatic="!isLoadingOtherItems")
  //-     span Loading…

</template>

<style lang="stylus">
// .other-space-preview

//   text-decoration none
//   margin 0
//   > .badge
//     display block
//     margin 0
//     margin-right 6px
//   .user-label-inline
//     margin-right 6px
//   .is-screenshot-visible
//     border-top-left-radius 0
//     border-top-right-radius 0
//     padding var(--subsection-padding)

//   // from UrlPreviewCard
//   .preview-image-wrap
//     display flex
//   .preview-image
//     width 100%
//     border-radius var(--entity-radius)
//     background var(--primary-background)
//     pointer-events none
//     -webkit-touch-callout none // prevents safari mobile press-and-hold from interrupting
//     border-bottom-left-radius 0
//     border-bottom-right-radius 0
//     &.selected
//       mix-blend-mode color-burn
//   .anon-avatar
//     top 6px !important
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
    min-height 80px
  .preview-image
    display block
    width 100%
    border-radius var(--entity-radius)
    background var(--primary-background)
    pointer-events none
    -webkit-touch-callout none // prevents safari mobile press-and-hold from interrupting

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

  .invite-badge
    display inline-block
    margin-bottom -10px

  .user-label-inline
    width 18px
    height 17px
    min-width initial
    min-height initial
  .anon-avatar
    top 6px !important

  // .text
  //   // position absolute
  //   margin 8px
  //   background var(--secondary-hover-background)
  //   user-select text
  //   display flex
  //   top 0
  //   overflow hidden
  //   // &.text-with-image
  //   //   border-radius var(--entity-radius)
  //   //   bottom 0
  //   // &.text-only
  //   //   position relative
  //   //   margin 0
  //   //   border-radius var(--entity-radius)

  // .side-text
  //   max-width calc(100% - 24px)
  //   position static
  //   margin 0
  //   padding 4px
  //   display block

  // .favicon
  //   border-radius var(--small-entity-radius)
  //   width 14px
  //   vertical-align -3px
  //   display inline
  //   margin-right 5px
  //   margin-top 3px
  //   &.open
  //     width 12px
  //     vertical-align -2px
  // .title
  //   display inline
  // .description
  //   margin-top 10px

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

  .inline-button-wrap
    cursor pointer
    button
      cursor pointer

  .icon-only-button
    img
      padding 0

</style>
