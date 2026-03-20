<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
</script>

<template lang="pug">
section.how-to
  h2 Bend Information into Knowledge
  .how-to-wrap
    .row
      .side.left
        h3 Cards and Connections
        p To create cards, tap anywhere and start typing. Format with markdown, paste URLs to create links and play YouTube videos, add images, colors and more. Connect related cards by dragging from the connector to another card.
      //- video in .right
      .side.right full width VID 2222222222222 22222222222222222222222222222 222222222222222 2222222222222222222222 2

    .row
      .side.left
        h3 Paint Select and Multi-Edit
        p 11111111111111111111 111111111111111111111 11111111111
      .side.right full width VID 2222222222222 22222222222222222222222222222 222222222222222 2222222222222222222222 2

    .row
      .side.left
        h3 Boxes, Lists, and Lines
        p 11111111111111111111 111111111111111111111 11111111111
      .side.right full width VID 2222222222222 22222222222222222222222222222 222222222222222 2222222222222222222222 2

    .row
      .side.left
        h3 Sharing and Collaboration
        p 11111111111111111111 111111111111111111111 11111111111
      .side.right full width VID 2222222222222 22222222222222222222222222222 222222222222222 2222222222222222222222 2

    //- TODO help site link

</template>

<style lang="stylus">
:root
  --example-button-active-inset-shadow inset 0 1px 2px var(--primary-transparent)
  --how-to-column-gap 10px

section.how-to
  .how-to-wrap
    background-color var(--how-to-background)
    border-radius var(--page-entity-radius)
    padding 2rem
    @media(max-width 460px)
      padding 1rem
    .row
      display flex
      flex-wrap wrap
      justify-content space-between
      // 40 / 60??
      .left
        max-width calc(50% - var(--how-to-column-gap))
        margin-right var(--how-to-column-gap)
      .right
        max-width 50%
    .row + .row
      margin-top 20px
  h3
    margin-top 0
  img,
  video
    border-radius calc(var(--entity-radius) * 2)
    margin-bottom 0
  .button-badge.badge.active
    box-shadow var(--example-button-active-inset-shadow)
</style>
