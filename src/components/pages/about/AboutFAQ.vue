<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
</script>

<template lang="pug">
section.faq
  h2 FAQ

  details
    summary How does Kinopio compare to Miro, Milanote, Whimsical, and other whiteboard apps?
    section.subsection
      p Physical whiteboards are so productive because drawing and writing with markers is a naturally messy, chaotic process, which produces novel new ideas and shared understanding.
      p But the typical software whiteboard is designed around neatness and conformity. Expressiveness and personality is replaced with a maze through endless toolbars and sticky notes in one of five designer-approved pastel shades.
      p Taking a different approach, Kinopio's just-click-and-type design and visual customizability is designed to encourage creativity and experimentation.
      p Like a physical whiteboard, the outputs produced this way tend to be{{' '}}
        a(href="https://uxdesign.cc/low-fidelity-design-is-higher-up-the-value-chain-fdf1824c6aa1") lower-fidelity
        span {{' '}}and conceptual – ideal for problem solving, and for turning debates into discussions.
      p The other major difference is that Kinopio is{{' '}}
        a(href="https://pketh.org/organic-software.html") organic software
        span , paid for by the people who use it, rather than by VC investors looking for an{{' '}}
        a(href="https://ourincrediblejourney.tumblr.com/") easy exit
        span {{' '}}that leaves users high and dry.
      table
        thead
          tr
            td
              strong Company
            td
              strong VC Funding
        tbody
          tr
            td Figjam
            td $1,400,000,000 Series F
          tr
            td Miro
            td $476,300,000 Series C
          tr
            td Mural
            td $196,600,000 Series C
          tr
            td Padlet
            td $12,700,000 Series A
          tr
            td Whimsical
            td $30,000,000 Series A
          tr
            td.badge.info Kinopio
            td.badge.info $0
      p The result? Kinopio is a product that embraces individuality and personality. Made for people, not drones.
      p To see how this plays out IRL, here's a video by a customer comparing{{' '}}
        a(href="https://www.youtube.com/watch?v=Colow9UCPqM") Kinopio vs Milanote
        span .

  details
    summary Why doesn't Kinopio have AI features?
    section.subsection
      p Because Kinopio is solely supported by the people who love it, I have the insane privilege of being able to only add features that fit into the product and truly help its users.
      p
        span With whiteboarding, mind-mapping, or mood-boarding, it's{{' '}}
          strong the journey
          span {{' '}}of placing ideas and images, making connections, and figuring out what things should be grouped together yourself is vitally important to building up your own{{' '}}
        a(href="https://en.wikipedia.org/wiki/Spatial_memory") spatial memory
        span . This is the magic that makes big ideas easier to recall and reason about.

  details
    summary Do I have full control over my data?
    section.subsection
      p Yes. Your data belongs to you and will never be sold.
      p You can import and export spaces in a variety of formats, including as open{{' '}}
        a(href="https://jsoncanvas.org/") JSON Canvas
        span {{' '}}files, and you can download a backup of all your spaces together.
      p There is also a comprehensive{{' '}}
        a(href="/api") public API
        span {{' '}} so that you can build your own custom integrations and tooling.
      p And if you'd like, you can{{' '}}
        a(href="/help/delete-your-account/") delete your account
        span {{' '}}at any time.
      //- p For more information,{{' '}}
      //-   a(href="/help/security") Trust & Security (GDPR, CPRA)
      //-   span ,{{' '}}
      //-   a(href="/help/privacy-policy/") Privacy Policy
      //-   span .

  details
    summary Will Kinopio still be around years from now?
    section.subsection
      p
        span Kinopio started in 2019 and my answer to this question is the same as it was
        a(href="https://pketh.org/kinopio-plans.html") back then
        span .
      //- p
      //-   span You're about to put years of your life into Kinopio so my answer to this question is the same as it was back in 2019.
      p
        span Kinopio consists of two codebases, the
        span.badge.info client
        span app that runs in your browser, and the
        span.badge.info server
        span app which enables sharing and collaboration. The client app is like a cockroach, it’s tiny, free to host,
        a(href="https://github.com/kinopio-club/kinopio-client") the code is public
        span , and doesn’t depend on a connection to the server app. The server is also pint-sized and cheap to run indefinetely. But even if the server dies you can continue to use Kinopio as you do now – with all your data intact.
      p
        a(href="https://kinopio.club/kinopio-architecture-and-costs-JOGXFJ0FEMpS3crbh6U9k") Kinopio Architecture and Costs

</template>

<style lang="stylus">
section.faq
  max-width 480px
  section.subsection
    padding 12px !important
    padding-top 2px !important
    margin-bottom 0.5rem
    table
      td
        padding 5px 10px
</style>
