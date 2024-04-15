<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import Links from '@/components/Links.vue'
import Tags from '@/components/Tags.vue'
import Comments from '@/components/Comments.vue'
import Removed from '@/components/Removed.vue'
import AIImages from '@/components/AIImages.vue'
import Stats from '@/components/Stats.vue'
import Text from '@/components/Text.vue'
import Inbox from '@/components/Inbox.vue'
import Favorites from '@/components/Favorites.vue'

const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    } else if (mutation.type === 'triggerRemovedIsVisible') {
      triggerRemovedIsVisible()
    } else if (mutation.type === 'triggerAIImagesIsVisible') {
      triggerAIImagesIsVisible()
    }
  })
})

const props = defineProps({
  visible: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    restoreUserLastSidebarSection()
    updateDialogHeight()
    store.commit('shouldExplicitlyHideFooter', true)
  } else {
    store.commit('shouldExplicitlyHideFooter', false)
  }
})

const state = reactive({
  dialogHeight: null,
  tagsIsVisible: false,
  linksIsVisible: false,
  commentsIsVisible: false,
  removedIsVisible: false,
  AIImagesIsVisible: false,
  inboxIsVisible: false,
  statsIsVisible: false,
  textIsVisible: false,
  favoritesIsVisible: false
})

const clearVisible = () => {
  state.linksIsVisible = false
  state.tagsIsVisible = false
  state.commentsIsVisible = false
  state.removedIsVisible = false
  state.AIImagesIsVisible = false
  state.inboxIsVisible = false
  state.statsIsVisible = false
  state.textIsVisible = false
  state.favoritesIsVisible = false
}

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

// pin dialog

const dialogIsPinned = computed(() => store.state.sidebarIsPinned)
const toggleDialogIsPinned = () => {
  const isPinned = !dialogIsPinned.value
  store.dispatch('sidebarIsPinned', isPinned)
}
const closeDialogs = () => {
  store.commit('tagDetailsIsVisible', false)
  store.commit('triggerCloseChildDialogs')
}

// current section

const triggerRemovedIsVisible = async () => {
  await nextTick()
  clearVisible()
  state.removedIsVisible = true
}
const triggerAIImagesIsVisible = async () => {
  await nextTick()
  clearVisible()
  state.AIImagesIsVisible = true
}
const toggleTagsIsVisible = () => {
  clearVisible()
  state.tagsIsVisible = true
  updateUserLastSidebarSection('tags')
}
const toggleLinksIsVisible = () => {
  clearVisible()
  state.linksIsVisible = true
  updateUserLastSidebarSection('links')
}
const toggleCommentsIsVisible = () => {
  clearVisible()
  state.commentsIsVisible = true
  updateUserLastSidebarSection('comments')
}
const toggleRemovedIsVisible = () => {
  clearVisible()
  state.removedIsVisible = true
  updateUserLastSidebarSection('removed')
}
const toggleInboxIsVisible = () => {
  clearVisible()
  state.inboxIsVisible = true
  updateUserLastSidebarSection('inbox')
}
const toggleAIImagesIsVisible = () => {
  clearVisible()
  state.AIImagesIsVisible = true
  updateUserLastSidebarSection('AIImages')
}
const toggleStatsIsVisible = () => {
  clearVisible()
  state.statsIsVisible = true
  updateUserLastSidebarSection('stats')
}
const toggleTextIsVisible = () => {
  clearVisible()
  state.textIsVisible = true
  updateUserLastSidebarSection('text')
}
const toggleFavoritesIsVisible = () => {
  clearVisible()
  state.favoritesIsVisible = true
  updateUserLastSidebarSection('favorites')
}

// last sidebar section

const restoreUserLastSidebarSection = () => {
  clearVisible()
  const section = store.state.currentUser.lastSidebarSection
  const values = ['text', 'stats', 'AIImages', 'inbox', 'removed', 'comments', 'links', 'tags'] // listed in api docs
  const isValid = values.includes(section)
  if (section && isValid) {
    state[section + 'IsVisible'] = true
  } else {
    state.textIsVisible = true
  }
}
const updateUserLastSidebarSection = (name) => {
  store.dispatch('currentUser/update', { lastSidebarSection: name })
}

</script>

<template lang="pug">
dialog#sidebar.sidebar.is-pinnable(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}" :data-is-pinned="dialogIsPinned" :class="{'is-pinned': dialogIsPinned}")
  section
    .row.title-row-flex
      .button-wrap.segmented-buttons-wrap
        //- first row
        .segmented-buttons
          //- Text
          button(@click.left="toggleTextIsVisible" :class="{active: state.textIsVisible}")
            span Text
          //- Tags
          button(@click.left="toggleTagsIsVisible" :class="{ active: state.tagsIsVisible}")
            span Tags
          //- Comments
          button(@click.left="toggleCommentsIsVisible" :class="{ active: state.commentsIsVisible}")
            img.icon.comment-icon(src="@/assets/comment.svg")
          //- Links
          button(@click.left="toggleLinksIsVisible" :class="{ active: state.linksIsVisible}")
            span Links
        //- second row
        .segmented-buttons
          //- Inbox
          button(@click.left="toggleInboxIsVisible" :class="{ active: state.inboxIsVisible}")
            img.icon(src="@/assets/inbox.svg")
          //- Favorites
          button(@click.left="toggleFavoritesIsVisible" :class="{ active: state.favoritesIsVisible}")
            img.icon(src="@/assets/heart-empty.svg")
          //- Stats
          button(@click.left="toggleStatsIsVisible" :class="{active: state.statsIsVisible}")
            img.icon.stats(src="@/assets/stats.svg")
          //- AI Images
          button(@click.left="toggleAIImagesIsVisible" :class="{ active: state.AIImagesIsVisible}")
            img.icon.flower(src="@/assets/flower.svg")
            span AI
          //- Removed
          button(@click.left="toggleRemovedIsVisible" :class="{ active: state.removedIsVisible}")
            img.icon(src="@/assets/remove.svg")
            img.icon.remove-undo(src="@/assets/undo.svg")

      //- Pin
      .title-row
        .button-wrap(@click.left="toggleDialogIsPinned" title="Pin dialog")
          button.small-button(:class="{active: dialogIsPinned}")
            img.icon.pin.right-pin(src="@/assets/pin.svg")

  Tags(:visible="state.tagsIsVisible" :parentIsPinned="dialogIsPinned")
  Links(:visible="state.linksIsVisible" :parentIsPinned="dialogIsPinned")
  Comments(:visible="state.commentsIsVisible")
  Removed(:visible="state.removedIsVisible")
  AIImages(:visible="state.AIImagesIsVisible")
  Stats(:visible="state.statsIsVisible")
  Text(:visible="state.textIsVisible")
  Inbox(:visible="state.inboxIsVisible")
  Favorites(:visible="state.favoritesIsVisible")

</template>

<style lang="stylus">
.sidebar
  top calc(100% - 8px)
  left initial
  right 8px
  max-height calc(100vh - 25px)
  overflow auto
  &.is-pinned
    top -13px
  .title-row-flex
    align-items flex-start
    .comment-icon
      vertical-align -2px
  .right-pin
    transform rotate(180deg)
  .tags,
  .removed
    section
      &:first-child
        border-top-left-radius 0
        border-top-right-radius 0
  .icon.flower
    vertical-align -1px
    height 11px

  .segmented-buttons-wrap
    .segmented-buttons
      &:first-child
        button,
        label
          &:last-child
            border-bottom-right-radius 0
      &:last-child
        button,
        label
          &:first-child
            border-top-left-radius 0
          &:last-child
            border-top-right-radius var(--entity-radius)

</style>
