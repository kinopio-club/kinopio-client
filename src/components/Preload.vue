<template lang="pug">
.preload
  //-   .logo-hover
  //-   .logo-active

  template(v-for="url in imageUrls")
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
    img.icon(src="@/assets/brush-y.svg")
    img.icon(src="@/assets/brush.svg")
    img.icon(src="@/assets/camera.svg")
    img.icon(src="@/assets/card.svg")
    img.icon(src="@/assets/center-horizontally.svg")
    img.icon(src="@/assets/checkmark-invert.svg")
    img.icon(src="@/assets/checkmark.svg")
    img.icon(src="@/assets/comment.svg")
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
    img.icon(src="@/assets/export.svg")
    img.icon(src="@/assets/file.svg")
    img.icon(src="@/assets/filter.svg")
    img.icon(src="@/assets/flower.svg")
    img.icon(src="@/assets/hand.svg")
    img.icon(src="@/assets/heart-empty.svg")
    img.icon(src="@/assets/heart.svg")
    img.icon(src="@/assets/homescreen.svg")
    img.icon(src="@/assets/inbox.svg")
    img.icon(src="@/assets/leave.svg")
    img.icon(src="@/assets/light.svg")
    img.icon(src="@/assets/line-break.svg")
    img.icon(src="@/assets/lock.svg")
    img.icon(src="@/assets/magnifying-glass.svg")
    img.icon(src="@/assets/marker.svg")
    img.icon(src="@/assets/merge.svg")
    img.icon(src="@/assets/minimap.svg")
    img.icon(src="@/assets/minus.svg")
    img.icon(src="@/assets/moon.svg")
    img.icon(src="@/assets/offline.svg")
    img.icon(src="@/assets/open.svg")
    img.icon(src="@/assets/openai.svg")
    img.icon(src="@/assets/pause.svg")
    img.icon(src="@/assets/phone.svg")
    img.icon(src="@/assets/pin.svg")
    img.icon(src="@/assets/play.svg")
    img.icon(src="@/assets/presentation.svg")
    img.icon(src="@/assets/press-and-hold.svg")
    img.icon(src="@/assets/refresh.svg")
    img.icon(src="@/assets/remove.svg")
    img.icon(src="@/assets/resize-corner.svg")
    img.icon(src="@/assets/resize.svg")
    img.icon(src="@/assets/search.svg")
    img.icon(src="@/assets/settings.svg")
    img.icon(src="@/assets/share.svg")
    img.icon(src="@/assets/sign-out.svg")
    img.icon(src="@/assets/split-vertically.svg")
    img.icon(src="@/assets/split.svg")
    img.icon(src="@/assets/stats.svg")
    img.icon(src="@/assets/sticker.svg")
    img.icon(src="@/assets/sunglasses.svg")
    img.icon(src="@/assets/system.svg")
    img.icon(src="@/assets/templates.svg")
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

</template>

<script>
// import utils from '@/utils.js'

import { mapState, mapGetters } from 'vuex'

export default {
  name: 'Preload',
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'isLoadingSpace') {
        this.updateImageUrls()
      }
    })
  },
  data () {
    return {
      imageUrls: []
    }
  },
  computed: {
    ...mapState([
    ]),
    ...mapGetters([
      'currentCards/all'
    ])
  },
  methods: {
    updateImageUrls () {
      const cards = this['currentCards/all']
      let imageUrls = cards.map(card => card.urlPreviewImage)
      imageUrls = imageUrls.filter(url => Boolean(url))
      this.imageUrls = imageUrls
    }
  }
}
</script>

<style lang="stylus">
</style>
