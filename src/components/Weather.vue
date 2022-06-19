<template lang="pug">
.row.weather-row
  .button-wrap(@click="toggleShowWeather")
    button(:class="{ active: showWeather }")
      span Weather
  .segmented-buttons.weather-units(v-if="showWeather")
    button(@click="toggleWeatherUnitIsCelcius(false)" :class="{ active: !weatherUnitIsCelcius }")
      span F°
    button(@click="toggleWeatherUnitIsCelcius(true)" :class="{ active: weatherUnitIsCelcius }")
      span C°
  p(v-if="!weatherLocation") Requires location access
.row(v-if="error.location")
  .badge.danger Could not get your location.
    br
    br
    span You might need to add a new space, refresh, and try again
</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'Weather',
  components: {
  },
  data () {
    return {
      error: {
        location: false
      }
    }
  },
  computed: {
    showWeather () { return this.$store.state.currentUser.showWeather },
    weatherLocation () { return this.$store.state.currentUser.weatherLocation },
    weatherUnitIsCelcius () { return this.$store.state.currentUser.weatherUnitIsCelcius }
  },
  methods: {
    toggleShowWeather () {
      this.error.location = false
      const value = !this.showWeather
      if (value) {
        this.location()
      } else {
        this.removeWeather()
      }
    },
    removeWeather () {
      this.$store.dispatch('currentUser/update', { showWeather: false, weatherLocation: null })
    },
    location () {
      if (import.meta.env.MODE === 'development') {
        // 🐪 somewhere in the Sahara
        const position = {
          coords: {
            latitude: '14.48456',
            longitude: '-13.80035'
          }
        }
        this.locationSuccess(position)
      } else {
        navigator.geolocation.getCurrentPosition(this.locationSuccess, this.locationError, {})
      }
    },
    locationSuccess (position) {
      let { latitude, longitude } = position.coords
      latitude = utils.roundFloat(latitude)
      longitude = utils.roundFloat(longitude)
      const location = `${latitude},${longitude}`
      this.$store.dispatch('currentUser/update', { showWeather: true, weatherLocation: location })
    },
    locationError (error) {
      console.error('🚑 locationError', error)
      this.removeWeather()
      this.error.location = true
    },
    toggleWeatherUnitIsCelcius (value) {
      this.$store.dispatch('currentUser/update', { weatherUnitIsCelcius: value })
    }
  }
}
</script>

<style lang="stylus">
.weather-row
  align-items center
  p
    margin-top 0 !important
    margin-left 6px
  .weather-units
    button
      width 27px
      text-overflow initial
</style>
