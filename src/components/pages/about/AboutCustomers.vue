<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import UserLabelInline from '@/components/UserLabelInline.vue'

const customers = computed(() => [

  // {
  //   message: 'When an idea first arises, there’s still so much shaping, transforming, deleting, expressing, before you can arrive at a semblance of a place. <span class="badge secondary">Kinopio is perfect for making sense of this in-between state.</span>',
  //   name: 'Rain',
  // },

  // {
  //   message: "I've actually been using and paying for Kinopio for a while, I absolutely love Kinopio and it's immensely helpful, even more so as someone with ADHD (and, by the way, thank you so much for Kinopio! Seriously lifesaving, plus a breath of fresh air)",
  //   name: 'Ren',
  // },

  {
    message: "I presented a Kinopio board to my students instead of a slideshow, and they were taking pictures of it. <span class='badge secondary'>It’s been the talk of the town/class.</span> Thanks again for the joy!",
    name: 'Maria',
    color: 'rgb(219, 6, 162)'
  },

  {
    message: "Kinopio is AWESOME! I love it, <span class='badge secondary'>I use it for work, to do lists, studying and plotting my books.</span>",
    name: 'BluRose',
    color: 'rgb(148, 212, 252)'
  },

  {
    message: "I used to be a Milanote user, but ever since I discovered Kinopio, I've been hooked. <span class='badge secondary'>I'm drawn to its freedom, creativity, and meme-y vibe—it just clicks with my brain.</span> I'm planning to gradually transition to using it as my all-in-one tool.",
    name: 'Zimon',
    color: 'rgb(6, 155, 55)'
  },

  {
    message: "<span class='badge secondary'>I've fallen in love with Kinopio,</span> even though I spent five years as an art director at Miro.  I'm happy to have found a better alternative to corporate giants.",
    name: 'Richard',
    color: 'rgb(202, 237, 113)'
  }

])

</script>

<template lang="pug">
section.customers

  .customer(v-for="(customer, index) in customers")
    //- div
    span “
    span(v-html="customer.message")
    span ”
    UserLabelInline(:user="{ id: index, name: customer.name, color: customer.color }")

</template>

<style lang="stylus">
section.customers
  display flex
  flex-wrap wrap

  .customer
    width calc(33% - 2 * 6px)
    text-align center
    margin-bottom 10px
    .badge
      margin 0

    .user-label-inline-wrap
      margin-left 5px
      vertical-align 1px

  .customer + .customer
    margin-left 6px

// @media mobile 2x2

</style>
