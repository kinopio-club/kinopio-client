<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import UserLabelInline from '@/components/UserLabelInline.vue'

const testimonials = computed(() => [

  // {
  //   message: 'When an idea first arises, there’s still so much shaping, transforming, deleting, expressing, before you can arrive at a semblance of a place. <em>Kinopio is perfect for making sense of this in-between state.</em>',
  //   name: 'Rain',
  // },

  {
    message: "I've actually been using and paying for Kinopio for a while. <em>I absolutely love Kinopio and it's immensely helpful, even more so as someone with ADHD</em>. Seriously lifesaving, plus a breath of fresh air",
    name: 'Ren'
  },

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
    message: "<em>I've fallen in love with Kinopio, even though I spent five years as an art director at Miro.</em> I'm happy to have found a better alternative to corporate giants.",
    name: 'Richard'
  },

  {
    message: "I really can't explain how grateful I am for Kinopio. It's probably changed my life, with the way <em>it allows me to think about things as a tool to sit alongside my Obsidian vault</em> (and my calendar, and my to-do list).",
    name: 'Stella'
  },
  // {
  //   message: "it's crazy how useful Kinopio can be, especially when you have a lot on your mind or when you're learning something new. <em>You can use Kinopio to get it all out of your head and see the thoughts and ideas in themes and clusters.</em>",
  //   name: 'Vin'
  // },

  {
    message: 'LOVING this software. <em>It’s reigniting my joy for using computers.</em> Thank you. Signed up as a paying user yesterday!',
    name: 'Nathan'
  },

  // {
  //   message: "",
  //   name: ""
  // },

  {
    message: 'Kinopio is the place where my brain is able to <em>find peace and clarity</em>',
    name: ''
  },

  // {
  //   message: "As bitsy rpg grows i started using Kinopio for planning - and it's still the BEST ! I've been using it for a year now to brainstorm ideas, organize thoughts, and as a planning tool. <em>It replaced every other tool i needed...so cool!</em>",
  //   name: 'twewyb'
  // },
  {
    message: 'Kinopio is a constant reminder of the magic in software',
    name: 'Rain'
  }

])

</script>

<template lang="pug">
section.testimonials
  h2 Join the Club
  .testimonials-wrap
    .testimonial(v-for="(testimonial, index) in testimonials")
      span “
      span(v-html="testimonial.message")
      span ” –
      UserLabelInline(:user="{ id: index, name: testimonial.name }")

</template>

<style lang="stylus">
section.testimonials

  .testimonials-wrap
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

    .user-label-inline-wrap
      margin-left 5px
      vertical-align 1px

// @media mobile 2x2

</style>
