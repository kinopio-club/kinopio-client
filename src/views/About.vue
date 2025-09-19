<script setup>
import { reactive, computed, onMounted, onUnmounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

import Header from '@/components/page/Header.vue'
import AppsAndExtensions from '@/components/dialogs/AppsAndExtensions.vue'
import WhoMakesKinopio from '@/components/WhoMakesKinopio.vue'

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

// page

const toggleAppsAndExtensionsIsVisible = () => {
  const isVisible = state.appsAndExtensionsIsVisible
  closeAllDialogs()
  state.appsAndExtensionsIsVisible = !isVisible
}
// const examples = computed(() => {
//   // dnd, run a campaign
//   return [
//     {
//       spaceId: '123',
//       spaceName: 'MAGICAL REALISM',
//       spacePreviewImage: '',
//       spaceUserColor: '',
//       spaceUserName: '',
//       name: 'Moodboard'
//     }, {
//       spaceId: '123',
//       spaceName: 'Life Tasks',
//       spacePreviewImage: '',
//       spaceUserColor: '#a1f7ef',
//       spaceUserName: 'Piri',
//       name: 'Personal Space'
//     }
//   ]
// })

</script>

<template lang="pug">
  Header
  main.page(@click="closeAllDialogs")
    .page-wrap
      section.intro
        h1.wordmark Kinopio
        //- h2 Collect and connect your thoughts, ideas, and feelings
        //- ss: multiple authors, overview hello space
        img(src="https://d2w9rnfcy7mm78.cloudfront.net/4267518/original_0158cd97e9bdf510544c545cf7829ded.png")

      section.cta
        p Designed to work the way your mind works. No sign up required.
          //- img.frame-image.pot-standing-side(src="@/assets/frames/lil-guys/pot-standing-side.png")
        p
          .button-wrap#download
            button.translucent-button(@click.left.stop="toggleAppsAndExtensionsIsVisible" :class="{active: state.appsAndExtensionsIsVisible}")
              span Apps
            AppsAndExtensions(:visible="state.appsAndExtensionsIsVisible")
          .button-wrap
            router-link(to="/app")
              button.success Jump In

      section.examples
        h2 Collect and Connect Your Thoughts, Ideas, and Feelings
        .examples-wrap
          .row
            span.badge.info.button-badge.active Whiteboard
            span.badge.info.button-badge Mind Map
            span.badge.info.button-badge Moodboard
            span.badge.info.button-badge Research
            span.badge.info.button-badge Plan
            span.badge.info.button-badge Present
            span.badge.info.button-badge Take Notes
            span and lots more.
          img(src="https://d2w9rnfcy7mm78.cloudfront.net/7376365/original_958590f5203dbea243925880e3d09dd4.gif")
          p Gather notes, and connect them to their source URLs. Drag in files, like PDFs, to keep everything together. Categorize and label similar concepts with [[tags]].

          //- video(autoplay loop muted playsinline)
          //-   source(src="https://help.kinopio.club/assets/about/intro.mp4")
        //- p ❶ Tap anywhere and type to add cards ❷ Drag cards to move them ❸ Drag to connect related cards together ❹ Paint select to edit together

        //- p Jump in to start visually connect your thoughts together.
        //- img(src="https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=276179&theme=neutral&period=daily&t=1758292855872")

      section.faq
        h2 FAQ
        WhoMakesKinopio(title="Who makes Kinopio")
        //-
        details
          summary How does Kinopio compare to Miro, Milanote, Whimsical, and other whiteboard apps?
          section.subsection
            p Physical whiteboards are so productive because drawing and writing with markers is a naturally messy, chaotic process, which produces novel new ideas and shared understanding.
            p But the typical software whiteboard is designed around neatness and conformity. Expressiveness and personality is replaced with toolbars and sticky notes in one of 5 designer-approved pastel shades.
            p From customizable backgrounds, to colors, to embedding youtube videos, Kinopio spaces encourage creativity and experimentation.
            //- TODO figure showing art
            //- figure
            //-   video(autoplay loop muted playsinline)
            //-     source(src="@/assets/page/about/faq-example.mp4")
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
            p To see how this plays out IRL, here's a video by a customer comparing{{' '}}
              a(href="https://www.youtube.com/watch?v=Colow9UCPqM") Kinopio vs Milanote
              span .
        //- 3
        details
          summary Why Does Kinopio Have No AI Features?
          section.subsection
            p Because Kinopio is solely supported by the people who love it, I have the insane privilege of being able to only add features that fit into the product and truly help its users.
            p
              span With whiteboarding, mind-mapping, or mood-boarding the journey of placing ideas and images, making connections, and figuring out what things should be grouped together yourself is vitally important to building up your{{' '}}
              a(href="https://en.wikipedia.org/wiki/Spatial_memory") spatial memory
              span . This is the magic that makes big ideas easier to recall and reason about.

        //- 2
        details
          summary Should I use Kinopio for work?
          section.subsection
            blockquote
              p There’s always been this myth that really neat, fun people at home all of a sudden get very dull and boring and serious when they come to work, and it’s simply not true.
              p – Steve Jobs

            p Whether it's your favorite camera, fountain pen, or keyboard, we’re inspired by the tools we use. Well-made daily tools encourage us to do our best work.
            p Kinopio is designed for nimble teams that want to build shared understanding, get projects started faster, be more flexible to change, and work better together.
            p think of kinopio like scrap paper?
            p groups, meetings, retrospectives ...

        details
          summary Who else uses Kinopio?
          section.subsection
            p
              span Over the years, it’s been amazing to hear how people use Kinopio to map out and make sense of their ideas, feelings, and plans. I recently started capturing the nice things people are saying about it on the{{' '}}
              a(href="https://kinopio.club/love-wall-4Ry3Xwo8Giy7Jeul-s2TY") love wall
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

    > section.examples
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

    > section.faq
      max-width 480px
      section.subsection
        padding 12px !important
        padding-top 2px !important
        margin-bottom 0.5rem

</style>
