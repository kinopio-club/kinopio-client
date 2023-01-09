<template lang="pug">
dialog.narrow.pricing(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p Kinopio is free for 100 cards, afterwards it's $6/month or $60/year
    table
      tbody
        tr.table-header
          td Free
          td Upgraded
        tr
          td 100 Cards
          td Unlimited Cards
        tr
          td 5mb file upload size limit
          td No upload limit
        tr
          td 10 AI images
          td 50 AI images/mo

  section
    p Hi, my name is Pirijan and I'm the creator of Kinopio.
    p I believe in building ethical, economically-sustainable,
      span {{' '}}
      a(href="https://pketh.org/organic-software.html") organic software
      span {{' '}}
      span that's designed by artists, built by craftspeople, and funded by the people who enjoy it.
</template>

<script>
export default {
  name: 'Pricing',
  props: {
    visible: Boolean
  }
}
</script>

<style lang="stylus">
.pricing
  top calc(100% - 8px)
  left initial
  right 8px
  max-height calc(100vh - 25px)
  p
    user-select text
</style>
