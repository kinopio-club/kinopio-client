<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import consts from '@/consts.js'
import utils from '@/utils.js'

// safari can't play webm with alpha transparency
// https://caniuse.com/?search=webm
const isSafari = computed(() => utils.isSafari() || utils.isIPhone())
</script>

<template lang="pug">
section.how-to
  h2 Bend Information into Knowledge
  .how-to-wrap
    .row
      .side.left
        h3 Cards and Connections
        p To create cards, tap anywhere and start typing. Format with markdown, paste URLs to create links and play YouTube videos, add images, colors and more. Connect related cards by dragging from the connector to another card.

      .side.right
        video(
          autoplay
          loop
          muted
          playsinline
          aria-label="Showing clicking anywhere, typing to add cards, connecting cards together, and dragging them around"
          poster="https://updates.kinopio.club/page/about/how-to/1.webp"
        )
          source(v-if="isSafari" src="https://updates.kinopio.club/page/about/how-to/1.mp4")
          source(v-else src="https://updates.kinopio.club/page/about/how-to/1.webm")
    .row
      .side.left
        h3 Boxes and Lists
        p When you’re ready to add structure, use Boxes to keep related items together. Lists let you vertically group and easily reorder cards, and are ideal for Kanban-style project management.

      .side.right
        video(
          autoplay
          loop
          muted
          playsinline
          aria-label="Showing moving boxes, adding cards to list, and rearranging"
          poster="https://updates.kinopio.club/page/about/how-to/2.webp"
        )
          source(v-if="isSafari" src="https://updates.kinopio.club/page/about/how-to/2.mp4")
          source(v-else src="https://updates.kinopio.club/page/about/how-to/2.webm")
    .row
      .side.left
        h3 Paint Select and Multi-Edit
        p Drag from an empty area to paint over items you want to move or edit them together. First-class bulk edits are one of Kinopio's most powerful features.

      .side.right
        video(
          autoplay
          loop
          muted
          playsinline
          aria-label="Showing paint select cards, dragging them together, and making them into a list, then paint selecting other cards and making them tasks and checking them off"
          poster="https://updates.kinopio.club/page/about/how-to/3.webp"
        )
          source(v-if="isSafari" src="https://updates.kinopio.club/page/about/how-to/3.mp4")
          source(v-else src="https://updates.kinopio.club/page/about/how-to/3.webm")
</template>

<style lang="stylus">
:root
  --how-to-column-gap 10px

section.how-to
  .how-to-wrap
    background-color var(--how-to-background)
    background-color #004021
    color white
    border-radius var(--page-entity-radius)
    padding 2rem
    .row
      display flex
      flex-wrap wrap
      justify-content space-between
      .left
        max-width calc(50% - var(--how-to-column-gap))
        margin-right var(--how-to-column-gap)
      .right
        max-width 50%
      @media(max-width 600px)
        flex-wrap nowrap
        flex-direction column
        .left,
        .right
          max-width 100%
          margin-right initial
    .row + .row
      margin-top 20px
    h3
      margin-top 0
    img,
    video
      border-radius calc(var(--entity-radius) * 2)
      margin-bottom 0
    @media(max-width 460px)
      padding 1rem
</style>
