<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import templates from '@/data/templates.js'
import MoonPhase from '@/components/MoonPhase.vue'
import PrivacyIcon from '@/components/PrivacyIcon.vue'
import Loader from '@/components/Loader.vue'
import User from '@/components/User.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'
// import NameMatch from '@/components/NameMatch.vue'
// import OfflineBadge from '@/components/OfflineBadge.vue'
import SpaceTodayJournalBadge from '@/components/SpaceTodayJournalBadge.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'

import dayjs from 'dayjs'
import last from 'lodash-es/last'

const store = useStore()

// let unsubscribe, shouldPreventSelectSpace

const spaceListElement = ref(null)

onMounted(() => {
  // unsubscribe = store.subscribe((mutation) => {
  //   if (mutation.type === 'triggerPickerNavigationKey') {
  //     const key = mutation.payload
  //     const spaces = props.spaces
  //     let currentIndex = spaces.findIndex(space => space.id === state.focusOnId)
  //     if (!utils.arrayHasItems(spaces)) {
  //       closeDialog()
  //     } else if (key === 'ArrowUp') {
  //       focusPreviousItem(currentIndex)
  //     } else if (key === 'ArrowDown') {
  //       focusNextItem(currentIndex)
  //     }
  //   }
  //   if (mutation.type === 'triggerPickerSelect') {
  //     const spaces = props.spaces
  //     const currentSpace = spaces.find(space => space.id === state.focusOnId)
  //     selectSpace(null, currentSpace)
  //     store.commit('shouldPreventNextEnterKey', true)
  //   }
  // })
  updateScroll()
  spaceListElement.value.closest('section').addEventListener('scroll', updateScroll)
})

onBeforeUnmount(() => {
  // unsubscribe()
  spaceListElement.value.closest('section').removeEventListener('scroll', updateScroll)
})

const emit = defineEmits(['selectSpace'])

const props = defineProps({
  spaces: Array,
  selectedSpace: Object,
  isLoading: Boolean,
  userShowInExploreDate: String,
  disableListOptimizations: Boolean
})

const state = reactive({
  // filter: '',
  // filteredSpaces: [],
  focusOnId: '',
  scrollY: 0,
  scrollHeight: null,
  heightByIndex: {}
})

const isOnline = computed(() => store.state.isOnline)

// scroll

watch(() => props.resultsSectionHeight, async (value, prevValue) => {
  await nextTick()
  updateScroll()
})
watch(() => props.isLoading, async (value, prevValue) => {
  await nextTick()
  updateScroll()
})
const updateScroll = async () => {
  await nextTick()
  let element = spaceListElement.value
  if (!element) { return }
  element = element.closest('section')
  if (!element) {
    console.error('scroll element not found', element)
  }
  state.scrollY = element.scrollTop
  state.scrollHeight = element.getBoundingClientRect().height
}

const currentUser = computed(() => store.state.currentUser)

// spaces

const duplicateSpace = () => {
  store.dispatch('currentSpace/duplicateSpace')
  store.dispatch('closeAllDialogs')
}
const isNew = (space) => {
  if (props.userShowInExploreDate) {
    const readDate = dayjs(props.userShowInExploreDate)
    const spaceDate = dayjs(space.showInExploreUpdatedAt)
    const delta = readDate.diff(spaceDate, 'second')
    return delta < 0
  }
  const isEditedByOtherUser = space.editedByUserId !== currentUser.value.id
  if (isEditedByOtherUser) {
    return space.isEdited
  } else {
    return false
  }
}
const showCollaborator = (space) => {
  const isUser = Boolean(user(space))
  return props.showUserIfCurrentUserIsCollaborator && space.currentUserIsCollaborator && isUser
}
const categoryClassName = (space) => {
  const className = utils.normalizeString(space.category)
  return className
}
const spaceIsActive = (space) => {
  if (props.selectedSpace) {
    return Boolean(props.selectedSpace.id === space.id)
  } else {
    return spaceIsCurrentSpace(space)
  }
}
const isLoadingSpace = (space) => {
  const isLoadingSpace = store.state.isLoadingSpace
  return isLoadingSpace && spaceIsCurrentSpace(space)
}
const spaceIsCurrentSpace = (space) => {
  const currentSpace = store.state.currentSpace.id
  return Boolean(currentSpace === space.id)
}
const spaceIsTemplate = (space) => {
  if (space.isTemplate) { return true }
  const templateSpaceIds = templates.spaces().map(template => template.id)
  return templateSpaceIds.includes(space.id)
}
// const showInExplore = (space) => {
//   if (props.hideExploreBadge) { return }
//   if (space.privacy === 'private') { return }
//   return space.showInExplore
// }
const user = (space) => {
  let users = []
  if (utils.arrayHasItems(space.users)) {
    users = space.users
  }
  return space.user || users[0]
}
const selectSpace = (event, space) => {
  if (event) {
    if (event.metaKey || event.ctrlKey) {
      return
    } else {
      event.preventDefault()
      event.stopPropagation()
    }
  }
  if (!space) { return }
  emit('selectSpace', space)
}

// favorites

const isFavorite = (space) => {
  const favorites = store.state.currentUser.favoriteSpaces
  const isFavorite = favorites.find(favorite => favorite.id === space.id)
  return Boolean(isFavorite)
}

// list render optimization

const itemIsVisible = (index) => {
  if (props.disableListOptimizations) { return true }
  if (!state.scrollY) {
    updateScroll()
  }
  let threshold = 0
  if (state.scrollY) {
    threshold = state.scrollHeight / 2
  }
  const defaultHeight = 33
  let yStart = index * defaultHeight
  const prevHeight = state.heightByIndex[index - 1]
  if (prevHeight) {
    let yStart = 0
    for (let i = 0; i - 1 < index; i++) {
      yStart = yStart + state.heightByIndex[i]
    }
  }
  const yEnd = yStart + defaultHeight
  const isAboveScroll = (yEnd + threshold) < state.scrollY
  const isBelowScroll = (yStart - threshold) > (state.scrollHeight + state.scrollY)
  if (isAboveScroll || isBelowScroll) { return }
  updateItemHeight(index)
  return true
}
const updateItemHeight = (index) => {
  let element = spaceListElement.value
  if (!element) { return }
  const elements = element.getElementsByClassName('.space-wrap')
  if (!elements.length) { return }
  const offset = 3
  let height = elements[index].getBoundingClientRect().height
  state.heightByIndex[index] = height
}

</script>

<template lang="pug">
span.space-list-wrap
  ul.results-list.space-list(ref="spaceListElement")
    template(v-for="(space, index) in props.spaces" :key="space.id")
      .space-wrap(:data-item-is-visible="itemIsVisible(index)" :data-space-id="space.id" :style="{height: state.heightByIndex[index] + 'px'}")
        a(:href="space.url")
          li(
            @click.left="selectSpace($event, space)"
            :class="{ active: spaceIsActive(space), hover: state.focusOnId === space.id }"
            tabindex="0"
            @keyup.enter="selectSpace(null, space)"
          )
              //- user(s)
              //- template(v-else-if="showUser")
              .row
                UserLabelInline(:user="user(space)" :key="user(space).id")
                template(v-if="itemIsVisible(index)")
                  Loader(:visible="isLoadingSpace(space)")
                  //- Loader(:visible="true")

              //- template(v-if="showOtherUsers")
              //-   .users(:class="{'multiple-users': space.otherUsers.length > 1}")
              //-     User(:user="user(space)" :isClickable="false" :key="user(space).id" :isMedium="true")
              //-     template(v-for="otherUser in space.otherUsers" :key="otherUser.id")
              //-       User(:user="otherUser" :isClickable="false" :isMedium="true")
              //- template(v-else-if="showCollaborator(space)")
              //-   User(:user="user(space)" :isClickable="false" :key="user(space).id" :isMedium="true")

              //- preview image
              .row.preview-image-wrap(v-if="space.previewImage && isOnline")
                img(:src="space.previewImage")
              .row
                //- new
                .badge.info.inline-badge.new-unread-badge(v-if="isNew(space)")
                //- template category
                .badge.info.inline-badge(v-if="showCategory && space.category" :class="categoryClassName(space)") {{space.category}}
                //- space meta
                span(v-if="space.isFavorite")
                  img.icon.favorite-icon(src="@/assets/heart.svg")
                span(v-if="space.name === 'Inbox'")
                  img.icon.inbox-icon(src="@/assets/inbox.svg")
                SpaceTodayJournalBadge(:space="space")
                //- journal or template
                MoonPhase(v-if="space.moonPhase" :moonPhase="space.moonPhase")
                span(v-if="space.isTemplate")
                  img.icon.templates(src="@/assets/templates.svg" title="Template")
                //- space details
                .name
                  span {{space.name}}
                  template(v-if='space.privacy')
                    PrivacyIcon(:privacy="space.privacy" :closedIsNotVisible="true")
                  //- img.icon.sunglasses(src="@/assets/sunglasses.svg" v-if="showInExplore(space)" title="Shown in Explore")
                //- button.button-checkmark(v-if="showCheckmarkSpace" @mousedown.left.stop="checkmarkSpace(space)" @touchstart.stop="checkmarkSpace(space)")
                //-   img.icon.checkmark(src="@/assets/checkmark.svg")
</template>

<style lang="stylus">
.space-list-wrap
  position relative

.space-list
  display flex
  width 100%
  flex-wrap: wrap;
  .inline-badge
    margin-left 0
    flex none

  .new-unread-badge
    position absolute
    top -2px
    right -2px
    left initial
    margin 0

  .badge
    margin-left 0

  .sunglasses
    width 16px

  .icon.tweet
    min-width 12px
    margin-right 4px
    vertical-align -1px

  .name
    margin 0
    margin-top 1px
    white-space wrap
    width 100%
    .icon
      margin-left 6px

  .privacy-icon
    height 12px
    vertical-align -1px

  .favorite-icon,
  .inbox-icon
    margin-right 5px
    width 12px
    min-width 12px

  .user
    margin-right 6px
    vertical-align middle

  .users
    margin-right 6px
    display flex
    flex-wrap wrap
    justify-content flex-end
    align-content flex-start
    flex-shrink 0
    .user
      margin-right 0

  a
    color var(--primary)
    text-decoration none

  .color-only-badge
    width 16px
    height 16px
    padding 0
    min-width initial
    min-height initial

  .button-checkmark
    margin-left auto

  .checkmark
    vertical-align 1px
    width 10px

  li
    position relative
    width 100%
    min-height 30px
    flex-direction column
    .loader
      position absolute
      width 13px
      height 13px
      top 4px
      left 4px
      z-index 1
    .icon.templates
      margin-right 10px
      vertical-align 0px
    .row
      margin-bottom 5px

  .space-wrap
    display flex
    flex-shrink 0
    width 50%
    position relative
    button.inline-favorite
      cursor pointer
      z-index 1
      padding 0
      padding-left 6px
      padding-right 2px
  .inline-favorite-wrap
    cursor pointer
    position absolute
    right 4px
    top 3px
    padding 6px
    padding-right 0

  .moon-phase
    margin-top 4px
    margin-right 4px

  .preview-image-wrap
    position relative
    flex-shrink 0
    img
      border-radius var(--entity-radius)
    // margin-right 6px
    // img
    //   width 100%
    // width 24px
    // height 22px
</style>
