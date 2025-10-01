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
  h2 Create Lively Freeform Spaces
  .examples-wrap
    .row.examples-badges-row
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
      //- TODO add timer cresent timer, that toggles next example state. and stops/disappears on toggleExample

    .example(v-show="state.example === 'whiteboard'")
      img(src="https://d2w9rnfcy7mm78.cloudfront.net/4267518/original_0158cd97e9bdf510544c545cf7829ded.png")
      //- img(src="https://d2w9rnfcy7mm78.cloudfront.net/7376365/original_958590f5203dbea243925880e3d09dd4.gif")
      //- bk grid, or ghibli
      p Gather notes, and connect them to their source URLs. Drag in files, like PDFs, to keep everything together. Categorize and label concepts with backlinked [[tags]].
      p Invite friends and group members to collaborate in real-time.
      .row.spaces-badges-row
        img.icon.sunglasses(src="@/assets/sunglasses.svg")
        a(href="")
          .badge.secondary.button-badge
            span Computing Happiness
        a(href="")
          .badge.secondary.button-badge
            span Kinopio Architecture and Costs

    .example(v-show="state.example === 'mindmap'")
      //- bk image
      p Unlike traditional mind maps and outliners, Kinopio lets you make your spaces truly yours with backgrounds, images, GIFs, MP3s, Youtube or Spotify URLs.
      p Draw anywhere to decorate or emphasize specific areas.

    .example(v-show="state.example === 'moodboard'")
      //- HONDA? , inspiration
      p Collect quotes and visual inspiration to evoke a vibe and a direction for your next big project. Real-time collaboration and comment cards help keep everyone aligned.
      p You can also import your Are.na channels.

    .example(v-show="state.example === 'research'")
      p Spatially organized information that’s easy to retrieve helps you get over the hump of anxiety and procrastination. Invite collaborators to collect ideas and comments.
      p Use backlinked [[tags]] to connect themes across spaces.

    .example(v-show="state.example === 'plan'")
      p Build diagrams and specs that can adapt to changes midway through a project. Move from idea to actions by turning cards or boxes into trackable Todos.

    .example(v-show="state.example === 'present'")
      p Engage with audiences and students by presenting from interactive, animated spaces instead of boring static slides. Use boxes to represent slides, chapters, or major themes and quickly jump between them using the minimap.

    .example(v-show="state.example === 'notes'")
      p Spatial note taking is an effective way to build relational memory so that ideas stick . Browser extensions let you quick capture ideas and URLs.
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
    align-items center
  .examples-badges-row
    margin-bottom 20px
  .spaces-badges-row
    margin-top 20px
    a
      text-decoration none
    .icon.sunglasses
      margin-right 4px
  img,
  video
    border-radius calc(var(--entity-radius) * 2)
    margin-bottom 0
</style>
