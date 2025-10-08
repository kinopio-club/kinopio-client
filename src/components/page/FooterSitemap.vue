<script setup>
</script>

<template lang="pug">
footer.sitemap
  nav.row
    div
      p PRODUCT
      a(href="/about") About
      a(href="/blog") Blog
      a(href="/changelog") Changelog
      a(href="/roadmap") Roadmap
    div
      p SUPPORT
      a(href="mailto:hi@kinopio.club") Contact
      a(href="/forum") Forum
      a(href="/help") Help
    div
      p COMMUNITY
      a(href="/api") API Docs
      a(href="/discord") Discord
      a(href="https://github.com/kinopio-club") Github
    div
      p ﾉ乙(､ﾝ､)_
      a(href="https://help.kinopio.club/posts/terms-of-service/") Terms
      a(href="https://help.kinopio.club/posts/privacy-policy/") Privacy
</template>

<style lang="stylus">
footer.sitemap
  padding 2rem
  background #223c2f
  border-radius var(--page-entity-radius)
  max-width 100%
  margin 4rem 12px
  margin-bottom 0
  p
    margin-top 0
    margin-bottom 10px
    color white
  a
    display block
    color white
    &:hover
      text-decoration none
  .row
    display flex
    flex-direction row
    justify-content flex-start
    gap 40px
  @media(max-width 520px)
    .row
      gap 15px
</style>
