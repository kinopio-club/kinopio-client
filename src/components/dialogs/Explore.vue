<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import SpaceList from '@/components/SpaceList.vue'
import ExploreRssFeeds from '@/components/dialogs/ExploreRssFeeds.vue'
import Loader from '@/components/Loader.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'
import utils from '@/utils.js'

import randomColor from 'randomcolor'

const store = useStore()

const dialogElement = ref(null)
const resultsElement = ref(null)

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'updatePageSizes') {
      updateHeights()
    }
  })
})

const props = defineProps({
  visible: Boolean,
  spaces: Object,
  exploreSpaces: Object,
  followingSpaces: Object,
  everyoneSpaces: Object,
  loading: Boolean,
  unreadExploreSpacesCount: Number,
  unreadFollowingSpacesCount: Number,
  unreadEveryoneSpacesCount: Number
})
watch(() => props.visible, (value, prevValue) => {
  store.commit('clearNotificationsWithPosition')
  if (value) {
    updateHeights()
    updateUserShowInExploreUpdatedAt()
    store.commit('shouldExplicitlyHideFooter', true)
  } else {
    state.exploreRssFeedsIsVisible = false
    store.commit('shouldExplicitlyHideFooter', false)
  }
})

const state = reactive({
  dialogHeight: null,
  resultsSectionHeight: null,
  userShowInExploreDate: null,
  exploreRssFeedsIsVisible: false,
  filteredSpaces: undefined,
  currentSection: 'explore', // 'explore', 'following', 'everyone'
  isReadSections: [] // 'explore', 'following', 'everyone'
})

const currentSpace = computed(() => store.state.currentSpace)
const changeSpace = (space) => {
  closeDialogs()
  store.dispatch('currentSpace/changeSpace', space)
}
const closeDialogs = () => {
  state.exploreRssFeedsIsVisible = false
}

// update height

const parentDialog = computed(() => 'explore')
const updateHeights = async () => {
  await nextTick()
  updateDialogHeight()
  updateResultsSectionHeight()
}
const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}
const updateResultsSectionHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = resultsElement.value
  state.resultsSectionHeight = utils.elementHeight(element, true)
}

// unread sections

watch(() => state.currentSection, (value, prevValue) => {
  state.isReadSections.push(prevValue)
})
const isUnreadExplore = computed(() => {
  if (state.isReadSections.includes('explore')) {
    return false
  }
  return Boolean(props.unreadExploreSpacesCount)
})
const isUnreadFollowing = computed(() => {
  if (state.isReadSections.includes('following')) {
    return false
  }
  return Boolean(props.unreadFollowingSpacesCount)
})
const isUnreadEveryone = computed(() => {
  if (state.isReadSections.includes('everyone')) {
    return false
  }
  return Boolean(props.unreadEveryoneSpacesCount)
})

// current section

const updateCurrentSection = (value) => {
  state.currentSection = value
  updateHeights()
}
const currentSectionIsExplore = computed(() => state.currentSection === 'explore')
const currentSectionIsFollowing = computed(() => state.currentSection === 'following')
const currentSectionIsEveryone = computed(() => state.currentSection === 'everyone')
const currentSpaces = computed(() => {
  let spaces
  if (currentSectionIsExplore.value) {
    spaces = props.exploreSpaces
  } else if (currentSectionIsFollowing.value) {
    spaces = props.followingSpaces
  } else if (currentSectionIsEveryone.value) {
    spaces = props.everyoneSpaces
  }
  return spaces || []
})

// explore spaces

const currentSpaceInExplore = computed(() => currentSpace.value.showInExplore)
const updateUserShowInExploreUpdatedAt = async () => {
  state.userShowInExploreDate = store.state.currentUser.showInExploreUpdatedAt
  let serverDate = await store.dispatch('api/getDate')
  serverDate = serverDate.date
  store.dispatch('currentUser/showInExploreUpdatedAt', serverDate)
}

// blank slate info

const followUsersInfoIsVisible = computed(() => {
  const isFavoriteUsers = Boolean(store.state.currentUser.favoriteUsers.length)
  return !props.loading && !isFavoriteUsers && currentSectionIsFollowing.value
})
const randomUser = computed(() => {
  const luminosity = store.state.currentUser.theme
  const color = randomColor({ luminosity })
  return { color, id: '123' }
})

// rss

const toggleExploreRssFeedsIsVisible = () => {
  state.exploreRssFeedsIsVisible = !state.exploreRssFeedsIsVisible
}
const rssButtonIsVisible = computed(() => !currentSectionIsFollowing.value)

</script>

<template lang="pug">
dialog.explore.wide(v-if="visible" :open="visible" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}" @click.left.stop='closeDialogs')
  section(v-if="visible" :open="visible")
    .row.title-row
      .segmented-buttons
        button(:class="{active: currentSectionIsExplore}" @click="updateCurrentSection('explore')")
          img.icon.sunglasses(src="@/assets/sunglasses.svg")
          span Explore
          .badge.new-unread-badge.notification-button-badge(v-if="isUnreadExplore")
        button(:class="{active: currentSectionIsFollowing}" @click="updateCurrentSection('following')")
          span Following
          .badge.new-unread-badge.notification-button-badge(v-if="isUnreadFollowing")
        button(:class="{active: currentSectionIsEveryone}" @click="updateCurrentSection('everyone')")
          span Everyone
          .badge.new-unread-badge.notification-button-badge(v-if="isUnreadEveryone")

    //- follow users blank slate
    section.subsection(v-if="followUsersInfoIsVisible")
      p Follow other people to see their latest updates here
      p.badge.secondary
        UserLabelInline(:user="randomUser" :isClickable="false" :key="randomUser.id" :isSmall="true" :hideYouLabel="true")
        span → Follow

  section
    .row.title-row
      //- current section descriptions
      div
        Loader(:isSmall="true" :visible="props.loading")
        span(v-if="currentSectionIsExplore") Shared with the community
        span(v-else-if="currentSectionIsFollowing") Recently updated by people you follow
        span(v-else-if="currentSectionIsEveryone") All new public spaces
      //- rss
      .button-wrap.rss-button-wrap(v-if="rssButtonIsVisible")
        button.small-button(@click.stop="toggleExploreRssFeedsIsVisible" :class="{active: state.exploreRssFeedsIsVisible}" title="RSS Feeds")
          span RSS
        ExploreRssFeeds(:visible="state.exploreRssFeedsIsVisible")

  section.results-section(ref="resultsElement" :style="{'max-height': state.resultsSectionHeight + 'px'}")
    SpaceList(
      :spaces="currentSpaces"
      :showUser="true"
      @selectSpace="changeSpace"
      :userShowInExploreDate="state.userShowInExploreDate"
      :spaceReadDateType="state.currentSection"
      :resultsSectionHeight="state.resultsSectionHeight"
      :parentDialog="parentDialog"
      :previewImageIsWide="true"
      :hideFilter="true"
      :showCollaborators="true"
    )
</template>

<style lang="stylus">
dialog.explore
  left initial
  right -35px
  overflow auto
  .loader
    margin-right 5px
    vertical-align -2px
  .segmented-buttons
    button
      position relative
</style>
