<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
</script>

<template lang="pug">
section.how-to
  h2 Bend Information into Knowledge
  //- p Kinopio gives you the tools to combine creative expression with focused productivity.
  .how-to-wrap
    .row
      .side.left
        h3 Cards and Connections
        p To create cards, tap anywhere and start typing. Format with markdown, paste URLs to create links and play YouTube videos, add images, colors and more. Connect related cards by dragging from the connector to another card.
      //- TODO vid
      .side.right full width VID 2222222222222 22222222222222222222222222222 222222222222222 2222222222222222222222 2

    .row
      .side.left
        h3 Boxes and Lists
        p When you’re ready to add structure, use Boxes to keep related items together. Lists let you vertically group and easily reorder cards, and are ideal for Kanban-style project management.
      //- TODO vid
      .side.right full width VID 2222222222222 22222222222222222222222222222 222222222222222 2222222222222222222222 2

    .row
      .side.left
        h3 Paint Select and Multi-Edit
        p Drag from an empty area to paint over items you want to move or edit them together. First-class bulk edits are one of Kinopio's most powerful features.
      //- TODO vid
      .side.right full width VID 2222222222222 22222222222222222222222222222 222222222222222 2222222222222222222222 2

    //- TODO help site link?

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
    @media(max-width 460px)
      padding 1rem
    // @media(max-width 540px)
    //   padding 1rem
</style>
