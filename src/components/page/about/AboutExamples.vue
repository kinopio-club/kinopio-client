<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import ProgressCircle from '@/components/ProgressCircle.vue'

const parentElement = ref(null)

onMounted(() => {
  resetVideos()
  startTimer()
})

onBeforeUnmount(() => {
  cancelTimer()
})

const timerMax = 15 * 1000 // 15s
const timerId = ref(null)

const state = reactive({
  timerValue: 0,
  example: 'whiteboard'
})

const resetVideos = () => {
  const videoElements = parentElement.value.querySelectorAll('video')
  videoElements.forEach(videoElement => {
    if (!videoElement) { return }
    videoElement.pause()
    videoElement.currentTime = 0
  })
}
const playVideo = (value) => {
  const videoElement = parentElement.value.querySelector(`.example.${value} video`)
  if (!videoElement) { return }
  videoElement.play()
}
const toggleExample = (value) => {
  state.example = value
  resetVideos()
  playVideo(value)
  cancelTimer()
}

// timer

const examples = ['whiteboard', 'mindmap', 'moodboard', 'research', 'plan', 'present', 'notes', 'websites']
const startTimer = () => {
  state.timerValue = 0
  timerId.value = setInterval(() => {
    state.timerValue += 50
    if (state.timerValue >= timerMax) {
      const nextIndex = (examples.indexOf(state.example) + 1) % examples.length
      state.example = examples[nextIndex]
      resetVideos()
      playVideo(examples[nextIndex])
      state.timerValue = -150 // offsets duration of reset animation
    }
  }, 50)
}

const cancelTimer = () => {
  clearInterval(timerId.value)
  timerId.value = null
}

</script>

<template lang="pug">
section.examples(ref="parentElement")
  h2 Create Lively Freeform Spaces
  .examples-wrap
    .row
      //- every n seconds togglenext , other toggles cancel timer and hide circle

      ProgressCircle(
        v-if="timerId"
        :value="timerMax - state.timerValue"
        :max="timerMax"
      )
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
        span Notes
      span.badge.info.button-badge(:class="{active: state.example === 'websites'}" @click="toggleExample('websites')")
        span Websites
      span and lots more.

    //- 7:5 ratio media
    //- 970 width, 693 height

    .example.whiteboard(v-show="state.example === 'whiteboard'")
      //- to vid showing alignment btn
      img(src="https://updates.kinopio.club/page/about/examples/whiteboard.webp" alt="computing happiness whiteboard space")
      p Gather notes, and connect them to their source URLs. Drag in files, like PDFs, to keep everything together. Label concepts with backlinked [[tags]].
      p Invite friends and group members to collaborate together in real-time.

    .example.mindmap(v-show="state.example === 'mindmap'")
      video(autoplay loop muted playsinline aria-label="mindmap space")
        source(src="https://updates.kinopio.club/page/about/examples/mindmap.webm")
      p Unlike traditional mind maps and outliners, Kinopio lets you make your spaces truly yours with backgrounds, images, GIFs, MP3s, Youtube or Spotify URLs.
      p Draw anywhere to decorate or emphasize specific areas.

    .example.moodboard(v-show="state.example === 'moodboard'")
      video(autoplay loop muted playsinline aria-label="moodboard space")
        source(src="https://updates.kinopio.club/page/about/examples/moodboard.webm")
      p Collect quotes and visual inspiration to guide the direction of your next big project. Real-time collaboration and comment cards help keep everyone aligned.
      p You can also import your Are.na channels.

    .example.research(v-show="state.example === 'research'")
      img(src="https://updates.kinopio.club/page/about/examples/research.webp" alt="research space")
      p Spatially organized information that’s easy to retrieve helps you get over the hump of anxiety and procrastination.
      p Invite collaborators to collect ideas and comments. Use backlinked [[tags]] to connect themes across spaces.

    .example.plan(v-show="state.example === 'plan'")
      video(autoplay loop muted playsinline aria-label="planning space")
        source(src="https://updates.kinopio.club/page/about/examples/plan.webm")
      p Build roadmaps, diagrams, storyboards, specs, and project plans, that let you track project progress – while also making it easy to adapt to unexpected changes, new insight, or new ideas.
      p Move from idea to actions by turning cards or boxes into trackable Todos.

    .example.present(v-show="state.example === 'present'")
      video(autoplay loop muted playsinline aria-label="presentation space")
        source(src="https://updates.kinopio.club/page/about/examples/present.webm")
      p Engage with audiences and students by presenting from interactive, animated spaces instead of boring static slides. Use boxes to represent slides, chapters, or major themes and quickly jump between them with the minimap.

    .example.notes(v-show="state.example === 'notes'")
      video(autoplay loop muted playsinline aria-label="note-taking space")
        source(src="https://updates.kinopio.club/page/about/examples/notes.webm")
      p Note taking in Kinopio is an effective way to build spatial memory that sticks with you. Spatial memory is the magic that makes big ideas easier to recall and reason about.
      p Browser extensions let you quick capture ideas and URLs. If you can see it on the internet, you can put it inside Kinopio.

    .example.websites(v-show="state.example === 'websites'")
      img(src="https://updates.kinopio.club/page/about/examples/websites.webp" alt="website space")
      p Share uniquely personal webpages to celebrate birthdays, share hobbies, mixtapes, about pages, and portfolios.
      p Spaces are private by default and invitees don't need an account to view, but you can also set spaces to be public read-only, or open to comments from everyone.
      p
        img.icon.sunglasses(src="@/assets/sunglasses.svg" alt="explore icon")
        span Share spaces with the community by adding them to Explore.

</template>

<style lang="stylus">
:root
  --example-button-active-inset-shadow inset 0 1px 2px var(--primary-transparent)

section.examples
  .examples-wrap
    max-width 520px
    background-color var(--example-background)
    border-radius var(--page-entity-radius)
    padding 2rem
    @media(max-width 460px)
      padding 1rem
  .segmented-buttons
    margin-right 6px
    button
      min-width 20px
      .icon
        margin-left 1px
  .row
    display flex
    flex-wrap wrap
    gap 6px 0
    align-items center
    margin-bottom 20px
  img,
  video
    border-radius calc(var(--entity-radius) * 2)
    margin-bottom 0
  .button-badge.badge.active
    box-shadow var(--example-button-active-inset-shadow)
</style>
