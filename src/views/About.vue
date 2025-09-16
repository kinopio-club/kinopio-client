<script setup>
import { reactive, computed, onMounted, onUnmounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

import Header from '@/components/page/Header.vue'
import AppsAndExtensions from '@/components/dialogs/AppsAndExtensions.vue'

const globalStore = useGlobalStore()
let unsubscribes

onMounted(() => {
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'closeAllDialogs') {
        closeDialogs()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
})

const state = reactive({
  appsAndExtensionsIsVisible: false
})

const closeAllDialogs = () => {
  globalStore.closeAllDialogs()
}
const closeDialogs = () => {
  state.appsAndExtensionsIsVisible = false
}

const toggleAppsAndExtensionsIsVisible = () => {
  const isVisible = state.appsAndExtensionsIsVisible
  closeAllDialogs()
  state.appsAndExtensionsIsVisible = !isVisible
}
</script>

<template lang="pug">
  Header
  main.page(@click="closeAllDialogs")
    section
      h1 Kinopio
      p is a spatial note taking tool for collecting and connecting your thoughts, ideas, and feelings. Create spaces to whiteboard, brainstorm, moodboard, research, plan, and take notes.
      .row
        .button-wrap
          button(@click.left.stop="toggleAppsAndExtensionsIsVisible" :class="{active: state.appsAndExtensionsIsVisible}")
            img.icon.system(src="@/assets/system.svg")
            span Apps
          AppsAndExtensions(:visible="state.appsAndExtensionsIsVisible")
        .button-wrap
          router-link(to="/app")
            button.success Open App

    section.how-it-works
      h2 How it Works
      p Kinopio is designed to get the chaotic messy thoughts and ideas out of your head, show you how they’re connected, help you figure out what they mean, and how to start working on them.
      p Uniquely designed from the ground-up to work like your brain does.
    .row.horizontal.how-it-works-row
      p ❶ Click anywhere and type to add cards […]
      p ❷ Drag cards to move them
      p ❸ Drag to connect related cards together
      p ❹ Paint select to edit together
      p ❺ Everything works on mobile too(https://help.kinopio.club/assets/about/mobile.mp4)

    section.creativity
      h2 Creativity Meets Productivity
      p Thinking is anything but linear, it's a messy and chaotic process that uses both the creative (R) and analytical (L) sides of your brain.
      p People use Kinopio to plan out projects, schemas, moodboards, note taking, and to organize their daily lives. Your spaces can be personalized with backgrounds, card frames, colors, and todos, to be as playful, or productive, as you want.
      p
        span New features are being added all the time in the{{' '}}
        a(href="/changelog") Changelog{{' '}}
        img.updated.icon(src="@/assets/updated.gif")

    //- [horizontal marquee row, staggered multiline]
    .features-row
      .row.horizontal ● Code Blocks and Markdown ● Real-Time Collaboration ● Privacy Options ● Comments ● Backlinked [[Tags]] ● Link Between /Spaces ● Collect Images, Websites, Pdfs
      .row.horizontal ● Import and Export ● Save as Pdf ● [Public Api] ● Organize With Boxes ● Freehand Drawing ● Collaborative Space Groups ● Quick Save to Inbox With Browser Extensions
      .row.horizontal ● Trackable Todos ● Personal Templates ● Snap to Grid, Align and Distribute ● iOS and Desktop Apps

    section.about-me
      h2 Why I Created Kinopio
      p Hi, I'm Piri,
      p I made Kinopio for people who have ideas, feelings, or thoughts they’re struggling to express, organize, and understand.
      p
        span I believe in building ethical, economically-sustainable, built-to-last{{' '}}
        a(href="https://pketh.org/organic-software.html") organic software
        span . Kinopio is 100% funded and made possible by people like you.
      p
        span If you're curious, I wrote{{' '}}
        a(href="https://pketh.org/how-kinopio-is-made.html") How Kinopio is Made
        span , and share the{{' '}}
        a(href="https://kinopio.club/kinopio-architecture-and-costs-JOGXFJ0FEMpS3crbh6U9k") Architecture and Costs.
      p – Piri

    section.social-proof
      h2 People Seem to Like It
      p
        span Over the years, it’s been amazing to hear how people use Kinopio to map out and make sense of their ideas, feelings, and plans. I recently started capturing the nice things people are saying about it on the{{' '}}
        a(href="https://kinopio.club/love-wall-4Ry3Xwo8Giy7Jeul-s2TY") love wall
        span .
      p Used by students, teachers, and researchers, at
    .row.horizontal.social-proof-row
      span ● NYU ● The New School (Parsons) ● Yale ● MIT ● Stanford ● Berkeley ● Columbia ●{{' '}}
        a(href="https://x.com/sfpc/status/1597727116556390404") School for Poetic Computation
    section.social-proof
      p And by designers, engineers, and PMs, at
    .row.horizontal.social-proof-row
      span ● Discord ● Brilliant ● Cisco ● Wikimedia ● Atlassian ● Spotify ● Moving Brands
    section.social-proof
      p Kinopio has also been featured on{{' '}}
        a(href="https://www.theverge.com/23845815/threads-web-fabric-car-tech-installer-newsletter") The Verge
        span ,{{' '}}
        a(href="https://appstacks.club/kinopio") App Stacks
        span , and was the{{' '}}
        a(href="https://www.producthunt.com/products/kinopio") ProductHunt #1 Product of the Day
        span .

    section.faq
      h2 FAQ

      details
        summary How does Kinopio compare to Miro, Milanote, Whimsical, and other whiteboard apps?
        section.subsection
          p Physical whiteboards are effective because of their expressiveness. Drawing and writing with markers is a naturally messy, chaotic process, which produces novel new ideas.
          p But the typical software whiteboard is designed for neatness and conformity. Expressiveness and personality is replaced with toolbars and sticky notes in one of 5 designer-approved pastel shades.
          p From customizable backgrounds, to colors, to embedding youtube videos, Kinopio spaces encourage creativity and self-expression.
          p
            a(href="https://pketh.org/images/2024/whiteboard/k4-2.mp4") https://pketh.org/images/2024/whiteboard/k4-2.mp4
          blockquote In a text document you just click and type. In a spreadsheet you just click and type. What if in a whiteboard… you just clicked and typed? Choices like colors, voting, commenting, and checkboxes are secondary, and when you're ready, you can use boxes and connections to group related ideas together.

          p Like a physical whiteboard, the outputs produced this way tend to be{{' '}}
            a(href="https://uxdesign.cc/low-fidelity-design-is-higher-up-the-value-chain-fdf1824c6aa1") lower-fidelity
            span {{' '}}and conceptual – ideal for problem solving and consensus building.

          p The other major difference is that Kinopio is [organic software], paid for by the people who use it, rather than by VC investors looking for an{{' '}}
            a(href="https://ourincrediblejourney.tumblr.com/") exit
            span .

          table
            thead
              tr
                th Company
                th VC Funding
            tbody
              tr
                td Figjam
                td $1,400,000,000, Series F
              tr
                td Miro
                td $476,300,000, Series C
              tr
                td Milanote
                td $780,000
              tr
                td Mural
                td $196,600,000, Series C
              tr
                td Whimsical
                td $30,000,000, Series A
              tr
                td.badge.info Kinopio
                td.badge.info $0

          p The result? Kinopio is a product that embraces individuality and personality. Made for people, not drones.

          p To see how this plays out IRL, here's a direct comparison of{{' '}}
            a(href="https://www.youtube.com/watch?v=Colow9UCPqM") Kinopio vs Milanote
            span .

      details
        summary Why should I use kinopio at work
        p asldkfj
</template>

<style lang="stylus">
// @font-face
//   font-family 'recoleta'
//   src url("/fonts/recoleta/Recoleta-Bold.woff2") format("woff2")
//   font-weight bold
//   font-style normal
// @font-face
//   font-family 'recoleta'
//   src url("/fonts/recoleta/Recoleta-Regular.woff2") format("woff2")
//   font-weight normal
//   font-style normal

header
  z-index 1

main.page
  user-select text
  margin 0
  padding-top 4rem
  background pink
  overflow auto
  height 100dvh
  > section
    margin 3rem
    margin-left 6rem
    background lightgrey
    h1,
    h2
      font-size initial
    p
      max-width 400px
      background lightblue
      font-size initial
    @media(max-width 700px)
      margin 2rem
    @media(max-width 500px)
      margin 1rem

  > .row,
  section > .row
  .features-row > .row
    margin-top 10px
    &.horizontal
      background goldenrod
      display flex
      flex-wrap nowrap
      padding-left 1rem

  // sections

  section.how-it-works,
  section.creativity,
  section.social-proof
    margin-bottom 0

  .how-it-works-row
    margin-bottom 3rem
    @media(max-width 700px)
      margin 2rem
    @media(max-width 500px)
      margin 1rem

  .features-row
    margin-top 1rem
    margin-bottom 3rem

  section.social-proof + .social-proof-row,
  .social-proof-row + section.social-proof
    margin-top 1rem

</style>
