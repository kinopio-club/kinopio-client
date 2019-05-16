<template lang='pug'>
  span
    nav
      router-link(to="/") /
      router-link(to="/about") About
      router-link(to="/running-costs") Running Costs
    router-view
</template>

<style lang="stylus">
*
  -webkit-overflow-scrolling: touch
  -webkit-tap-highlight-color: transparent
  box-sizing: border-box

body
  background-color: cyan
  margin: 0

// header

nav
  margin-bottom: 1rem
  a
    margin-right: 5px
</style>
