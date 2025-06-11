<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'

const globalStore = useGlobalStore()
const cardStore = useCardStore()

let unsubscribes

onMounted(() => {
  const globalStateUnsubscribe = globalStore.$subscribe(
    (mutation, state) => {
      const name = mutation.events.key
      const value = mutation.events.newValue
      if (name === 'isLoadingSpace') {
        updateImageUrls()
      }
    }
  )
  unsubscribes = () => {
    globalStateUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
})

const state = reactive({
  imageUrls: []
})

const updateImageUrls = () => {
  const cards = cardStore.getAllCards
  let urls = cards.map(card => card.urlPreviewImage)
  urls = urls.filter(url => Boolean(url))
  state.imageUrls = urls
}
</script>

<template lang="pug">
.preload
  template(v-for="url in state.imageUrls")
    img.hidden(:src="url")

  .icons.hidden
    //- logo
    img.icon(src="@/assets/logo-hover.png")
    img.icon(src="@/assets/logo-active.png")

    //- frames
    img(src="@/assets/frames/garden-leaves/flower.png")
    img(src="@/assets/frames/magical-helper/hat.png")
    img(src="@/assets/frames/tea-time/pot.png")
    img(src="@/assets/frames/dead-to-me/spooky-eyes.png")
    img(src="@/assets/frames/lil-guys/pot-standing-side.png")
    img(src="@/assets/frames/pen-pals/icon.png")

    //- icons
    img.icon(src="@/assets/add-invert.svg")
    img.icon(src="@/assets/add.svg")
    img.icon(src="@/assets/align-left-distributed.svg")
    img.icon(src="@/assets/align-left.svg")
    img.icon(src="@/assets/android-menu.svg")
    img.icon(src="@/assets/anon-avatar.svg")
    img.icon(src="@/assets/apple.svg")
    img.icon(src="@/assets/arena.svg")
    img.icon(src="@/assets/autoplay.svg")
    img.icon(src="@/assets/box-empty.svg")
    img.icon(src="@/assets/box-filled.svg")
    img.icon(src="@/assets/box-select.svg")
    img.icon(src="@/assets/box.svg")
    img.icon(src="@/assets/box-snap.svg")
    img.icon(src="@/assets/brush-y.svg")
    img.icon(src="@/assets/brush-x.svg")
    img.icon(src="@/assets/brush.svg")
    img.icon(src="@/assets/brush-size-l.svg")
    img.icon(src="@/assets/brush-size-m.svg")
    img.icon(src="@/assets/brush-size-s.svg")
    img.icon(src="@/assets/camera.svg")
    img.icon(src="@/assets/cal.svg")
    img.icon(src="@/assets/card.svg")
    img.icon(src="@/assets/center-horizontally.svg")
    img.icon(src="@/assets/checkmark-invert.svg")
    img.icon(src="@/assets/checkmark.svg")
    img.icon(src="@/assets/clover.svg")
    img.icon(src="@/assets/comment.svg")
    img.icon(src="@/assets/connect-items.svg")
    img.icon(src="@/assets/connection-clear.svg")
    img.icon(src="@/assets/connection-path-straight.svg")
    img.icon(src="@/assets/connection-path.svg")
    img.icon(src="@/assets/connection-reverse.svg")
    img.icon(src="@/assets/connector-closed-in-card.svg")
    img.icon(src="@/assets/connector-closed.svg")
    img.icon(src="@/assets/connector-open-in-card.svg")
    img.icon(src="@/assets/connector-open.svg")
    img.icon(src="@/assets/constrain-axis.svg")
    img.icon(src="@/assets/copy.svg")
    img.icon(src="@/assets/cut.svg")
    img.icon(src="@/assets/dark.svg")
    img.icon(src="@/assets/distribute-horizontally.svg")
    img.icon(src="@/assets/down-arrow.svg")
    img.icon.duplicate(src="@/assets/duplicate.svg")
    img.icon(src="@/assets/export.svg")
    img.icon(src="@/assets/emoji.svg")
    img.icon(src="@/assets/eraser.svg")
    img.icon(src="@/assets/file.svg")
    img.icon(src="@/assets/filter.svg")
    img.icon(src="@/assets/flower.svg")
    img.icon(src="@/assets/hand.svg")
    img.icon(src="@/assets/heart-empty.svg")
    img.icon(src="@/assets/heart.svg")
    img.icon(src="@/assets/homescreen.svg")
    img.icon(src="@/assets/inbox.svg")
    img.icon(src="@/assets/json-canvas.svg")
    img.icon(src="@/assets/leave.svg")
    img.icon(src="@/assets/light.svg")
    img.icon(src="@/assets/line-break.svg")
    img.icon(src="@/assets/lock.svg")
    img.icon(src="@/assets/luck.svg")
    img.icon(src="@/assets/key.svg")
    img.icon(src="@/assets/mail.svg")
    img.icon(src="@/assets/magnifying-glass.svg")
    img.icon(src="@/assets/magnifying-glass-negative.svg")
    img.icon(src="@/assets/marker.svg")
    img.icon(src="@/assets/merge.svg")
    img.icon(src="@/assets/minimap.svg")
    img.icon(src="@/assets/minus.svg")
    img.icon(src="@/assets/moon.svg")
    img.icon(src="@/assets/offline.svg")
    img.icon(src="@/assets/open.svg")
    img.icon(src="@/assets/openai.svg")
    img.icon(src="@/assets/pause.svg")
    img.icon(src="@/assets/pencil.svg")
    img.icon(src="@/assets/phone.svg")
    img.icon(src="@/assets/pin.svg")
    img.icon(src="@/assets/play.svg")
    img.icon(src="@/assets/presentation.svg")
    img.icon(src="@/assets/press-and-hold.svg")
    img.icon(src="@/assets/refresh.svg")
    img.icon(src="@/assets/remove.svg")
    img.icon(src="@/assets/resize-corner.svg")
    img.icon(src="@/assets/resize.svg")
    img.icon(src="@/assets/rss.svg")
    img.icon(src="@/assets/search.svg")
    img.icon(src="@/assets/settings.svg")
    img.icon(src="@/assets/share.svg")
    img.icon(src="@/assets/sidebar.svg")
    img.icon(src="@/assets/sign-out.svg")
    img.icon(src="@/assets/size-small.svg")
    img.icon(src="@/assets/size-medium.svg")
    img.icon(src="@/assets/size-large.svg")
    img.icon(src="@/assets/split-vertically.svg")
    img.icon(src="@/assets/split.svg")
    img.icon(src="@/assets/stats.svg")
    img.icon(src="@/assets/sticker.svg")
    img.icon(src="@/assets/sunglasses.svg")
    img.icon(src="@/assets/star.svg")
    img.icon(src="@/assets/system.svg")
    img.icon(src="@/assets/templates.svg")
    img.icon(src="@/assets/group.svg")
    img.icon(src="@/assets/time.svg")
    img.icon(src="@/assets/today.svg")
    img.icon(src="@/assets/transparent.svg")
    img.icon(src="@/assets/unchecked.svg")
    img.icon(src="@/assets/undo.svg")
    img.icon(src="@/assets/unlock.svg")
    img.icon(src="@/assets/vertical-line.svg")
    img.icon(src="@/assets/view-hidden.svg")
    img.icon(src="@/assets/view.svg")
    img.icon(src="@/assets/visit.svg")

    //- font previews
    img(src="https://updates.kinopio.club/font-preview/apris.webp")
    img(src="https://updates.kinopio.club/font-preview/eiko.webp")
    img(src="https://updates.kinopio.club/font-preview/gaya.webp")
    img(src="https://updates.kinopio.club/font-preview/grotesk-remix.webp")
    img(src="https://updates.kinopio.club/font-preview/gt-america.webp")
    img(src="https://updates.kinopio.club/font-preview/microgramma.webp")
    img(src="https://updates.kinopio.club/font-preview/migra.webp")
    img(src="https://updates.kinopio.club/font-preview/recoleta.webp")
    img(src="https://updates.kinopio.club/font-preview/shinka-mono.webp")
</template>

<style lang="stylus">
</style>
