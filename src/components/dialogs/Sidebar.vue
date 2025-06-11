<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'

import Links from '@/components/sidebar/Links.vue'
import Tags from '@/components/sidebar/Tags.vue'
import Removed from '@/components/sidebar/Removed.vue'
import Stats from '@/components/sidebar/Stats.vue'
import Inbox from '@/components/sidebar/Inbox.vue'
import Favorites from '@/components/sidebar/Favorites.vue'
import History from '@/components/sidebar/History.vue'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const dialogElement = ref(null)
let unsubscribes

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)

  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerRemovedIsVisible') {
        toggleSection('removed')
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDialogHeight)
  unsubscribes()
})

const props = defineProps({
  visible: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    restoreUserLastSidebarSection()
    updateDialogHeight()
    globalStore.shouldExplicitlyHideFooter = true
  } else {
    globalStore.shouldExplicitlyHideFooter = false
  }
})

const state = reactive({
  dialogHeight: null,
  tagsIsVisible: false,
  linksIsVisible: false,
  removedIsVisible: false,
  inboxIsVisible: false,
  statsIsVisible: false,
  favoritesIsVisible: false,
  historyIsVisible: false
})

const clearVisible = () => {
  state.linksIsVisible = false
  state.tagsIsVisible = false
  state.removedIsVisible = false
  state.inboxIsVisible = false
  state.statsIsVisible = false
  state.favoritesIsVisible = false
  state.historyIsVisible = false
}

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

// pin dialog

const dialogIsPinned = computed(() => globalStore.sidebarIsPinned)
const toggleDialogIsPinned = () => {
  const isPinned = !dialogIsPinned.value
  globalStore.sidebarIsPinned = isPinned
}
const closeDialogs = () => {
  globalStore.tagDetailsIsVisible = false
  globalStore.triggerCloseChildDialogs()
}

// current section

const toggleSection = (value) => {
  clearVisible()
  state[`${value}IsVisible`] = true
  updateUserLastSidebarSection(value)
}

// last sidebar section

const restoreUserLastSidebarSection = () => {
  clearVisible()
  const section = userStore.lastSidebarSection
  const values = ['stats', 'inbox', 'removed', 'links', 'tags', 'favorites', 'history'] // listed in api docs
  const isValid = values.includes(section)
  if (section && isValid) {
    state[section + 'IsVisible'] = true
  } else {
    state.inboxIsVisible = true
  }
}
const updateUserLastSidebarSection = (name) => {
  userStore.updateUser({ lastSidebarSection: name })
}

</script>

<template lang="pug">
dialog#sidebar.sidebar.is-pinnable(
  v-if="visible"
  :open="visible"
  @click.left.stop="closeDialogs"
  ref="dialogElement"
  :style="{'max-height': state.dialogHeight + 'px'}"
  :data-is-pinned="dialogIsPinned"
  :class="{'is-pinned': dialogIsPinned}"
)
  section
    .row.title-row-flex
      .button-wrap.segmented-buttons-wrap
        //- first row
        .segmented-buttons
          //- Inbox
          button(@click.left="toggleSection('inbox')" :class="{ active: state.inboxIsVisible}" title="Move from Inbox")
            img.icon(src="@/assets/inbox.svg")
          //- Tags
          button(@click.left="toggleSection('tags')" :class="{ active: state.tagsIsVisible}" title="Space Tags")
            span Tags
          //- Links
          button(@click.left="toggleSection('links')" :class="{ active: state.linksIsVisible}" title="Backlinks")
            span Links
        //- second row
        .segmented-buttons
          //- Favorites
          button(@click.left="toggleSection('favorites')" :class="{ active: state.favoritesIsVisible}" title="Favorites")
            img.icon(src="@/assets/heart-empty.svg")
          //- Stats
          button(@click.left="toggleSection('stats')" :class="{active: state.statsIsVisible}" title="Stats")
            img.icon.stats(src="@/assets/stats.svg")
          //- Removed
          button(@click.left="toggleSection('removed')" :class="{ active: state.removedIsVisible}" title="Removed Cards and Spaces")
            img.icon(src="@/assets/remove.svg")
            img.icon.remove-undo(src="@/assets/undo.svg")
          //- Favorites
          button(@click.left="toggleSection('history')" :class="{ active: state.historyIsVisible}" title="Space History")
            img.icon.time(src="@/assets/time.svg")

      //- Pin
      .title-row
        .button-wrap(@click.left="toggleDialogIsPinned" title="Pin dialog")
          button.small-button(:class="{active: dialogIsPinned}")
            img.icon.pin.right-pin(src="@/assets/pin.svg")

  Tags(:visible="state.tagsIsVisible" :parentIsPinned="dialogIsPinned")
  Links(:visible="state.linksIsVisible" :parentIsPinned="dialogIsPinned")
  Removed(:visible="state.removedIsVisible")
  Stats(:visible="state.statsIsVisible")
  Inbox(:visible="state.inboxIsVisible")
  Favorites(:visible="state.favoritesIsVisible")
  History(:visible="state.historyIsVisible")

</template>

<style lang="stylus">
.sidebar
  top calc(100% - 8px)
  left initial
  right 8px
  max-height calc(100vh - 25px)
  overflow auto
  &.is-pinned
    top 0
    right 0
  .title-row-flex
    align-items flex-start
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
  .icon.time
    vertical-align -1px

  .segmented-buttons + .segmented-buttons
    margin-left 0

  .segmented-buttons-wrap
    .segmented-buttons
      &:first-child
        button,
        label
          &:last-child
            border-bottom-right-radius 0
      // middle row
      // &:nth-child(2)
      //   margin-top -1px
      //   button,
      //   label
      //     &:first-child
      //       border-top-left-radius 0
      //       border-bottom-left-radius 0
      //     // &:last-child
      //       // border-top-right-radius 0
      // last row
      &:last-child
        button,
        label
          &:first-child
            border-top-left-radius 0
          &:last-child
            border-top-right-radius var(--entity-radius)

</style>
