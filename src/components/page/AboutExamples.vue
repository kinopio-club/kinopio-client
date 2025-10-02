<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import CircleProgress from '@/components/CircleProgress.vue'

// mounted pause all videos
const parentElement = ref(null)

onMounted(() => {
  resetVideos()
})

const state = reactive({
  example: 'whiteboard'
})

const resetVideos = () => {
  const videoElements = parentElement.value.querySelectorAll('video')
  videoElements.forEach(videoElement => {
    videoElement.pause()
    videoElement.currentTime = 0
  })
}
const playVideo = (value) => {
  const videoElement = parentElement.value.querySelector(`.example.${value} video`)
  videoElement.play()
}
const toggleExample = (value) => {
  state.example = value
  resetVideos()
  playVideo(value)
}
</script>

<template lang="pug">
section.examples(ref="parentElement")
  h2 Create Lively Freeform Spaces
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
      span.badge.info.button-badge(:class="{active: state.example === 'websites'}" @click="toggleExample('websites')")
        span Websites
      span and lots more.

    //- TODO 7:5 ratio media
    //- 970

    .example.whiteboard(v-show="state.example === 'whiteboard'")
      img(src="@/assets/page/about/computing-happiness.webp")
      p Gather notes, and connect them to their source URLs. Drag in files, like PDFs, to keep everything together. Label concepts with backlinked [[tags]].
      p Invite friends and group members to collaborate together in real-time.

    .example.mindmap(v-show="state.example === 'mindmap'")
      //- img(src="@/assets/page/about/m3.png")
      video(autoplay loop muted playsinline)
        source(src="@/assets/page/about/mindmap.mp4")

      //- https://kinopio.club/konmari-7xxjlZ-gsZ6e2j0vUxBxF
      //- https://kinopio.club/biz-plan-IJwxi0Swu7SksLUenX7N7
      //- https://kinopio.club/trying-to-figure-out-my-obsessions-trend-gQVq_Fws0mWCCBbShtccF
      //- https://kinopio.club/-fields-of-somber-cabbages--hzcK2a-se8nuAHz2gG2-y
      //- https://kinopio.club/strategy-vs-feeling-9aOChzb29sXRRTn_ssFfN

            //- https://kinopio.club/engine-structure-CG89gGoo8awDT9xM2Vtb8

      //- bk image
      p Unlike traditional mind maps and outliners, Kinopio lets you make your spaces truly yours with backgrounds, images, GIFs, MP3s, Youtube or Spotify URLs.
      p Draw anywhere to decorate or emphasize specific areas.

    .example.moodboard(v-show="state.example === 'moodboard'")

      //- img(src="@/assets/page/about/mo3.png")
      video(autoplay loop muted playsinline)
        source(src="@/assets/page/about/mo5.mp4")

      //- HONDA? , inspiration
      //- https://kinopio.club/magical-realism-74NPft-m1bYFn5k2yGIXc
      //- https://kinopio.club/tutorial-club-U5rh0oZrhVmSM8D5P19GG
      //- https://kinopio.club/tutorial-club-U5rh0oZrhVmSM8D5P19GG
      //- https://kinopio.club/georgette-EdTLKnh_nQMthXqchiFAL

      p Collect quotes and visual inspiration to guide the direction of your next big project. Real-time collaboration and comment cards help keep everyone aligned.
      p You can also import your Are.na channels.

    .example.research(v-show="state.example === 'research'")
      //- https://kinopio.club/a-bright-house-2pt3FR8E0m1D9Qe-fL1JM
      //- ? storyboarding https://kinopio.club/--ndNatW7S78rCwo5dhaPU7
      //- OLA https://kinopio.club/kinopio-content--0heepkAZIOuVyR6m7ZLO0
      //- https://kinopio.club/companionability-art-and-accessibility-zRCRZ3DDF2quHk8CJ02ik
      p Spatially organized information that’s easy to retrieve helps you get over the hump of anxiety and procrastination. Invite collaborators to collect ideas and comments.
      p Use backlinked [[tags]] to connect themes across spaces.

    .example.plan(v-show="state.example === 'plan'")
      //- https://kinopio.club/macrowave-beAvHVb6cD0jZ-D_ix5rC
      //- https://kinopio.club/spidersona---aura-BF-XTv6TqJgPwq0Hb7ab3 storyboarding
      //- https://kinopio.club/medical-device-software-tEslm-8njA0Q3QzpYoIyw
      //- https://kinopio.club/cybersecurity-certs-m1KW0HNAWzTT1LnVXcZip
      //- https://kinopio.club/-futureland-ios-app-stJZxX-JraefgRDzSKcXu
      p Build diagrams, storyboards, and specs, that can adapt to changes midway through a project. Move from idea to actions by turning cards or boxes into trackable Todos.

    .example.present(v-show="state.example === 'present'")
      //- https://kinopio.club/kn-glue-No2GvJ3kD7NUnJxihn6LG ?
      //- https://kinopio.club/robots---personality-with-math-video-KI1vsib33pLTQlbWCXqAZ
      //- https://kinopio.club/climate-ai-brain-dumps-ateHKvDeiAHNJRzaPmBZE
      p Engage with audiences and students by presenting from interactive, animated spaces instead of boring static slides. Use boxes to represent slides, chapters, or major themes and quickly jump between them using the minimap.

    .example.notes(v-show="state.example === 'notes'")
      //- https://kinopio.club/the-sketchbook-practice-xVBQM1oYj8bLwrK9L523H
      //- https://kinopio.club/-crochet-diary-4h1bgB0tQ_S2QD7P0Iyp1
      //- https://kinopio.club/primitives-P2fS1q3b4lV1sx50fi_0E
      //- https://kinopio.club/-skincare-journal-_3EaIFjJi87YO8jIMBni6
      p Note taking in Kinopio is an effective way to build spatial memory that sticks with you. Spatial memory is the magic that makes big ideas easier to recall and reason about.
      p Browser extensions let you quick capture ideas and URLs.

    .example.websites(v-show="state.example === 'websites'")
      //- https://kinopio.club/for-my-love-9_5Jwu0MVNDP7wLUfXVgq
      //- https://kinopio.club/happy-birthday--t7mDxRy1g1n8WN8o_VYhV
      //- https://kinopio.club/happy-birthday-mll--KT4r9y7SwV-kBBme-R0P2
      //- https://kinopio.club/-recipe-diary-VvppHTO84kBFu6Pq-LpA3
      //- https://kinopio.club/ila-hype-board-eLJ3LuzB6HepDY4Ky_HXq
      //- https://kinopio.club/personal-page--zo6_3wXV6ou5aKbiv_2j0
      //- https://kinopio.club/true-blue--ktSBs7v7U0zL69FJblcxD
      //- https://kinopio.club/happy-33rd-sandy-3-tEadBTIaknNWe5lPci-cD
      //- https://kinopio.club/personal-page--zo6_3wXV6ou5aKbiv_2j0
      //- https://kinopio.club/portfolio-bdo7hdjaRE9wY_yb99RVZ
      p Share uniquely personal birthday cards, about pages, and your portfolio. Spaces are private by default, but can be set to public read-only, or open to comments from everyone.
      p
        img.icon.sunglasses(src="@/assets/sunglasses.svg")
        span Add the spaces you're especially proud of to Explore to share them with the community.

</template>

<style lang="stylus">
section.examples
  .examples-wrap
    max-width 520px
    background-color #889e9a
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
</style>
