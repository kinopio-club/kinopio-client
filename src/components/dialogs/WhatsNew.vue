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
  newStuff: Array
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

const isOnline = computed(() => store.state.isOnline)

const updateUserLastRead = () => {
  if (!props.newStuff.length) { return }
  const lastReadNewStuffId = props.newStuff[0].id
  store.dispatch('currentUser/lastReadNewStuffId', lastReadNewStuffId)
}
const assetUrl = (string) => {
  const url = utils.urlFromString(string)
  if (url) {
    return url
  } else {
    // /assets/posts/xyz.jpg
    return `${consts.blogHost()}${string}`
  }
}
</script>

<template lang="pug">
dialog.whats-new(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    p What's New
    .button-wrap
      a(href="https://kinopio.club/-kinopio-roadmap-6TRE21gchHI7alHLuwzd5")
        button
          span Roadmap{{' '}}
          img.icon.visit(src="@/assets/visit.svg")

    .button-wrap
      a(href="https://blog.kinopio.club")
        button
          span Blog{{' '}}
          img.icon.visit(src="@/assets/visit.svg")

  section(v-if="!props.newStuff.length")
    Loader(:visible="true")

  section
    template(v-for="item in props.newStuff" :key="item.id")
      a(:href="item.url" target="_blank")
        article.badge.button-badge(:style="{ backgroundColor: item._meta.color }")
          //- media
          template(v-if="item._meta.image && isOnline")
            img(:src="assetUrl(item._meta.image)")
          template(v-else-if="item._meta.video")
            video(autoplay loop muted playsinline)
              source(:src="assetUrl(item._meta.video)")
          //- title
          h1 {{item.title}}
          //- summary
          p.summary {{item.summary}}
    .button-wrap
      a(href="https://blog.kinopio.club")
        button
          span Read All{{' '}}
          img.icon.visit(src="@/assets/visit.svg")
</template>

<style lang="stylus">
.whats-new
  overflow auto
  max-height calc(100vh - 210px)
  @media(max-height 500px)
    top -100px !important
  a
    text-decoration none
  article
    padding 8px
    border-radius var(--entity-radius)
    margin 0
    margin-bottom 10px
    padding-bottom 10px
    &:hover
      box-shadow 4px 4px 0 var(--heavy-shadow) !important
    &:active
      box-shadow var(--button-active-inset-shadow) !important
    h1,
    p.summary
      color var(--primary-on-light-background)
    img,
    video
      max-width 100%
      border-radius var(--entity-radius)
      margin-bottom 10px

  h1
    font-family var(--header-font-0)
    font-size 16px
    font-weight normal
    text-decoration none
    margin-bottom 10px
    margin-top 0
    &:hover
      text-decoration none
</style>
