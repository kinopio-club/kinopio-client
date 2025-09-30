<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

const state = reactive({
  example: 'whiteboard' // mindmap, moodboard, research, plan, present, notes
})

const toggleExample = (value) => {
  state.example = value
}
</script>

<template lang="pug">
section.examples
  h2 Collect and Connect Your Thoughts, Ideas, and Feelings
  .examples-wrap
    .row
      span.badge.info.button-badge(:class="{active: state.example === 'whiteboard'}" @click="toggleExample('whiteboard')")
        span Whiteboard
      span.badge.info.button-badge(:class="{active: state.example === 'mindmap'}" @click="toggleExample('mindmap')")
        span Mind Map
      span.badge.info.button-badge(:class="{active: state.example === 'moodboard'}" @click="toggleExample('moodboard')")
        span Moodboard
      span.badge.info.button-badge(:class="{active: state.example === 'research'}" @click="toggleExample('research')")
        span Research
      span.badge.info.button-badge(:class="{active: state.example === 'plan'}" @click="toggleExample('plan')")
        span Plan
      span.badge.info.button-badge(:class="{active: state.example === 'present'}" @click="toggleExample('present')")
        span Present
      span.badge.info.button-badge(:class="{active: state.example === 'notes'}" @click="toggleExample('notes')")
        span Take Notes
      span and lots more.
    //- whiteboard
    template(v-if="state.example === 'whiteboard'")
      img(src="https://d2w9rnfcy7mm78.cloudfront.net/4267518/original_0158cd97e9bdf510544c545cf7829ded.png")
      //- img(src="https://d2w9rnfcy7mm78.cloudfront.net/7376365/original_958590f5203dbea243925880e3d09dd4.gif")
      p Gather notes, and connect them to their source URLs. Drag in files, like PDFs, to keep everything together. Categorize and label similar concepts with [[tags]].
    //- TODO
    template(v-else-if="state.example === 'mindmap'")
    template(v-else-if="state.example === 'moodboard'")
    template(v-else-if="state.example === 'research'")
    template(v-else-if="state.example === 'plan'")
    template(v-else-if="state.example === 'present'")
    template(v-else-if="state.example === 'notes'")
</template>

<style lang="stylus">
section.examples
  .examples-wrap
    max-width 480px
    background-color #889e9a
    border-radius var(--page-entity-radius)
    padding 2rem
  .row
    display flex
    flex-wrap wrap
    gap 6px 0
    margin-bottom 20px
  img,
  video
    border-radius calc(var(--entity-radius) * 2)
    background-color #ba8b8b
    margin-bottom 0
</style>
