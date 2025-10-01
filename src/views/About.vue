<script setup>
import { reactive, computed, onMounted, onUnmounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

import { useHead } from '@unhead/vue'

import Header from '@/components/page/Header.vue'
import AboutExamples from '@/components/page/AboutExamples.vue'
import AboutFeatures from '@/components/page/AboutFeatures.vue'
import FooterSitemap from '@/components/page/FooterSitemap.vue'
import AppsAndExtensions from '@/components/dialogs/AppsAndExtensions.vue'
import WhoMakesKinopio from '@/components/WhoMakesKinopio.vue'

const globalStore = useGlobalStore()
let unsubscribes

useHead({
  link: [{
    rel: 'canonical',
    href: 'https://kinopio.club'
  }]
})

// .row.horizontal.marquee(v-pause-animation)
// p ● Import and Export ● Save as Pdf ● Public Api ● Organize With Boxes ● Freehand Drawing ● Collaborative Space Groups ● Quick Save to Inbox With Browser Extensions

// > .row,
// section > .row
// .row-wrap > .row
//   margin-top 10px

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
    .page-wrap
      section.intro
        h1.wordmark Kinopio
        //- TODO vid, showing multiple authors, hello space?
        img(src="https://d2w9rnfcy7mm78.cloudfront.net/4267518/original_0158cd97e9bdf510544c545cf7829ded.png")
        p Spatial note taking tool for collecting and connecting your thoughts, ideas, and feelings. Designed to work the way your mind works.
        p No sign up required.
        .row
          .button-wrap#download
            button.translucent-button(@click.left.stop="toggleAppsAndExtensionsIsVisible" :class="{active: state.appsAndExtensionsIsVisible}")
              span Apps
            AppsAndExtensions(:visible="state.appsAndExtensionsIsVisible")
          .button-wrap
            router-link(to="/app")
              button.success Open Kinopio

      AboutExamples
      AboutFeatures

      section.faq
        h2 FAQ

        WhoMakesKinopio(title="Who makes Kinopio")

        details
          summary How does Kinopio compare to Miro, Milanote, Whimsical, and other whiteboard apps?
          section.subsection
            p Physical whiteboards are so productive because drawing and writing with markers is a naturally messy, chaotic process, which produces novel new ideas and shared understanding.
            p But the typical software whiteboard is designed around neatness and conformity. Expressiveness and personality is replaced with toolbars and sticky notes in one of 5 designer-approved pastel shades.
            p From customizable backgrounds, to colors, to embedding youtube videos, Kinopio spaces encourage creativity and experimentation.
            p Like a physical whiteboard, the outputs produced this way tend to be{{' '}}
              a(href="https://uxdesign.cc/low-fidelity-design-is-higher-up-the-value-chain-fdf1824c6aa1") lower-fidelity
              span {{' '}}and conceptual – ideal for problem solving and consensus building.
            p The other major difference is that Kinopio is{{' '}}
              a(href="https://pketh.org/organic-software.html") organic software
              span , paid for by the people who use it, rather than by VC investors looking for an{{' '}}
              a(href="https://ourincrediblejourney.tumblr.com/") easy exit
              span .
            table
              thead
                tr
                  td
                    strong Company
                  td
                    strong VC Funding (Debt)
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
            p To see how this plays out IRL, here's a video by a customer comparing{{' '}}
              a(href="https://www.youtube.com/watch?v=Colow9UCPqM") Kinopio vs Milanote
              span .

        details
          summary Why doesn't Kinopio Use AI?
          section.subsection
            p Because Kinopio is solely supported by the people who love it, I have the insane privilege of being able to only add features that fit into the product and truly help its users.
            p
              span With whiteboarding, mind-mapping, or mood-boarding, the journey of placing ideas and images, making connections, and figuring out what things should be grouped together yourself is vitally important to building up your own{{' '}}
              a(href="https://en.wikipedia.org/wiki/Spatial_memory") spatial memory
              span . This is the magic that makes big ideas easier to recall and reason about.

        details
          summary Why should I use Kinopio for work?
          section.subsection
            blockquote
              p There’s always been this myth that really neat, fun people at home all of a sudden get very dull and boring and serious when they come to work, and it’s simply not true.
              p – Steve Jobs
            p Exploring big ideas and tackling hard problems is anything but linear, it's a messy and chaotic process that uses both the creative (R) and analytical (L) sides of your brain.
            p Using tools that embrace creativity and individuality prevents group-think and encourages collaborators to come up with new ways to solve hard problems. Features like trackable tasks and shared groups help turn brainstorming sessions into actionable project plans.
            p Kinopio is designed for nimble teams that want to build shared understanding, get projects started faster, be more flexible to change, and work better together.

        details
          summary Can I export my data?
          section.subsection
            p Yes, of course – what you write inside Kinopio belongs only to you. There are export options in a variety of formats, and you can download a backup of all your spaces together.
            p
              span There is also a {{' '}}
              a(href="/api") public API
              span {{' '}}available.

        details
          summary Who else uses Kinopio?
          section.subsection
            p
              span Over the years, it’s been amazing to hear how people use Kinopio to map out and make sense of their ideas, feelings, and plans. I recently started capturing the nice things people are saying about it on the{{' '}}
              a(href="https://kinopio.club/love-wall-4Ry3Xwo8Giy7Jeul-s2TY") Community Love Wall
              span .
            p Used by students, teachers, and researchers, at ● NYU ● The New School (Parsons) ● Yale ● MIT ● Stanford ● Berkeley ● Columbia ●{{' '}}
                a(href="https://x.com/sfpc/status/1597727116556390404") School for Poetic Computation
            p And by designers, engineers, and PMs, at ● Discord ● Brilliant ● Cisco ● Wikimedia ● Atlassian ● Spotify ● Moving Brands
            p Kinopio has also been featured in{{' '}}
              a(href="https://www.theverge.com/23845815/threads-web-fabric-car-tech-installer-newsletter") The Verge
              span ,{{' '}}
              a(href="https://appstacks.club/kinopio") App Stacks
              span , and was the{{' '}}
              a(href="https://www.producthunt.com/products/kinopio") ProductHunt #1 Product of the Day
              span .

      section
        .button-wrap
          router-link(to="/app")
            button.success Open Kinopio
        p I hope you enjoy using Kinopio and find it useful,
        //- TODO sig img
        p – Piri

      FooterSitemap
</template>

<style lang="stylus">
:root
  --page-entity-radius 16px

header
  z-index 1

main.page
  user-select text
  padding-top 6rem
  margin 0
  .page-wrap
    margin-left auto
    margin-right auto
    max-width 610px

    > section
      width 100%
      margin-bottom 2rem
      padding 0 12px
      > h1
        font-family var(--header-font-9)
        font-size 66px
        margin-block initial
        margin-bottom 1rem
      > h2
        font-size 21px
        max-width 400px
      > img
        margin-bottom 1rem
        border-radius var(--page-entity-radius)
      > p
        margin 1rem 0
        &:last-child
          margin-bottom 0
      a
        color var(--text-link-on-light-background)
        &:hover
          text-decoration none

    > section.faq
      max-width 480px
      section.subsection
        padding 12px !important
        padding-top 2px !important
        margin-bottom 0.5rem
        blockquote
          border-left 1px solid var(--tertiary-hover-background)
          margin-left 0
          padding-left 1rem
        table
          td
            padding 5px 10px
</style>
