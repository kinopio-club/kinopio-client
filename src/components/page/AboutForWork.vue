<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
</script>

<template lang="pug">
section.for-work
  h2 Great Teams Deserve Great Tools
  //- see love wall
  .for-work-wrap
    p 123
  //- .how-to-wrap
  //-   .row
  //-     .side.left
  //-       h3 Cards and Connections
  //-       p To create cards, tap anywhere and start typing. Format with markdown, paste URLs to create links and play YouTube videos, add images, colors and more. Connect related cards by dragging from the connector to another card.
  //-     //- video in .right
  //-     .side.right full width VID 2222222222222 22222222222222222222222222222 222222222222222 2222222222222222222222 2

  //-   .row
  //-     .side.left
  //-       h3 Paint Select and Multi-Edit
  //-       p 11111111111111111111 111111111111111111111 11111111111
  //-     .side.right full width VID 2222222222222 22222222222222222222222222222 222222222222222 2222222222222222222222 2

  //-   .row
  //-     .side.left
  //-       h3 Boxes, Lists, and Lines
  //-       p 11111111111111111111 111111111111111111111 11111111111
  //-     .side.right full width VID 2222222222222 22222222222222222222222222222 222222222222222 2222222222222222222222 2

  //-   .row
  //-     .side.left
  //-       h3 Sharing and Collaboration
  //-       p 11111111111111111111 111111111111111111111 11111111111
  //-     .side.right full width VID 2222222222222 22222222222222222222222222222 222222222222222 2222222222222222222222 2

  //- TODO to AboutForWork component
  //- details
  //-   summary Why should I use Kinopio for work?
  //-   section.subsection
  //-     blockquote
  //-       p There’s always been this myth that really neat, fun people at home all of a sudden get very dull and boring and serious when they come to work, and it’s simply not true.
  //-       p – Steve Jobs
  //-     p Exploring big ideas and tackling hard problems is anything but linear, it's a messy and chaotic process that uses both the creative (R) and analytical (L) sides of your brain.
  //-     p Using tools that embrace creativity and individuality prevents group-think and encourages collaborators to come up with new ways to solve hard problems. Features like trackable tasks and shared groups help turn brainstorming sessions into actionable project plans.
  //-     p Kinopio is designed for nimble teams that want to build shared understanding, get projects started faster, be more flexible to change, and work better together.

//- gdpr..

</template>

<style lang="stylus">
section.for-work
  .for-work-wrap
    background-color var(--for-work-background)
    border-radius var(--page-entity-radius)
    padding 2rem
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
</style>
