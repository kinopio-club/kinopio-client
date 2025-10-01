<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

const state = reactive({
  example: 'whiteboard' // mindmap, moodboard, research, plan, present, notes, websites
})

const toggleExample = (value) => {
  state.example = value
}
</script>

<template lang="pug">
section.examples
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
      //- TODO add timer cresent timer, that toggles next example state. and stops/disappears on toggleExample

    //- ? make templates: https://kinopio.club/-template-ideas-for-kinopio-copy-WQDU3JERWVGjbqIWnoWW5

    .example(v-show="state.example === 'whiteboard'")
      img(src="@/assets/page/about/computing-happiness.webp")
      //- img(src="https://d2w9rnfcy7mm78.cloudfront.net/7376365/original_958590f5203dbea243925880e3d09dd4.gif")
      //- https://kinopio.club/digital-garden-by-aixdesign---community-participatory-feminist-slow-ai-H-fG2FyFI3T83Kj0Arxiz
      //- https://kinopio.club/nocturne-vLcCieen2C4XFwyTbFKB7
      //- https://kinopio.club/groove-structure-g7VrYLbRlY1kCVvBuxE-X

      //- https://kinopio.club/small-ish-web-AIJCJnp1Pr3LmLT7YL-vA

      //- https://kinopio.club/things-to-do-places-to-go-a02-JnPI-Kq5Q8hRetca-
      //- https://kinopio.club/climate-change-9xJzBR-mh4obdtu1uKdQX
      //- 7:5 ratio
      p Gather notes, and connect them to their source URLs. Drag in files, like PDFs, to keep everything together. Label concepts with backlinked [[tags]].
      p Invite friends and group members to collaborate together in real-time.

    .example(v-show="state.example === 'mindmap'")
      //- https://kinopio.club/computing-happiness-SrLvfAPsBIsor4g9iIW7D
      //- https://kinopio.club/konmari-7xxjlZ-gsZ6e2j0vUxBxF
      //- https://kinopio.club/biz-plan-IJwxi0Swu7SksLUenX7N7
      //- https://kinopio.club/trying-to-figure-out-my-obsessions-trend-gQVq_Fws0mWCCBbShtccF
      //- https://kinopio.club/-fields-of-somber-cabbages--hzcK2a-se8nuAHz2gG2-y
      //- https://kinopio.club/strategy-vs-feeling-9aOChzb29sXRRTn_ssFfN

            //- https://kinopio.club/engine-structure-CG89gGoo8awDT9xM2Vtb8

      //- bk image
      p Unlike traditional mind maps and outliners, Kinopio lets you make your spaces truly yours with backgrounds, images, GIFs, MP3s, Youtube or Spotify URLs.
      p Draw anywhere to decorate or emphasize specific areas.

    .example(v-show="state.example === 'moodboard'")
      //- HONDA? , inspiration
      //- https://kinopio.club/magical-realism-74NPft-m1bYFn5k2yGIXc
      //- https://kinopio.club/tutorial-club-U5rh0oZrhVmSM8D5P19GG
      //- https://kinopio.club/tutorial-club-U5rh0oZrhVmSM8D5P19GG
      //- https://kinopio.club/georgette-EdTLKnh_nQMthXqchiFAL

      p Collect quotes and visual inspiration to evoke a vibe and a direction for your next big project. Real-time collaboration and comment cards help keep everyone aligned.
      p You can also import your Are.na channels.

    .example(v-show="state.example === 'research'")
      //- https://kinopio.club/a-bright-house-2pt3FR8E0m1D9Qe-fL1JM
      //- ? storyboarding https://kinopio.club/--ndNatW7S78rCwo5dhaPU7
      //- OLA https://kinopio.club/kinopio-content--0heepkAZIOuVyR6m7ZLO0
      //- https://kinopio.club/companionability-art-and-accessibility-zRCRZ3DDF2quHk8CJ02ik
      p Spatially organized information that’s easy to retrieve helps you get over the hump of anxiety and procrastination. Invite collaborators to collect ideas and comments.
      p Use backlinked [[tags]] to connect themes across spaces.

    .example(v-show="state.example === 'plan'")
      //- https://kinopio.club/macrowave-beAvHVb6cD0jZ-D_ix5rC
      //- https://kinopio.club/spidersona---aura-BF-XTv6TqJgPwq0Hb7ab3 storyboarding
      //- https://kinopio.club/medical-device-software-tEslm-8njA0Q3QzpYoIyw
      //- https://kinopio.club/cybersecurity-certs-m1KW0HNAWzTT1LnVXcZip
      //- https://kinopio.club/-futureland-ios-app-stJZxX-JraefgRDzSKcXu
      p Build diagrams, storyboards, and specs, that can adapt to changes midway through a project. Move from idea to actions by turning cards or boxes into trackable Todos.

    .example(v-show="state.example === 'present'")
      //- https://kinopio.club/kn-glue-No2GvJ3kD7NUnJxihn6LG ?
      //- https://kinopio.club/robots---personality-with-math-video-KI1vsib33pLTQlbWCXqAZ
      //- https://kinopio.club/climate-ai-brain-dumps-ateHKvDeiAHNJRzaPmBZE
      p Engage with audiences and students by presenting from interactive, animated spaces instead of boring static slides. Use boxes to represent slides, chapters, or major themes and quickly jump between them using the minimap.

    .example(v-show="state.example === 'notes'")
      //- https://kinopio.club/the-sketchbook-practice-xVBQM1oYj8bLwrK9L523H
      //- https://kinopio.club/-crochet-diary-4h1bgB0tQ_S2QD7P0Iyp1
      //- https://kinopio.club/primitives-P2fS1q3b4lV1sx50fi_0E

      //- https://kinopio.club/-skincare-journal-_3EaIFjJi87YO8jIMBni6
      p Spatial note taking is an effective way to build relational memory so that ideas stick . Browser extensions let you quick capture ideas and URLs.
    .example(v-show="state.example === 'websites'")
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

      p personalize and share
      p xyz bday cards, personal page, portfolio webpages, or just to say i love you
      p your spaces are private by default, but can be set to public read-only , or open to comments from everyone
      p add it to explore to share it w the community

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
