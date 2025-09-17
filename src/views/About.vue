<script setup>
import { reactive, computed, onMounted, onUnmounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

import Header from '@/components/page/Header.vue'
import AppsAndExtensions from '@/components/dialogs/AppsAndExtensions.vue'

const globalStore = useGlobalStore()
let unsubscribes

const vPauseAnimation = {
  mounted (el) {
    const pauseAnimation = () => {
      el.style.animationPlayState = 'paused'
    }
    const resumeAnimation = () => {
      el.style.animationPlayState = 'running'
    }
    el.addEventListener('pointerover', pauseAnimation)
    el.addEventListener('pointerout', resumeAnimation)
    el._pauseAnimation = {
      pauseAnimation,
      resumeAnimation
    }
  },
  unmounted (el) {
    if (el._pauseAnimation) {
      el.removeEventListener('pointerover', el._pauseAnimation.pauseAnimation)
      el.removeEventListener('pointerout', el._pauseAnimation.resumeAnimation)
      delete el._pauseAnimation
    }
  }
}

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

const yearsOld = computed(() => {
  const startYear = 2018
  const currentYear = new Date().getFullYear()
  return currentYear - startYear
})

// creativity section

// const marqueeStyles = computed(() => {
//   return {
//     animationPlayState: 'running' // paused
//   }
// })

// explore section

const examples = computed(() => {
  return [
    {
      spaceId: '123',
      spaceName: 'MAGICAL REALISM',
      spacePreviewImage: '',
      spaceUserColor: '',
      spaceUserName: '',
      name: 'Moodboard'
    }, {
      spaceId: '123',
      spaceName: 'Life Tasks',
      spacePreviewImage: '',
      spaceUserColor: '#a1f7ef',
      spaceUserName: 'Piri',
      name: 'Personal Space'
    }
  ]
})

defineExpose({ vPauseAnimation })

</script>

<template lang="pug">
  Header
  main.page(@click="closeAllDialogs")
    section.intro
      h1 Kinopio
      p
        //- strong Kinopio
        span {{' '}}is spatial note-taking software for collecting and connecting your thoughts, ideas, and feelings. Create spaces to whiteboard, brainstorm, moodboard, research, plan, and take notes.
        //- img.frame-image.pot-standing-side(src="@/assets/frames/lil-guys/pot-standing-side.png")

      .row
        .button-wrap
          button.translucent-button(@click.left.stop="toggleAppsAndExtensionsIsVisible" :class="{active: state.appsAndExtensionsIsVisible}")
            img.icon.system(src="@/assets/system.svg")
            span Download
          AppsAndExtensions(:visible="state.appsAndExtensionsIsVisible")
        .button-wrap
          router-link(to="/app")
            button.success Open App

    section.how-it-works
      h2 How it Works
      p Kinopio helps you get the chaotic messy thoughts and ideas out of your head, show you how they’re connected, help you figure out what they mean, and how to start working on them.
      p Designed from the ground-up to work like your brain does.
    .row.horizontal
      //- vids 3:2
      figure
        video(autoplay loop muted playsinline)
          source(src="https://pketh.org/images/2024/whiteboard/k4-2.mp4")
        figcaption ❶ Tap anywhere and type to add cards
      figure
        video(autoplay loop muted playsinline)
          source(src="https://pketh.org/images/2024/whiteboard/k4-2.mp4")
        figcaption ❷ Drag cards to move them
      figure
        video(autoplay loop muted playsinline)
          source(src="https://pketh.org/images/2024/whiteboard/k4-2.mp4")
        figcaption ❸ Drag to connect related cards together
      figure
        video(autoplay loop muted playsinline)
          source(src="https://pketh.org/images/2024/whiteboard/k4-2.mp4")
        figcaption ❹ Paint select to edit together
      figure
        video(autoplay loop muted playsinline)
          source(src="https://help.kinopio.club/assets/about/mobile.mp4")
        figcaption ❺ Everything works on mobile too

    section.creativity
      h2 Creativity Meets Productivity
      p Thinking is anything but linear, it's a messy and chaotic process that uses both the creative (R) and analytical (L) sides of your brain.
      p People use Kinopio to plan out projects, schemas, moodboards, note taking, and to organize their daily lives. Your spaces can be personalized with backgrounds, card frames, colors, and todos – to be as playful, or productive, as you want.
      p
        img.updated.icon(src="@/assets/updated.gif")
        span New features are being added all the time in the{{' '}}
        a(href="/changelog") Changelog{{' '}}
    //- [horizontal marquee row, staggered speeds, stop scrolling on interaction]
    .row-wrap
      .row.horizontal.marquee(v-pause-animation)
        p ● Code Blocks and Markdown ● Real-Time Collaboration ● Privacy Options ● Comments ● Backlinked [[Tags]] ● Link Between /Spaces ● Collect Images, Websites, Pdfs
      .row.horizontal.marquee(v-pause-animation)
        p ● Import and Export ● Save as Pdf ● Public Api ● Organize With Boxes ● Freehand Drawing ● Collaborative Space Groups ● Quick Save to Inbox With Browser Extensions
      .row.horizontal.marquee(v-pause-animation)
        p ● Trackable Todos ● Personal Templates ● Snap to Grid, Align and Distribute ● iOS and Desktop Apps

    section.who-makes-kinopio
      //- TODO decorate w mail/stationary border handfeel (emailinvites.vue)
      h2 Why I Created Kinopio
      p Hi, I'm Piri,
      p I started building Kinopio {{yearsOld}} years ago, for people who have ideas, feelings, or thoughts they’re struggling to express, organize, and understand.
      p
        span I believe in building ethical, economically-sustainable, built-to-last{{' '}}
        a(href="https://pketh.org/organic-software.html") organic software
        span . Kinopio is 100% funded and made possible by people like you.
      p
        span If you're curious, I wrote{{' '}}
        a(href="https://pketh.org/how-kinopio-is-made.html") How Kinopio is Made
        span , and also share its{{' '}}
        a(href="https://kinopio.club/kinopio-architecture-and-costs-JOGXFJ0FEMpS3crbh6U9k") Architecture and Costs.
      //- TODO sig img
      p – Piri

    section.social-proof
      h2 People Seem to Like It
      p
        span Over the years, it’s been amazing to hear how people use Kinopio to map out and make sense of their ideas, feelings, and plans. I recently started capturing the nice things people are saying about it on the{{' '}}
        a(href="https://kinopio.club/love-wall-4Ry3Xwo8Giy7Jeul-s2TY") love wall
        span .
      p Used by students, teachers, and researchers, at:
      p ● NYU ● The New School (Parsons) ● Yale ● MIT ● Stanford ● Berkeley ● Columbia ●{{' '}}
        a(href="https://x.com/sfpc/status/1597727116556390404") School for Poetic Computation
      p And by designers, engineers, and PMs, at:
      p ● Discord ● Brilliant ● Cisco ● Wikimedia ● Atlassian ● Spotify ● Moving Brands
      p Kinopio has also been featured on{{' '}}
        a(href="https://www.theverge.com/23845815/threads-web-fabric-car-tech-installer-newsletter") The Verge
        span ,{{' '}}
        a(href="https://appstacks.club/kinopio") App Stacks
        span , and was the{{' '}}
        a(href="https://www.producthunt.com/products/kinopio") ProductHunt #1 Product of the Day
        span .

    section.explore
      h2 Spaces to Explore
        //- span.badge.secondary
        //-   img.icon.sunglasses(src="@/assets/sunglasses.svg")
      p I use Kinopio every day with a bunch of people all over the world. Maybe you'll like it too?
    .row.horizontal.examples
      //- demo cards , new demo
      //- use router-link
      //- p imgs: moodboard, software project/specs w md, collect ideas in inbox, storyboard, dnd, trip planning, personal website, startup idea, note taking
      //- [look1 grid biz] [look2 play, https://x.com/KinopioClub/status/1816148349436752026 , https://www.producthunt.com/posts/kinopio/embed]
      //- https://kinopio.club/kinopio-architecture-and-costs-JOGXFJ0FEMpS3crbh6U9k
      template(v-for="example in examples" :key="example.id")
        p {{example.spaceName}}

    section.faq
      img.flowers-divider(src="https://cdn.kinopio.club/fqoJozHGrobicZe0XUG1e/my-garden.webp")
      h2 FAQ
      //- 1
      details
        summary How does Kinopio compare to Miro, Milanote, Whimsical, and other whiteboard apps?
        section.subsection
          p Physical whiteboards are effective because of their expressiveness. Drawing and writing with markers is a naturally messy, chaotic process, which produces novel new ideas.
          p But the typical software whiteboard is designed for neatness and conformity. Expressiveness and personality is replaced with toolbars and sticky notes in one of 5 designer-approved pastel shades.
          p From customizable backgrounds, to colors, to embedding youtube videos, Kinopio spaces encourage creativity and self-expression.
          figure
            video(autoplay loop muted playsinline)
              source(src="@/assets/page/about/faq-example.mp4")
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
      //- 2
      details
        summary Should I use kinopio at work?
        section.subsection
          blockquote
            p
              span There’s always been this myth that really neat, fun people at home all of a sudden get very dull and boring and serious when they come to work, and it’s simply not true.
              br
              span – Steve Jobs
          p Whether it's your favorite camera, fountain pen, or keyboard, we’re inspired by the tools we use. Well-made daily tools encourage us to do our best work.
          p Kinopio is designed for small teams that want to build shared understanding, get projects started faster, be more flexible to change, and work better together.
      //- 3
      details
        summary What About my Data and Privacy?
        section.subsection
          ul
            li You can use Kinopio anonymously without an account but to share spaces and collaborate, you will need to create an account.
            li For developers, there's a fully documented [public API](https://help.kinopio.club/api/) that I encourage you to build cools things with.
            li Kinopio does not have ads, nor does it sell your data. The only revenue sources are from upgraded users and donations.
            li You can export JSON backups of your spaces. And you can permanently delete your account at anytime.
          p
            span More details in the{{' '}}
            a(href="https://help.kinopio.club/posts/privacy-policy/") Privacy Policy
            span .
      //- 4
      details
        summary Does kinopio have AI features?
        section.subsection
          p No it does not.
          p Because Kinopio is solely supported by the people who love it, I have the insane privilege of being able to only add features that fit into the product and truly help its users.
          p
            span With whiteboarding, mind-mapping, or mood-boarding the journey of adding ideas and images, making connections, and figuring out what things should be grouped together is vitally important to building up your
            a(href="https://en.wikipedia.org/wiki/Spatial_memory") spatial memory
            span . This is the magic that makes big ideas easier to recall and reason about.

    footer.sitemap
      //- to bubble section
      img.icon.logo-bw(src="@/assets/logos/logo-bw.svg")
      //- p est. 2018
      //- ## product
      //- about
      //- blog
      //- changelog
      //- roadmap

      //- ## support
      //- api docs
      //- help
      //- email

      //- ## community
      //- discord
      //- forum

      //- ## Info
      //- terms
      //- privacy
      //- press

</template>

<style lang="stylus">
:root
  --container-width 380px

// @font-face
//   font-family 'migra2'
//   src url("/fonts/migra/PPMigra-Bold.woff2") format("woff2")
//   font-weight bold
//   font-style normal
// @font-face
//   font-family 'migra2'
//   src url("/fonts/migra/PPMigra-Regular.woff2") format("woff2")
//   font-weight normal
//   font-style normal

header
  z-index 1

main.page
  user-select text
  margin 0
  padding-top 4rem
  // background #c7ffcd
  overflow auto
  height 100dvh
  > section
    margin 3rem
    margin-left 6rem
    // background lightgrey
    h1
      font-size 24px
      // margin-bottom 0
      // font-family var(--glyphs-font)
      // font-family 'migra2', sans-serif
    h2
      font-size 18px
      // font-family var(--header-font-1)
    p
      position relative
    p,
    strong,
    span
      max-width var(--container-width)
      // background lightblue
      font-size 15px
    @media(max-width 700px)
      margin 2rem
    @media(max-width 500px)
      margin 1rem

  details
    max-width var(--container-width)
    figure
      margin-top 1rem
  details + details
    margin-top 10px

  figure
    margin 0
    video
      border-radius calc(var(--entity-radius) * 2)
  figcaption
    font-size 14px
    // max-width var(--container-width)

  blockquote
    background lightgreen

  ul
    max-width var(--container-width)
    // li
    //   background yellow

  > .row-wrap
    max-width 100%
    overflow hidden

  > .row,
  section > .row
  .row-wrap > .row
    margin-top 10px
    &.horizontal
      // background goldenrod
      display flex
      flex-wrap nowrap
      padding-left 1rem
      overflow-x: auto
      gap 12px
      p
        flex 0 0 auto
        margin 0
      figure
        flex 0 0 auto
        video
          max-height 160px
    &.marquee
      overflow-x visible
      animation-name marquee
      animation-direction linear
      animation-timing-function linear
      animation-iteration-count infinite
      &:nth-child(1)
        animation-duration 25s
      &:nth-child(2)
        animation-duration 30s
      &:nth-child(3)
        animation-duration 35s

  // sections

  section.how-it-works,
  section.creativity,
  section.social-proof,
  section.explore
    margin-bottom 0

  .how-it-works + .row
    margin-top 2rem
    margin-bottom 3rem
    margin-left 1rem
    @media(max-width 700px)
      margin 2rem
      margin-left 0
    @media(max-width 500px)
      margin 1rem
      margin-left 0

  .row-wrap
    margin-top 1rem

  footer
    background plum
    padding 3rem
    // margin-bottom 2rem
    // padding-bottom 4rem
    @media(max-width 700px)
      padding 2rem
      // padding-bottom 4rem
    @media(max-width 500px)
      padding 1rem
      // padding-bottom 4rem
    .logo-bw
      width 35px

  .frame-image
    position absolute
    &.pot-standing-side
      width 32px
      top -25px
      right 10px
      z-index -1
      transform scaleX(-1)
      // transform

  .flowers-divider
    margin-top 2rem
    max-width 400px

@keyframes marquee
  0%
    transform translate(100%)
  100%
    transform translate(-80%)

</style>
