<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import consts from '@/consts.js'

const store = useStore()

const state = reactive({
  error: {
    location: false
  },
  showSignUpOrIn: false
})

// user

const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])
const triggerSignUpOrInIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerSignUpOrInIsVisible')
}

// weather

const weatherLocation = computed(() => store.state.currentUser.weatherLocation)
const showWeather = computed(() => store.state.currentUser.showWeather)
const toggleShowWeather = () => {
  state.error.location = false
  if (!currentUserIsSignedIn.value) {
    state.showSignUpOrIn = true
    return
  }
  const value = !showWeather.value
  if (value) {
    location()
    store.dispatch('currentUser/updateWeather')
  } else {
    removeWeather()
  }
}
const removeWeather = () => {
  store.dispatch('currentUser/update', { showWeather: false, weatherLocation: null })
}
const location = () => {
  if (consts.isDevelopment()) {
    // 🐪 somewhere in the Sahara
    const position = {
      coords: {
        latitude: '14.48456',
        longitude: '-13.80035'
      }
    }
    locationSuccess(position)
  } else {
    navigator.geolocation.getCurrentPosition(locationSuccess, locationError, {})
  }
}

// location

const locationSuccess = (position) => {
  let { latitude, longitude } = position.coords
  latitude = utils.roundFloat(latitude)
  longitude = utils.roundFloat(longitude)
  const location = `${latitude},${longitude}`
  store.dispatch('currentUser/update', { showWeather: true, weatherLocation: location })
}
const locationError = (error) => {
  console.error('🚑 locationError', error)
  removeWeather()
  state.error.location = true
}

// units

const weatherUnitIsCelcius = computed(() => store.state.currentUser.weatherUnitIsCelcius)
const toggleWeatherUnitIsCelcius = (value) => {
  store.dispatch('currentUser/update', { weatherUnitIsCelcius: value })
}
</script>

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

template(v-if="state.showSignUpOrIn")
  p
    span.badge.info Sign Up or In
    span to add weather to journals
  button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In

.row(v-if="state.error.location")
  .badge.danger Could not get your location.
    br
    br
    span You might need to add a new space, refresh, and try again
</template>

<style lang="stylus">
.weather-row
  align-items center
  p
    margin-top 0 !important
    margin-left 8px
</style>
