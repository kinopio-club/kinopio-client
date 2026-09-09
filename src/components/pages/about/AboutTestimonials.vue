<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import UserLabelInline from '@/components/UserLabelInline.vue'

const testimonials = computed(() => [

  // {
  //   message: 'When an idea first arises, there’s still so much shaping, transforming, deleting, expressing, before you can arrive at a semblance of a place. <span class="badge info">Kinopio is perfect for making sense of this in-between state.</em>',
  //   name: 'Rain',
  // },

  // {
  //   message: "I've actually been using and paying for Kinopio for a while, I absolutely love Kinopio and it's immensely helpful, even more so as someone with ADHD (and, by the way, thank you so much for Kinopio! Seriously lifesaving, plus a breath of fresh air)",
  //   name: 'Ren',
  // },

  {
    message: 'I presented a Kinopio board to my students instead of a slideshow, and they were taking pictures of it. <em>It’s been the talk of the town/class.</em> Thanks again for the joy!',
    name: 'Maria'
  },

  {
    message: 'Kinopio is AWESOME! I love it, <em>I use it for work, to do lists, studying and plotting my books.</em>',
    name: 'BluRose'
  },

  {
    message: "I used to be a Milanote user, but ever since I discovered Kinopio, I've been hooked. <em>I'm drawn to its freedom, creativity, and meme-y vibe—it just clicks with my brain.</em> I'm planning to gradually transition to using it as my all-in-one tool.",
    name: 'Zimon'
  },

  {
    message: "<em>I've fallen in love with Kinopio,</em> even though I spent five years as an art director at Miro.  I'm happy to have found a better alternative to corporate giants.",
    name: 'Richard'
  }

])

</script>

<template lang="pug">
section.testimonials

  .testimonial(v-for="(testimonial, index) in testimonials")
    span “
    span(v-html="testimonial.message")
    span ” –
    UserLabelInline(:user="{ id: index, name: testimonial.name }")

</template>

<style lang="stylus">
section.testimonials
  display flex
  flex-wrap wrap
  gap 12px

  .testimonial
    width calc(33% - 2 * 6px)
    text-align center
    margin-bottom 10px
    em
      font-style normal
      background-color var(--info-background)

    // .badge
    //   margin 0

    .user-label-inline-wrap
      margin-left 5px
      vertical-align 1px

  // .testimonial + .testimonial
  //   margin-left 6px

// @media mobile 2x2

</style>
