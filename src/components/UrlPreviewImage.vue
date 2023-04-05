<script setup>
// import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch } from 'vue'
// https://vuex.vuejs.org/guide/composition-api.html#accessing-state-and-getters
import { useStore } from 'vuex'

import CardEmbed from '@/components/CardEmbed.vue'
const store = useStore()
// import Loader from '@/components/Loader.vue'
// import utils from '@/utils.js'

const props = defineProps({
  card: Object,
  user: Object,
  visible: Boolean,
  isSelected: Boolean,
  shouldDisplayEmbed: Boolean
})
// const emit = defineEmits(['updateCount'])

const state = reactive({
  // shouldDisplayEmbed: false,
  embedUrl: ''
})

const shouldHideImage = computed(() => props.card.shouldHideUrlPreviewImage)

// const themeName = computed(() => store.state.currentUser.theme)
// const incrementBy = () => {
//   state.count = state.count + 1
//   emit('updateCount', state.count)
//   // store.dispatch('themes/isSystem', false)
// }

const updateDimensions = () => {
  store.dispatch('currentCards/updateDimensions', { cards: [props.card] })
}

// const isYoutubeUrl = computed(() => {
//   const url = props.card.urlPreviewUrl
//   return utils.urlIsYoutube(url)
// })
// const toggleShouldDisplayEmbed = () => {}

</script>

<template lang="pug">
//- Loader(:visible="loading")
//- template(v-if="!loading")

//- CardEmbed(:visible="shouldDisplayEmbed" :url="embedUrl" :card="card")
.url-preview-image(v-if="visible && card.urlPreviewImage && !shouldHideImage")
  img.image(:src="card.urlPreviewImage" :class="{selected: isSelected}" @load="updateDimensions")

    //- .row.preview-text-row
    //-   //- play
    //-   .button-wrap.embed-button-wrap(v-if="isYoutubeUrl" @mousedown.stop @touchstart.stop @click.stop="toggleShouldDisplayEmbed" @touchend.stop="toggleShouldDisplayEmbed")
    //-     button
    //-       img.icon.stop(v-if="shouldDisplayEmbed" src="@/assets/box-filled.svg")
    //-       img.icon.play(v-else src="@/assets/play.svg")
    //-   //- text
    //-   .text(v-if="!shouldHideInfo" :style="{background: selectedColor}")
    //-     img.favicon(v-if="card.urlPreviewFavicon" :src="card.urlPreviewFavicon")
    //-     img.icon.favicon.open(v-else src="@/assets/open.svg")
    //-     .title {{filteredTitle}}
    //-     .description(v-if="description && shouldShowDescription") {{description}}

</template>

<style lang="stylus">
.url-preview-image
  .image
    border-radius var(--entity-radius)
    display block
    -webkit-touch-callout none // prevents safari mobile press-and-hold from interrupting
    &.selected
      mix-blend-mode color-burn
</style>
