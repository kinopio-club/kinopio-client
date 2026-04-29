<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useHead } from '@unhead/vue'

// JSON-LD Structured Data
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does Kinopio compare to Miro, Milanote, Whimsical, and other whiteboard apps?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Physical whiteboards are productive because drawing and writing with markers is a naturally messy, chaotic process, which produces novel new ideas. But typical software whiteboards are designed around neatness and conformity. Kinopio spaces encourage creativity and experimentation with customizable backgrounds, colors, and embedded videos. Unlike competitors with hundreds of millions in VC funding, Kinopio is organic software, paid for by the people who use it. The result is a product that embraces individuality and personality, made for people, not drones.'
      }
    },
    {
      '@type': 'Question',
      name: 'Why doesn\'t Kinopio have AI features?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Because Kinopio is solely supported by the people who love it, we only add features that truly help users. With whiteboarding and mind-mapping, the journey of placing ideas, making connections, and figuring out groupings yourself is vitally important to building up your own spatial memory. This is the magic that makes big ideas easier to recall and reason about.'
      }
    },
    {
      '@type': 'Question',
      name: 'Why should I use Kinopio for work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Exploring big ideas and tackling hard problems is a messy and chaotic process that uses both creative and analytical sides of your brain. Using tools that embrace creativity prevents group-think and encourages collaborators to solve hard problems in new ways. Features like trackable tasks and shared groups help turn brainstorming sessions into actionable project plans. Kinopio is designed for nimble teams that want to build shared understanding and work better together.'
      }
    },
    {
      '@type': 'Question',
      name: 'Can I export my data?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, of course – what you write inside Kinopio belongs only to you. There are export options in a variety of formats, and you can download a backup of all your spaces together. There is also a public API available.'
      }
    },
    {
      '@type': 'Question',
      name: 'Who else uses Kinopio?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Kinopio is used by students, teachers, and researchers at NYU, The New School (Parsons), Yale, MIT, Stanford, Berkeley, Columbia, and School for Poetic Computation. It\'s also used by designers, engineers, and PMs at Discord, Brilliant, Cisco, Wikimedia, Atlassian, Spotify, and Moving Brands. Kinopio has been featured in The Verge and App Stacks, and was the ProductHunt #1 Product of the Day.'
      }
    }
  ]
}
const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Kinopio',
  description: 'Kinopio is a spatial note-taking tool for collecting and connecting your thoughts, ideas, and plans. Designed to work the way your mind works.',
  applicationCategory: 'ProductivityApplication',
  operatingSystem: 'Web browser',
  url: 'https://kinopio.club',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free for 100 cards'
  }
}
const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://kinopio.club/#organization',
  name: 'Kinopio',
  url: 'https://kinopio.club',
  logo: 'https://kinopio.club/favicon-32x32.png',
  foundingDate: '2018',
  founder: {
    '@type': 'Person',
    name: 'Piri',
    url: 'https://pketh.org'
  },
  sameAs: [
    'https://twitter.com/KinopioClub',
    'https://discord.gg/h2sR45Nby8',
    'https://forum.kinopio.club'
  ]
}
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Kinopio',
  url: 'https://kinopio.club',
  description: 'Kinopio is a spatial note-taking tool for collecting and connecting your thoughts, ideas, and plans.',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://kinopio.club/explore?search={search_term_string}',
    'query-input': 'required name=search_term_string'
  }
}
const aboutPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'About Kinopio',
  url: 'https://kinopio.club',
  description: 'Learn about Kinopio, a spatial note-taking tool for collecting and connecting your thoughts, ideas, and plans.',
  mainEntity: {
    '@id': 'https://kinopio.club/#organization'
  }
}
const productSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Kinopio',
  description: 'Kinopio is a spatial note-taking tool for collecting and connecting your thoughts, ideas, and plans. Designed to work the way your mind works.',
  url: 'https://kinopio.club',
  brand: {
    '@id': 'https://kinopio.club/#organization'
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free for 100 cards',
    availability: 'https://schema.org/InStock'
  }
}

useHead({
  link: [{
    rel: 'canonical',
    href: 'https://kinopio.club'
  }],
  script: [
    { type: 'application/ld+json', innerHTML: JSON.stringify(faqSchema) },
    { type: 'application/ld+json', innerHTML: JSON.stringify(softwareSchema) },
    { type: 'application/ld+json', innerHTML: JSON.stringify(orgSchema) },
    { type: 'application/ld+json', innerHTML: JSON.stringify(websiteSchema) },
    { type: 'application/ld+json', innerHTML: JSON.stringify(aboutPageSchema) },
    { type: 'application/ld+json', innerHTML: JSON.stringify(productSchema) }
  ]
})
</script>

<!-- eslint-disable-next-line vue/valid-template-root -->
<template></template>
