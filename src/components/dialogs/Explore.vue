<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import SpaceList from '@/components/SpaceList.vue'
import ExploreRssFeeds from '@/components/dialogs/ExploreRssFeeds.vue'
import Loader from '@/components/Loader.vue'
import User from '@/components/User.vue'
import utils from '@/utils.js'

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
  loading: Boolean
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
  currentSection: 'explore' // 'explore', 'following', 'everyone'
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

// rss

const toggleExploreRssFeedsIsVisible = () => {
  state.exploreRssFeedsIsVisible = !state.exploreRssFeedsIsVisible
}

// space list

const showCollaborators = computed(() => currentSectionIsExplore.value || currentSectionIsEveryone.value)
const showUserLabelInline = computed(() => currentSectionIsFollowing.value)
</script>

<template lang="pug">
dialog.explore.wide(v-if="visible" :open="visible" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}" @click.left.stop='closeDialogs')
  section(v-if="visible" :open="visible")
    .row.title-row
      .segmented-buttons
        button(:class="{active: currentSectionIsExplore}" @click="updateCurrentSection('explore')")
          img.icon.sunglasses(src="@/assets/sunglasses.svg")
          span Explore
        button(:class="{active: currentSectionIsFollowing}" @click="updateCurrentSection('following')")
          span Following
        button(:class="{active: currentSectionIsEveryone}" @click="updateCurrentSection('everyone')")
          span Everyone

  section
    .row.title-row
      div
        Loader(:isSmall="true" :visible="props.loading")
        span(v-if="currentSectionIsExplore") Shared with the community
        span(v-else-if="currentSectionIsFollowing") Updated by people you follow
        span(v-else-if="currentSectionIsEveryone") All new public spaces

      //- rss
      .button-wrap.rss-button-wrap
        button.small-button(@click.stop="toggleExploreRssFeedsIsVisible" :class="{active: state.exploreRssFeedsIsVisible}" title="RSS Feeds")
          span RSS
        ExploreRssFeeds(:visible="state.exploreRssFeedsIsVisible")

  section.results-section(ref="resultsElement" :style="{'max-height': state.resultsSectionHeight + 'px'}")
    SpaceList(
      :spaces="currentSpaces"
      :showUser="true"
      @selectSpace="changeSpace"
      :userShowInExploreDate="state.userShowInExploreDate"
      :resultsSectionHeight="state.resultsSectionHeight"
      :parentDialog="parentDialog"
      :previewImageIsWide="true"
      :hideFilter="true"
      :showCollaborators="showCollaborators"
      :showUserLabelInline="showUserLabelInline"
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

</style>
