<template lang='pug'>
  .costs
    h1 Kinopio Service Costs
    p like https://cushionapp.com/running-costs

    p filter [all |capital|recurring (month,year)]
    p capital cost | subscription

    p {{math}}
    p(:alt="color" @click="hello") {{color}}
    p(@click="test") c3 graph click meee
    p(v-if="show") table show {{yolo}}
</template>

<script lang="ts">
import randomcolor from 'randomcolor'

export default {
  created () {
    console.log('its me', this.math)
    this.color = randomcolor()
  },

  // a component’s data option must be a function, so that each instance can maintain an independent copy of the returned data object
  data () {
    return {
      show: true,
      // display a graph of costs
      // x = time, y = $
      // if x is time , then this needs to be an ongoing list of expenses, maybe from a diff data source like an airtable
      // if all are recurring costs, and i only care about the current ongoing costs to run the service .. then x for time is irrelevant, and i'm looking for pie-chart alternatives as that point
      costs: [
        { name: 'airtable', price: 123, url: 'sup', type: 'monthly', description: 'blah blah blah long text' },
        { name: 'sketch', price: 100, url: 'https://www.sketch.com/', type: 'yearly', description: 'blah blah blah long text' }
      ],
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
