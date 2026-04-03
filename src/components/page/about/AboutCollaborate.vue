<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useUserStore } from '@/stores/useUserStore'

import GroupLabel from '@/components/GroupLabel.vue'
import User from '@/components/User.vue'
import utils from '@/utils.js'

import randomColor from 'randomcolor'
import sampleSize from 'lodash-es/sampleSize'

const userStore = useUserStore()

const videoElement = ref(null)

const state = reactive({
  videoIsPaused: false,
  isStatic: false
  // randomUsers: [
  //   { color: '#f4d075' },
  //   { color: '#f29f96' },
  //   { color: '#7899e5' }
  // ],
  // randomGroups: [
  //   {
  //     id: 1,
  //     name: 'Product',
  //     color: '#d8ef7c'
  //   },
  //   {
  //     id: 2,
  //     name: 'Marketing',
  //     color: '#fcc7f8'
  //   },
  //   {
  //     id: 3,
  //     name: 'Sales',
  //     color: '#8ef2d9'
  //   }
  // ]
})

// watch(() => userStore.theme, (value, prevValue) => {
//   updateRandomGroups()
//   updateRandomUsers()
// })

// video

const toggleVideoIsPaused = () => {
  const value = !state.videoIsPaused
  state.videoIsPaused = value
  if (value) {
    pauseVideo()
  } else {
    playVideo()
  }
}
const pauseVideo = () => {
  const element = videoElement.value
  element.pause()
}
const playVideo = () => {
  const element = videoElement.value
  element.play()
}

// random items

// const updateRandomGroups = () => {
//   let names = ['product', 'marketing', 'sales', 'newClient', 'SEO', 'research', 'design', 'engineering', 'accountServices']
//   names = sampleSize(names, 3)
//   names = names.map(name => utils.capitalizeFirstLetter(name))
//   const groups = []
//   names.forEach((name, index) => {
//     const luminosity = userStore.theme
//     const color = randomColor({ luminosity })
//     groups.push({
//       id: index,
//       name,
//       color
//     })
//   })
//   state.randomGroups = groups
// }
// const updateRandomUsers = () => {
//   const times = [1, 2, 3]
//   const users = []
//   times.forEach(function (i) {
//     const luminosity = userStore.theme
//     const color = randomColor({ luminosity })
//     users.push({ color })
//   })
//   state.randomUsers = users
// }

// features marquee

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
defineExpose({ vPauseAnimation })

const collaborationFeatures = computed(() => 'Collaboration Features ● Real-Time Collaboration ● Private or Public ● Invite to Edit or Read-Only ● Embed ● Groups to Manage Shared Team or Project Spaces')
const toggleIsStatic = () => {
  state.isStatic = !state.isStatic
}
</script>

<template lang="pug">
section.for-work
  h2 Think and Plan Together
    //- .users(@click="updateRandomUsers")
    //-   template(v-if="state.randomUsers.length")
    //-     User(:user="state.randomUsers[0]" :isClickable="false" :isMedium="true" :hideYouLabel="true")
    //-     User(:user="state.randomUsers[1]" :isClickable="false" :isMedium="true" :hideYouLabel="true")
    //-     User(:user="state.randomUsers[2]" :isClickable="false" :isMedium="true" :hideYouLabel="true")

  .for-work-wrap
    //- p
    //-   em If only
    //-   span {{' '}}projects could go straight from A to B. Every technical issue would be anticipated. Clients would never change their minds. The new feature would be as intuitive as it seemed in the mockup…
    //- p Kinopio is designed for real-world collaborative projects where teams need to be able to iterate and adapt to new information as they build.
    p Capture and connect ideas together, build them up into plans, lists, and tasks. Planning and progress in the same space keeps everyone on the same page.
    figure
      .button-wrap.play-button-wrap.badge.secondary(@click="toggleVideoIsPaused")
        button.small-button(title="Pause or Play Video")
          img.icon.play(v-if="state.videoIsPaused" src="@/assets/play.svg")
          img.icon.pause(v-else src="@/assets/pause.svg")
      video(
        autoplay
        loop
        muted
        playsinline
        aria-label="xyz"
        ref="videoElement"
        poster="https://updates.kinopio.club/page/about/at-work/1.webp"
      )
        source(src="https://updates.kinopio.club/page/about/at-work/1.webm")
      //- figcaption
      //-   p Capture and connect ideas together, build them up into plans and tasks, and work on them all in the same space.

    .scrolling-rows(v-if="!state.isStatic" @click="toggleIsStatic")
      .row.horizontal
        p.marquee(v-pause-animation) {{ collaborationFeatures }}
    .static-row.row(v-if="state.isStatic" @click="toggleIsStatic")
      span {{ collaborationFeatures }}

    //- .row.groups(@click="updateRandomGroups")
    //-   template(v-for="group in state.randomGroups" :key="group.id")
    //-     GroupLabel(:group="group" :showName="true")

    //- .row.feature-wrap
    //-   .feature
    //-     h3 Groups
    //-     .row.groups(@click="updateRandomGroups")
    //-       template(v-for="group in state.randomGroups" :key="group.id")
    //-         GroupLabel(:group="group" :showName="true")
    //-     p Create and manage shared spaces
     for teams, projects, or clients.
      //- .feature
      //-   h3 Flexible Collaboration

      //-   p Work through ideas together in real-time, organize spaces on mobile, or contribute async.

    //- built in slack, etc. integrations https://claude.ai/share/8da0beb0-110a-4b61-a2b1-e34f05843a48
    //- ?? best in class security. gdpr.. trust and security
</template>

<style lang="stylus">
section.for-work
  .for-work-wrap
    background-color #61182f
    color white
    border-radius var(--page-entity-radius)
    padding 2rem
    video
      border-radius calc(var(--entity-radius) * 2)

    p
      max-width 460px
    > p:first-child
      margin-top 0
    @media(max-width 460px)
      padding 1rem
  figure
    position relative
    margin 0
    margin-top 1rem
    margin-bottom 1rem
    figcaption
      p
        opacity 0.5
        font-size 13px
  .play-button-wrap
    flex-shrink 0
    padding 0
    height fit-content
    margin-top 7px
    margin-left 8px
    margin-right 0
    position absolute
    top 0
    button
      width 23px
      background transparent
      padding-left 7px
      .icon.play
        pointer-events none
        vertical-align 1px
      .icon.pause
        pointer-events none
        margin-bottom 1px
  .row
    display flex
    flex-wrap wrap

  .scrolling-rows
    cursor pointer
  .horizontal
    overflow-x hidden
    max-width 100%
    p
      margin 0
      text-wrap nowrap
      overflow visible
  .marquee
    overflow-x hidden
    animation-name marquee
    animation-direction linear
    animation-timing-function linear
    animation-iteration-count infinite
    animation-duration 30s
    width 100%
    max-width initial

  // .feature-wrap
  //   margin-top 1rem
  //   justify-content space-between
  //   .feature
  //     padding 0 1rem
  //     border-radius calc(var(--entity-radius) * 3)
  //     border 1px solid var(--primary-border)
  //     max-width calc(50% - 10px)
  //     gap 0 10px
  //     p
  //       margin-bottom 1rem
  // .users,
  // .groups
  //   cursor pointer
  // .users
  //   margin-left 6px
  //   vertical-align -2px
</style>
