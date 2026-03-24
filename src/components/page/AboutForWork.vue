<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

const videoElement = ref(null)

const state = reactive({
  videoIsPaused: false
})

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

</script>

<template lang="pug">
section.for-work
  h2 Kinopio at Work
  //- see love wall
  //- p The collaboration tool for new ideas and hard problems that teams enjoy using.
  .for-work-wrap
    p
      em If only
      span {{' '}}projects went neartly from A to B. Every technical issue would be anticipated. Clients would never change their minds. The new feature would be as intuitive as it seemed in the mockups.
    //- ??? A // myth of the perfect plan -> B // no surprises or learning

    //-   .row
    //-     .side.left
    //-       h3 Paint Select and Multi-Edit
    //-       p 11111111111111111111 111111111111111111111 11111111111
    //-     .side.right full width VID 2222222222222 22222222222222222222222222222 222222222222222 2222222222222222222222 2

    p Instead, Kinopio is designed for real-world collaborative projects where teams need to be able to iterate and adapt to new information as they build.

    //- TODO add play/pause button?
    .video-wrap
      .button-wrap.play-button-wrap.badge.secondary(@click="toggleVideoIsPaused")
        button.small-button(title="Pause or Play Video")
          img.icon.play(v-if="state.videoIsPaused" src="@/assets/play.svg")
          img.icon.stop(v-else src="@/assets/box-filled.svg")

      video(autoplay loop muted playsinline aria-label="moodboard space" ref="videoElement")
        source(src="@/assets/page/about/examples/moodboard.mp4")
      //- [ big squarish collab vid: grid bk: ideas, link ideas,
      //- > There’s always been this myth that really neat, fun people at home all of a sudden get very dull and boring and serious when they come to work, and it’s simply not true. – Steve Jobs
      //- put some in lists: (Doing, Deferred) , painting and turning things into tasks, checking things off ]
      //- drag in image and resize and connect to

    p Capture and connect ideas together, build them up into plans and tasks, and work on them all in the same space.

    //- feature-wrap , f1
    //- feature-wrap , f2

    //- ?? gdpr.. trust and security

</template>

<style lang="stylus">
section.for-work
  .for-work-wrap
    background-color var(--for-work-background)
    // background-color rgb(6, 73, 107)
    // color white
    border-radius var(--page-entity-radius)
    padding 2rem
    video
      border-radius calc(var(--entity-radius) * 2)

    p
      max-width 460px
    > p:first-child
      margin-top 0
    // blockquote
    //   margin-left 0
    //   margin-right 0
    //   border-left 1px solid black
    //   padding-left 10px
    @media(max-width 460px)
      padding 1rem
  //   .row
  //     display flex
  //     flex-wrap wrap
  //     justify-content space-between
  //     // 40 / 60??
  //     .left
  //       max-width calc(50% - var(--how-to-column-gap))
  //       margin-right var(--how-to-column-gap)
  //     .right
  //       max-width 50%
  //   .row + .row
  //     margin-top 20px
  // h3
  //   margin-top 0
  // img,
  // video
  //   border-radius calc(var(--entity-radius) * 2)
  //   margin-bottom 0
  // .button-badge.badge.active
  //   box-shadow var(--example-button-active-inset-shadow)
  .video-wrap
    position relative
    margin-top 1rem
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
      .icon.stop
        pointer-events none
        width 7px
        margin-bottom 2px

</style>
