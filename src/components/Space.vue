<template lang="pug">
  main.space
    .item
      p hello {{ msg }}
      p {{math}}
      p(:alt="color" @click="hello") {{color}}
      p(@click="test") console.log click meee
      p(v-if="show") table show {{yolo}}
</template>

<script>
import randomcolor from 'randomcolor'

export default {
  name: 'Space',
  props: {
    msg: String
  },
  created () {
    console.log('its me', this.math)
    this.color = randomcolor()
  },
  // a component’s data option must be a function, so that each instance can maintain an independent copy of the returned data object
  data () {
    return {
      show: true,
      math: 12 + 101,
      color: ''
    }
  },

  // a value that updates when anything in it gets updated,
  // use this whenever you want to filter or transform Data
  computed: {
    yolo () {
      return this.$store.state.lollipops
    }
  },

  // a function bound to the component, only run when explicitly called
  // re-evaluated each time it's called
  // https://stackoverflow.com/questions/44350862/method-vs-computed-in-vue
  methods: {
    hello () {
      console.log('hello!', this.math)
      this.color = randomcolor()
    },
    test () {
      console.log(123)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only, no-scope = part of the global css -->
<style lang="stylus">
.space
  position absolute
  top 0
  left 0
  width: 100%
  height: 100%
  pointer-events none
.item
  pointer-events all
  background-color lightgrey
  position absolute
  top 80px
  left 80px
</style>
