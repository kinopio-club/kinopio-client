<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useUserStore } from '@/stores/useUserStore'

import GroupLabel from '@/components/GroupLabel.vue'
import User from '@/components/User.vue'
import consts from '@/consts.js'

import randomColor from 'randomcolor'

const userStore = useUserStore()

const videoElement = ref(null)

onMounted(() => {
  updateRandomUsers()
})

const state = reactive({
  videoIsPaused: false,
  randomUsers: []
})

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

// groups

const groups = computed(() => {
  return [
    {
      id: 1,
      name: 'Product',
      color: '#d5bdff'
    },
    {
      id: 2,
      name: 'Marketing',
      color: '#edb185'
      // emoji: '🐇'
    },
    {
      id: 3,
      name: 'Sales',
      color: '#b1f49a'
    }
  ]
})

// users

const currentUser = computed(() => userStore.getUserAllState)
const updateRandomUsers = () => {
  const times = [1, 2]
  const users = []
  times.forEach(function (i) {
    const luminosity = userStore.theme
    const color = randomColor({ luminosity })
    users.push({ color })
  })
  state.randomUsers = users
}

</script>

<template lang="pug">
section.for-work
  h2 Kinopio at Work
  .for-work-wrap
    p
      em If only
      span {{' '}}projects could go straight from A to B. Every technical issue would be anticipated. Clients would never change their minds. The new feature would be as intuitive as it seemed in the mockup…
    p Instead, Kinopio is designed for real-world collaborative projects where teams need to be able to iterate and adapt to new information as they build.

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
        poster="@/assets/page/about/at-work/1.webp"
      )
        source(src="@/assets/page/about/at-work/1.mp4")
      figcaption
        p Capture and connect ideas together, build them up into plans and tasks, and work on them all in the same space.

    .row.feature-wrap
      .feature
        h3 Group Workspaces
        .row.group-label-row
          template(v-for="group in groups" :key="group.id")
            GroupLabel(:group="group" :showName="true")
        p Create and manage shared spaces for teams, projects, or clients.
      .feature
        h3 Flexible Collaboration
        .users(@click="updateRandomUsers")
          User(:user="currentUser" :isClickable="false" :isMedium="true" :hideYouLabel="true")
          template(v-if="state.randomUsers.length")
            User(:user="state.randomUsers[0]" :isClickable="false" :isMedium="true" :hideYouLabel="true")
            User(:user="state.randomUsers[1]" :isClickable="false" :isMedium="true" :hideYouLabel="true")

        p Work through ideas together in real-time, organize spaces on mobile, or contribute async.

    //- ?? best in class security. gdpr.. trust and security

</template>

<style lang="stylus">
section.for-work
  .for-work-wrap
    background-color #002c43
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
  .feature-wrap
    margin-top 1rem
    justify-content space-between
    .feature
      padding 0 1rem
      border-radius calc(var(--entity-radius) * 3)
      border 1px solid #38596a
      max-width calc(50% - 10px)
      gap 0 10px
      p
        margin-bottom 1rem
  .users
    cursor pointer
</style>
