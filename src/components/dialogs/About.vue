<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useChangelogStore } from '@/stores/useChangelogStore'

import AppsAndExtensions from '@/components/dialogs/AppsAndExtensions.vue'
import Help from '@/components/dialogs/Help.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'
import WhoMakesKinopio from '@/components/WhoMakesKinopio.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'

import dayjs from 'dayjs'

const globalStore = useGlobalStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()
const changelogStore = useChangelogStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDialogHeight)
})

const props = defineProps({
  visible: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    closeDialogs()
    updateDialogHeight()
    globalStore.shouldExplicitlyHideFooter = true
  } else {
    globalStore.shouldExplicitlyHideFooter = false
  }
})

const state = reactive({
  whatsNewIsVisible: false,
  appsAndExtensionsIsVisible: false,
  helpIsVisible: false,
  dialogHeight: null
})

const childDialogIsVisible = computed(() => {
  return state.whatsNewIsVisible || state.appsAndExtensionsIsVisible || state.helpIsVisible
})
const isSecureAppContextIOS = computed(() => consts.isSecureAppContextIOS)
const refreshBrowser = () => {
  window.location.reload()
}
const closeDialogs = () => {
  state.whatsNewIsVisible = false
  state.appsAndExtensionsIsVisible = false
  state.helpIsVisible = false
}
const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

// spaces

const currentSpaceIsChangelog = computed(() => spaceStore.id === consts.changelogSpaceId())
const currentSpaceIsAffiliate = computed(() => spaceStore.id === consts.affiliateSpaceId())
const currentSpaceIsRoadmap = computed(() => spaceStore.id === consts.roadmapSpaceId())
const changeSpaceToChangelog = () => {
  const space = { id: consts.changelogSpaceId() }
  const changelogId = changelogStore.updates[0]?.id
  if (changelogId) {
    cache.updatePrevReadChangelogId(changelogId)
    changelogStore.isUpdated = false
  }
  spaceStore.changeSpace(space)
}
const changeSpaceToAffiliate = () => {
  const space = { id: consts.affiliateSpaceId() }
  spaceStore.changeSpace(space)
}
const changeSpaceToRoadmap = () => {
  const space = { id: consts.roadmapSpaceId() }
  spaceStore.changeSpace(space)
}

// donate

const triggerDonateIsVisible = () => {
  globalStore.closeAllDialogs()
  globalStore.triggerDonateIsVisible()
}

// keyboard shortcuts

const toggleKeyboardShortcutsIsVisible = () => {
  globalStore.closeAllDialogs()
  globalStore.triggerKeyboardShortcutsIsVisible()
}

// apps and extensions

const toggleAppsAndExtensionsIsVisible = () => {
  const isVisible = state.appsAndExtensionsIsVisible
  closeDialogs()
  state.appsAndExtensionsIsVisible = !isVisible
}

// help

const toggleHelpIsVisible = () => {
  const isVisible = state.helpIsVisible
  closeDialogs()
  state.helpIsVisible = !isVisible
}
</script>

<template lang="pug">
dialog.about.narrow(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}" :class="{ overflow: !childDialogIsVisible }")
  section.title-section
    .row.title-row
      router-link(to="/about")
        button.small-button About Kinopio
      .title-controls
        .segmented-buttons
          ThemeToggle(:isSmall="true")
        button.small-button(@click.left="refreshBrowser" title="Refresh")
          img.refresh.icon(src="@/assets/refresh.svg")

  section
    .row
      p Collect and connect your thoughts, ideas, and feelings
    .row
      .button-wrap
        button(@click.stop="toggleHelpIsVisible" :class="{active: state.helpIsVisible}")
          span Help
        Help(:visible="state.helpIsVisible")
      .button-wrap
        a(href="/roadmap")
          button(@click.left.stop.prevent="changeSpaceToRoadmap" :class="{ active: currentSpaceIsRoadmap }")
            span 💐 Roadmap
    .row
      .button-wrap
        a(href="/changelog")
          button(@click.left.stop.prevent="changeSpaceToChangelog" :class="{ active: currentSpaceIsChangelog }")
            span Changelog
            img.updated.icon(src="@/assets/updated.gif")
    .row
      .button-wrap
        a(href="https://kinopio.club/friends-of-kinopio-affiliate-program-YNmS6C3fofN3R9mYgO1Bu")
          button(@click.left.stop.prevent="changeSpaceToAffiliate" :class="{ active: currentSpaceIsAffiliate }")
            span Affiliate Program
            img.new.icon(src="@/assets/new.gif")

            //- v-if="changelogIsUpdated"
    //- .row
    //-   a(href="https://kinopio.club/pop-up-shop-u9XxpuIzz2_LvQUAayl65")
    //-     button
    //-       img.icon(src="@/assets/sticker.svg")
    //-       span Pop Up Shop{{' '}}
              //- img.icon.visit(src="@/assets/visit.svg")
  section
    .row
      .button-wrap
        button(@click.left.stop="toggleAppsAndExtensionsIsVisible" :class="{active: state.appsAndExtensionsIsVisible}")
          img.icon.system(src="@/assets/system.svg")
          span Apps and Extensions
        AppsAndExtensions(:visible="state.appsAndExtensionsIsVisible")
    .row
      .button-wrap
        button(@click.left.stop="toggleKeyboardShortcutsIsVisible")
          .badge.keyboard-shortcut.badge-in-button ?
          span Keyboard Shortcuts
  section
    .row
      p 100% funded and made possible by people like you
      //- The best way to support Kinopio is by spreading the word
    //- .row
    //-   .button-wrap
    //-     a(href="https://kinopio.club/blog")
    //-       button
    //-         span Help Spread the Word →
    .row
      .button-wrap(v-if="!isSecureAppContextIOS")
        button(@click.left.stop="triggerDonateIsVisible")
          img.icon(src="@/assets/heart-empty.svg")
          span Donate
    .row
      WhoMakesKinopio
  section
    .row
      .button-wrap
        a(href="https://kinopio.club/discord" target="_blank")
          button
            span Discord{{' '}}
            img.icon.visit(src="@/assets/visit.svg")
      .button-wrap
        a(href="https://kinopio.club/forum" target="_blank")
          button
            span Forum{{' '}}
            img.icon.visit(src="@/assets/visit.svg")
    .row
      .button-wrap
        a(href="https://kinopio.club/blog" target="_blank")
          button
            span Blog{{' '}}
            img.icon.visit(src="@/assets/visit.svg")

</template>

<style lang="stylus">
dialog.about
  top calc(100% - 6px) !important
  &.overflow
    overflow auto
  .updated.icon,
  .new.icon
    margin 0
    margin-left 3px
  .keyboard-shortcut
    padding 0 4px !important
  .about-video
    border-radius var(--entity-radius)
  .icon.system
    vertical-align -1px
  .title-controls
    display flex
    .segmented-buttons
      margin-right 6px
  dialog.apps
    left 8px
</style>
