<template lang='pug'>
  .app
    header
      router-link(to="/") /
      router-link(to="/about") About
      router-link(to="/running-costs") Running Costs
    router-view
    canvas#drawing
</template>

<style lang="stylus">

primary-background = cyan
primary = black

*
  -webkit-overflow-scrolling touch
  -webkit-tap-highlight-color transparent
  box-sizing border-box

body
  margin 0
  color primary

.app
  background-color primary-background

header
  margin-bottom 1rem
  a
    margin-right 5px
</style>
