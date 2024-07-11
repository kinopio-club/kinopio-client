<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import WhatsNew from '@/components/dialogs/WhatsNew.vue'
import AppsAndExtensions from '@/components/dialogs/AppsAndExtensions.vue'
import Help from '@/components/dialogs/Help.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'
import AboutMe from '@/components/AboutMe.vue'

import dayjs from 'dayjs'

const store = useStore()

const dialogElement = ref(null)
const initTime = dayjs(new Date())
let checkKinopioUpdatesIntervalTimer

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'closeAllDialogs') {
      hideWhatsNewIsVisible()
    }
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    }
  })
  const isOffline = !store.state.isOnline
  if (isOffline) { return }
  initBlogPosts()
})

const props = defineProps({
  visible: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  if (value && state.blogPosts.length) {
    checkBlogPostsIsUpdated(state.blogPosts[0].id)
  }
  if (value) {
    closeDialogs()
    updateDialogHeight()
    store.commit('shouldExplicitlyHideFooter', true)
  } else {
    store.commit('shouldExplicitlyHideFooter', false)
  }
})

const state = reactive({
  whatsNewIsVisible: false,
  appsAndExtensionsIsVisible: false,
  helpIsVisible: false,
  blogPosts: [],
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
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

// new stuff

const initBlogPosts = async () => {
  await updateBlogPosts()
  if (!utils.arrayHasItems(state.blogPosts)) { return }
  checkBlogPostsIsUpdated(state.blogPosts[0].id)
  checkKinopioUpdatesIntervalTimer = setInterval(() => {
    checkIfKinopioUpdatesAreAvailable()
  }, 1000 * 60 * 60 * 1) // 1 hour
}
const blogPostsIsUpdated = computed(() => store.state.blogPostsIsUpdated)
const updateBlogPosts = async () => {
  try {
    let posts = await store.dispatch('api/getBlogPosts')
    if (!posts) { return }
    posts = posts.slice(0, 20)
    if (isSecureAppContextIOS.value) {
      posts = posts.filter(post => {
        return !post.title.includes('Lifetime Plan')
      })
    }
    state.blogPosts = posts
  } catch (error) {
    console.error('🚒 updateBlogPosts', error)
  }
}
const checkBlogPostsIsUpdated = (newId) => {
  const prevId = store.state.currentUser.lastReadBlogPostId
  const isUpdated = parseInt(prevId) < parseInt(newId)
  store.commit('blogPostsIsUpdated', isUpdated)
}
const checkIfKinopioUpdatesAreAvailable = async () => {
  await updateBlogPosts()
  if (!state.blogPosts.length) { return }
  let newest = state.blogPosts[0]
  newest = dayjs(newest.date_published)
  const timeSinceNewest = initTime.diff(newest, 'minute')
  if (timeSinceNewest < 0) {
    store.commit('notifyKinopioUpdatesAreAvailable', true)
  }
}

// donate

const triggerDonateIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerDonateIsVisible')
}

// what's new
const hideWhatsNewIsVisible = () => {
  state.whatsNewIsVisible = false
}
const toggleWhatsNewIsVisible = () => {
  const isVisible = state.whatsNewIsVisible
  closeDialogs()
  state.whatsNewIsVisible = !isVisible
  store.commit('blogPostsIsUpdated', false)
}

// keyboard shortcuts

const toggleKeyboardShortcutsIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerKeyboardShortcutsIsVisible')
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

// links

const changeSpaceToRoadmap = () => {
  const space = { id: consts.roadmapSpaceId() }
  store.dispatch('currentSpace/changeSpace', space)
}
const changeSpaceToBlog = () => {
  const space = { id: consts.blogSpaceId() }
  store.dispatch('currentSpace/changeSpace', space)
}
const discordUrl = computed(() => consts.discordUrl)
const roadmapUrl = computed(() => consts.roadmapUrl())
const blogUrl = computed(() => consts.blogUrl())

</script>

<template lang="pug">
dialog.about.narrow(v-if="visible" :open="visible" @click.left="closeDialogs" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}" :class="{ overflow: !childDialogIsVisible }")
  section
    .row.title-row
      p About Kinopio
      span
        button.small-button(@click.left="refreshBrowser" title="Refresh")
          img.refresh.icon(src="@/assets/refresh.svg")

  section
    .row
      p Thinking canvas for new ideas and hard problems
    .row
      .button-wrap
        button(@click.stop="toggleHelpIsVisible" :class="{active: state.helpIsVisible}")
          span Help
        Help(:visible="state.helpIsVisible")
      .button-wrap
        a(:href="roadmapUrl")
          button(@click.left.stop="changeSpaceToRoadmap")
            span 💐 Roadmap
    .row
      .button-wrap
        .segmented-buttons
          button(@click.left.stop="changeSpaceToBlog")
            span Blog
          button(@click.left.stop="toggleWhatsNewIsVisible" :class="{active: state.whatsNewIsVisible}")
            span What's New
            img.updated.icon(src="@/assets/updated.gif" v-if="blogPostsIsUpdated")
        WhatsNew(:visible="state.whatsNewIsVisible" :blogPosts="state.blogPosts")

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
    .row
      AboutMe
    .row
      .button-wrap
        a(:href="discordUrl")
          button
            span Discord{{' '}}
            img.icon.visit(src="@/assets/visit.svg")
      .button-wrap
        a(href="https://club.kinopio.club")
          button
            span Forum{{' '}}
            img.icon.visit(src="@/assets/visit.svg")
    .row
      .button-wrap(v-if="!isSecureAppContextIOS")
        button(@click.left.stop="triggerDonateIsVisible")
          img.icon(src="@/assets/heart-empty.svg")
          span Donate

    //- .row
    //-   .button-wrap
    //-     a(href="https://kinopio.club/social-media-plezJhK98WCzh52YOYSLR")
    //-       button
    //-         span Social Media{{' '}}
    //-         img.icon.visit(src="@/assets/visit.svg")
</template>

<style lang="stylus">
.about
  top calc(100% - 6px) !important
  &.overflow
    overflow auto
  .updated
    margin 0
    margin-left 3px
  .keyboard-shortcut
    padding 0 4px !important
  .about-video
    border-radius var(--entity-radius)
</style>
