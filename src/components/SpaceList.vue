<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import templates from '@/data/templates.js'
import ResultsFilter from '@/components/ResultsFilter.vue'
import MoonPhase from '@/components/MoonPhase.vue'
import PrivacyIcon from '@/components/PrivacyIcon.vue'
import Loader from '@/components/Loader.vue'
import User from '@/components/User.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'
import NameMatch from '@/components/NameMatch.vue'
import OfflineBadge from '@/components/OfflineBadge.vue'
import SpaceTodayJournalBadge from '@/components/SpaceTodayJournalBadge.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'

import dayjs from 'dayjs'
import last from 'lodash-es/last'

const store = useStore()

let unsubscribe, shouldPreventSelectSpace

const spaceListElement = ref(null)

onMounted(() => {
  unsubscribe = store.subscribe((mutation) => {
    if (mutation.type === 'triggerPickerNavigationKey') {
      const key = mutation.payload
      const spaces = props.spaces
      let currentIndex = spaces.findIndex(space => space.id === state.focusOnId)
      if (!utils.arrayHasItems(spaces)) {
        closeDialog()
      } else if (key === 'ArrowUp') {
        focusPreviousItem(currentIndex)
      } else if (key === 'ArrowDown') {
        focusNextItem(currentIndex)
      }
    }
    if (mutation.type === 'triggerPickerSelect') {
      const spaces = props.spaces
      const currentSpace = spaces.find(space => space.id === state.focusOnId)
      selectSpace(null, currentSpace)
      store.commit('shouldPreventNextEnterKey', true)
    }
  })
  updateScroll()
  spaceListElement.value.closest('section').addEventListener('scroll', updateScroll)
})

onBeforeUnmount(() => {
  unsubscribe()
  spaceListElement.value.closest('section').removeEventListener('scroll', updateScroll)
})

const emit = defineEmits(['focusBeforeFirstItem', 'closeDialog', 'selectSpace', 'checkmarkSpace'])

const props = defineProps({
  spaces: Array,
  selectedSpace: Object,
  showCategory: Boolean,
  showUser: Boolean,
  showOtherUsers: Boolean,
  showCollaborators: Boolean,
  showUserIfCurrentUserIsCollaborator: Boolean,
  hideExploreBadge: Boolean,
  hideFilter: Boolean,
  isLoading: Boolean,
  parentIsSpaceDetails: Boolean,
  parentIsPinned: Boolean,
  showCheckmarkSpace: Boolean,
  userShowInExploreDate: String,
  readSpaceIds: Array,
  spaceReadDateType: String,
  showCreateNewSpaceFromSearch: Boolean,
  resultsSectionHeight: Number,
  disableListOptimizations: Boolean,
  search: String,
  parentDialog: String,
  previewImageIsWide: Boolean
})

const state = reactive({
  filter: '',
  filteredSpaces: [],
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

watch(() => props.spaces, (spaces) => {
  const cardDetailsIsVisible = store.state.cardDetailsIsVisibleForCardId
  if (spaces && cardDetailsIsVisible) {
    state.focusOnId = props.spaces[0].id
  }
}, { deep: true })

const spacesFiltered = computed(() => {
  if (state.filter) {
    return state.filteredSpaces
  } else {
    return props.spaces
  }
})
const isNotCached = (spaceId) => {
  return store.getters['spaceIsNotCached'](spaceId)
}
const duplicateSpace = () => {
  store.dispatch('currentSpace/duplicateSpace')
  store.dispatch('closeAllDialogs')
}
const isNew = (space) => {
  if (props.readSpaceIds.includes(space.id)) { return }
  if (props.userShowInExploreDate) {
    if (spaceIsCurrentSpace(space)) { return }
    const readDate = dayjs(props.userShowInExploreDate)
    const spaceDate = utils.spaceReadDate(space, props.spaceReadDateType)
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
const showInExplore = (space) => {
  if (props.hideExploreBadge) { return }
  if (space.privacy === 'private') { return }
  return space.showInExplore
}
const user = (space) => {
  let users = []
  if (utils.arrayHasItems(space.users)) {
    users = space.users
  }
  return space.user || users[0]
}
const users = (space) => {
  const spaceUser = user(space)
  let spaceUsers = [spaceUser]
  if (space.otherUsers) {
    spaceUsers = spaceUsers.concat(space.otherUsers)
  } else if (space.collaborators) {
    spaceUsers = spaceUsers.concat(space.collaborators)
  }
  return spaceUsers
}
const isMultipleUsers = (space) => {
  return users(space).length > 1
}
const showUserIfCurrentUserIsCollaborator = (space) => {
  const isUser = Boolean(user(space))
  return props.showUserIfCurrentUserIsCollaborator && space.currentUserIsCollaborator && isUser
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
  if (shouldPreventSelectSpace) {
    shouldPreventSelectSpace = false
    return
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

// results filter

const placeholder = computed(() => {
  if (!props.parentIsSpaceDetails) { return }
  let placeholder = 'Search Spaces'
  if (!utils.isMobile()) {
    placeholder = placeholder + ` (${utils.metaKey()}-K)`
  }
  return placeholder
})
const updateFilteredSpaces = (spaces) => {
  state.filteredSpaces = spaces
}
const parentDialog = computed(() => {
  const cardDetailsIsVisible = store.state.cardDetailsIsVisibleForCardId
  let parentDialog = props.parentDialog
  if (cardDetailsIsVisible) {
    parentDialog = 'cardDetails'
  }
  return parentDialog
})
const updateFilter = async (filter, isClearFilter) => {
  const parentIsNew = parentDialog.value !== store.state.spaceListFilterInfo.parentDialog
  if (parentIsNew) {
    filter = ''
  }
  state.filter = filter
  if (!isClearFilter) {
    store.commit('spaceListFilterInfo', {
      filter,
      parentDialog: parentDialog.value,
      updatedAt: new Date().getTime()
    })
  }
  const spaces = spacesFiltered.value || props.spaces
  if (!spaces.length) { return }
  if (!filter) {
    state.focusOnId = ''
    await nextTick()
    updateScroll()
    return
  }
  state.focusOnId = spaces[0].id
}

// keyboard focus

const focusPreviousItem = (currentIndex) => {
  const spaces = spacesFiltered.value
  const focusedSpaceName = props.spaces.find(space => space.id === state.focusOnId)
  const firstItemIsFocused = props.search === focusedSpaceName
  const firstItem = spaces[0]
  const previousItem = spaces[currentIndex - 1]
  if (firstItemIsFocused) {
    closeDialog()
  } else
  if (previousItem) {
    state.focusOnId = previousItem.id
  } else {
    state.focusOnId = firstItem.id
    emit('focusBeforeFirstItem')
  }
}
const focusNextItem = (currentIndex) => {
  const spaces = spacesFiltered.value
  const lastItem = last(spaces)
  const lastItemIsFocused = lastItem.name === state.focusOnId
  const nextItem = spaces[currentIndex + 1]

  if (lastItemIsFocused) {
    closeDialog()
  } else if (nextItem) {
    state.focusOnId = nextItem.id
  } else {
    state.focusOnId = lastItem.id
  }
}
const closeDialog = () => {
  emit('closeDialog')
}
const focusNextItemFromFilter = () => {
  const spaces = spacesFiltered.value
  const currentIndex = spaces.findIndex(space => space.id === state.focusOnId)
  focusNextItem(currentIndex)
}
const focusPreviousItemFromFilter = () => {
  const spaces = spacesFiltered.value
  const currentIndex = spaces.findIndex(space => space.id === state.focusOnId)
  focusPreviousItem(currentIndex)
}
const selectItemFromFilter = () => {
  if (shouldPreventSelectSpace) {
    shouldPreventSelectSpace = false
    return
  }
  const spaces = spacesFiltered.value
  const space = spaces.find(space => space.id === state.focusOnId)
  store.commit('shouldPreventNextEnterKey', true)
  selectSpace(null, space)
}
const checkmarkSpace = (space) => {
  shouldPreventSelectSpace = true
  emit('checkmarkSpace', space)
}
</script>

<template lang="pug">
span.space-list-wrap
  ResultsFilter(
    :hideFilter="hideFilter"
    :items="spaces"
    :placeholder="placeholder"
    :isLoading="isLoading"
    :parentIsPinned="parentIsPinned"
    :showCreateNewSpaceFromSearch="showCreateNewSpaceFromSearch"
    :isInitialValueFromSpaceListFilterInfo="true"
    @updateFilter="updateFilter"
    @updateFilteredItems="updateFilteredSpaces"
    @focusNextItem="focusNextItemFromFilter"
    @focusPreviousItem="focusPreviousItemFromFilter"
    @selectItem="selectItemFromFilter"
  )
  ul.results-list.space-list(ref="spaceListElement")
    template(v-for="(space, index) in spacesFiltered" :key="space.id")
      .space-wrap(:data-item-is-visible="itemIsVisible(index)" :data-space-id="space.id" :style="{height: state.heightByIndex[index] + 'px'}")
        a(:href="space.url")
          li(
            @click.left="selectSpace($event, space)"
            :class="{ active: spaceIsActive(space), hover: state.focusOnId === space.id }"
            tabindex="0"
            @keyup.enter="selectSpace(null, space)"
          )
            template(v-if="itemIsVisible(index)")
              Loader(:visible="isLoadingSpace(space)")

              //- Users
              //- show spectators
              template(v-if="showOtherUsers && isMultipleUsers(space)")
                .users.multiple-users
                  template(v-for="user in users(space)" :key="user.id")
                    User(:user="user" :isClickable="false" :isMedium="true")
              template(v-else-if="showOtherUsers")
                UserLabelInline(:user="user(space)" :isClickable="false" :key="user(space).id" :isMedium="true")
              //- show collaborators
              template(v-else-if="showCollaborators && isMultipleUsers(space)")
                .users.multiple-users
                  template(v-for="user in users(space)" :key="user.id")
                    User(:user="user" :isClickable="false" :isMedium="true")
              template(v-else-if="showCollaborators")
                UserLabelInline(:user="user(space)" :isClickable="false" :key="user(space).id" :isMedium="true")
              //- show user badge only
              template(v-else-if="showUser")
                User(:user="user(space)" :isClickable="false" :key="user(space).id" :isMedium="true")
              //- show user when current user is collaborator
              template(v-else-if="showUserIfCurrentUserIsCollaborator(space)")
                User(:user="user(space)" :isClickable="false" :key="user(space).id" :isMedium="true")

              //- preview image
              .preview-thumbnail-image-wrap(v-if="space.previewThumbnailImage && isOnline" :class="{wide: previewImageIsWide}")
                img.preview-thumbnail-image(:src="space.previewThumbnailImage")
              //- offline
              span(v-if="isNotCached(space.id)")
                OfflineBadge(:isInline="true" :isDanger="true")
              //- template category
              .badge.info.inline-badge(v-if="showCategory && space.category" :class="categoryClassName(space)") {{space.category}}
              //- tweet space
              span(v-if="space.isFromTweet" title="Tweet space")
                img.icon.tweet(src="@/assets/twitter.svg")
              //- space meta
              span(v-if="space.isFavorite")
                img.icon.favorite-icon(src="@/assets/heart.svg")
              span(v-if="space.name === 'Inbox'")
                img.icon.inbox-icon(src="@/assets/inbox.svg")
              SpaceTodayJournalBadge(:space="space")
              //- journal
              MoonPhase(v-if="space.moonPhase" :moonPhase="space.moonPhase")
              //- template
              img.icon.templates(v-if="space.isTemplate" src="@/assets/templates.svg" title="Template")
              //- space details
              .name
                span(v-if="state.filter")
                  NameMatch(:name="space.name" :indexes="space.matchIndexes")
                span(v-else)
                  span {{space.name}}
                template(v-if='space.privacy')
                  PrivacyIcon(:privacy="space.privacy" :closedIsNotVisible="true")
                img.icon.sunglasses(src="@/assets/sunglasses.svg" v-if="showInExplore(space)" title="Shown in Explore")
              button.button-checkmark(v-if="showCheckmarkSpace" @mousedown.left.stop="checkmarkSpace(space)" @touchstart.stop="checkmarkSpace(space)")
                img.icon.checkmark(src="@/assets/checkmark.svg")
            //- new
            .badge.info.inline-badge.new-unread-badge(v-if="isNew(space)")
</template>

<style lang="stylus">
.space-list-wrap
  position relative

  .space-list
    .inline-badge
      margin-left 0
      flex none

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
    .user-label-inline
      flex-shrink 0
      max-width 100px
      pointer-events none
    .users
      margin-right 6px
      display flex
      flex-wrap wrap
      align-content flex-start
      flex-shrink 0
      max-width 66px // 3 users across
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
      padding-bottom 5px
      .loader
        position absolute
        width 13px
        height 13px
        top 10px
        z-index 1
      .icon.templates
        margin-right 5px
        vertical-align 0px

    .space-wrap
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

    .preview-thumbnail-image-wrap
      position relative
      flex-shrink 0
      margin-right 6px
      &.wide
        width 40px
        height 30px
        .preview-thumbnail-image
          width 100%
          height 100%
</style>
