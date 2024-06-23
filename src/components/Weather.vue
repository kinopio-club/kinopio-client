<template lang="pug">
.row.weather-row
  .segmented-buttons
    button(@click="toggleShowWeather" :class="{ active: showWeather }")
      span Weather
  .segmented-buttons(v-if="showWeather")
    button(@click="toggleWeatherUnitIsCelcius(false)" :class="{ active: !weatherUnitIsCelcius }")
      span F°
    button(@click="toggleWeatherUnitIsCelcius(true)" :class="{ active: weatherUnitIsCelcius }")
      span C°
  p(v-if="!weatherLocation") Requires location access

template(v-if="showSignUpOrIn")
  p
    span.badge.info Sign Up or In
    span to add weather to journals
  button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In

.row(v-if="error.location")
  .badge.danger Could not get your location.
    br
    br
    span You might need to add a new space, refresh, and try again
</template>

<script>
import utils from '@/utils.js'
import consts from '@/consts.js'

export default {
  name: 'Weather',
  components: {
  },
  data () {
    return {
      error: {
        location: false
      },
      showSignUpOrIn: false
    }
  },
  computed: {
    showWeather () { return this.$store.state.currentUser.showWeather },
    weatherLocation () { return this.$store.state.currentUser.weatherLocation },
    weatherUnitIsCelcius () { return this.$store.state.currentUser.weatherUnitIsCelcius },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] }
  },
  methods: {
    toggleShowWeather () {
      this.error.location = false
      if (!this.currentUserIsSignedIn) {
        this.showSignUpOrIn = true
        return
      }
      const value = !this.showWeather
      if (value) {
        this.location()
        this.$store.dispatch('currentUser/updateWeather')
      } else {
        this.removeWeather()
      }
    },
    removeWeather () {
      this.$store.dispatch('currentUser/update', { showWeather: false, weatherLocation: null })
    },
    location () {
      if (consts.isDevelopment()) {
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
    },
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('triggerSignUpOrInIsVisible')
    }
  }
}
</script>

<style lang="stylus">
.weather-row
  align-items center
  p
    margin-top 0 !important
    margin-left 8px
</style>
