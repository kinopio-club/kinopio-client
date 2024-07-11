<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'

const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  store.subscribe(mutation => {
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    } else if (mutation.type === 'closeAllDialogs' && props.visible) {
      updateUserLastRead()
    }
  })
})

const props = defineProps({
  visible: Boolean,
  blogPosts: Array
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
  } else {
    updateUserLastRead()
  }
})

const state = reactive({
  dialogHeight: null
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const updateUserLastRead = () => {
  if (!props.blogPosts.length) { return }
  const lastReadBlogPostId = props.blogPosts[0].id
  store.dispatch('currentUser/lastReadBlogPostId', lastReadBlogPostId)
}

const isUnread = (post) => {
  let lastReadBlogPostId = store.state.currentUser.lastReadBlogPostId
  lastReadBlogPostId = parseInt(lastReadBlogPostId)
  return post.id > lastReadBlogPostId
}

// blog posts

const relativeDate = (post) => {
  return utils.shortRelativeTime(post.createdAt)
}
</script>

<template lang="pug">
dialog.whats-new.narrow(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section.section-title
    .row.title-row
      span What's New

  section(v-if="!props.blogPosts.length")
    Loader(:visible="true")

  section.results-section
    ul.results-list.user-list
      template(v-for="post in props.blogPosts" :key="post.id")
        a(:href="post.cardUrl" target="_blank")
          li
            .badge.info.new-unread-badge(v-if="isUnread(post)")
            .row
              //- title
              span.badge.info {{post.title}}
            .row
              p
                //- date
                span.badge.status.inline-badge
                  img.icon.time(src="@/assets/time.svg")
                  span {{ relativeDate(post) }}
                //- description
                span {{post.description}}
</template>

<style lang="stylus">
dialog.whats-new
  overflow auto
  max-height calc(100vh - 210px)
  @media(max-height 500px)
    top -100px !important
  ul.results-list
    li
      display block
    .status
      flex-shrink 0
    .row
      margin 0
  a
    text-decoration none
</style>
