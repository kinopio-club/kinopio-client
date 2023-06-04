<script setup>
import utils from '@/utils.js'
import NameSegment from '@/components/NameSegment.vue'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const props = defineProps({
  visible: Boolean,
  card: Object
})
// const emit = defineEmits(['updateCount'])
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateSegments()
  }
})

// preview name segments

const state = reactive({
  segments: []
})
const updateSegments = () => {
  const markdownSegments = utils.markdownSegments(props.card.name)
  let segments = []
  markdownSegments.forEach(segment => {
    const { type, content } = segment
    if (!content.trim()) { return }
    const types = ['h1', 'h2', 'h3']
    if (types.includes(type)) {
      segment.isText = true
      segment.markdown = [segment]
      segments.push(segment)
    }
    state.segments = segments
  })
}

// styles

const backgroundColorIsDark = () => {
  const color = props.card.backgroundColor
  if (color) {
    return utils.colorIsDark(color)
  } else {
    return store.state.currentUser.theme === 'dark'
  }
}
const styles = computed(() => {
  let styles = {
    backgroundColor: props.card.backgroundColor
  }
  if (backgroundColorIsDark()) {
    styles.color = utils.cssVariable('primary-on-dark-background')
  }
  return styles
})

</script>

<template lang="pug">
dialog.narrow.card-fonts(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    .row
      p Card Header
    section.subsection.preview-section(:style="styles")
      template(v-for="segment in state.segments")
        NameSegment(:segment="segment" :parentCardId="props.card.id")
  //- section
  //- upgrade to use custom header fonts
  section
    //- recolleta
    img(src="https://assets.fontsinuse.com/static/renders/2/1847/400/0/647c8d3c/microgramma.png")
    img(src="https://assets.fontsinuse.com/static/samples/6/5962/880/1/5d849af5/nirvana.png")

</template>

<style lang="stylus">
.card-fonts
  .name-segment
    display block
  .preview-section
    overflow hidden
    max-height 200px
    background-color var(--secondary-background)
</style>
