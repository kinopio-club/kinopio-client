<template lang="pug">
dialog.add-space.narrow(
  v-if="visible"
  :open="visible"
  @touchend.stop
  @click.left.stop
  :class="{'short': screenIsShort}"
  ref="dialog"
  :style="{'max-height': dialogHeight + 'px'}"
)
  section
    .row
      .segmented-buttons
        button.success(@click="addSpace")
          img.icon(src="@/assets/add.svg")
          span New Space
        button(@click.left.stop="toggleEditNewSpaceIsVisible" :class="{ active: editNewSpaceIsVisible }")
          img.down-arrow.button-down-arrow(src="@/assets/down-arrow.svg")

    //- Edit Space
    .row(v-if="editNewSpaceIsVisible")
      label(:class="{active: newSpacesAreBlank}" @click.left.prevent="toggleNewSpacesAreBlank" @keydown.stop.enter="toggleNewSpacesAreBlank")
        input(type="checkbox" v-model="newSpacesAreBlank")
        span New Spaces Are Blank
    .row
      .segmented-buttons
        button(@click="addJournalSpace" :class="{ active: loading.weather }")
          img.icon(src="@/assets/add.svg")
          MoonPhase(:moonPhase="moonPhase.name")
          span Daily Journal
          Loader(:visible="loading.weather")
        button(@click.left.stop="toggleEditPromptsIsVisible" :class="{ active: editPromptsIsVisible }")
          img.down-arrow.button-down-arrow(src="@/assets/down-arrow.svg")
    //- Edit Journal
    template(v-if="editPromptsIsVisible")
      .row.weather-row
        .button-wrap(@click="toggleShowWeather")
          button(:class="{ active: showWeather }")
            span Weather
        .segmented-buttons.weather-units(v-if="showWeather")
          button(@click="toggleWeatherUnitIsCelcius(false)" :class="{ active: !weatherUnitIsCelcius }") F°
          button(@click="toggleWeatherUnitIsCelcius(true)" :class="{ active: weatherUnitIsCelcius }") C°
        p(v-if="!weatherLocation") Requires location access
      .row(v-if="error.location")
        .badge.danger Could not get your location
      .row
        .button-wrap
          button(@click.left="addCustomPrompt")
            img.icon(src="@/assets/add.svg")
            span Add Daily Prompt
    template(v-if="editPromptsIsVisible" )
      Prompt(v-for="prompt in userPrompts" :prompt="prompt" :key="prompt.id" @showScreenIsShort="showScreenIsShort")
    PromptPackPicker(v-if="editPromptsIsVisible" :visible="editPromptsIsVisible" :position="promptPickerPosition" @select="togglePromptPack")

  //- Templates
  section
    button(@click="triggerTemplatesIsVisible")
      img.icon.templates(src="@/assets/templates.svg")
      span Templates

</template>

<script>
import Prompt from '@/components/Prompt.vue'
import PromptPackPicker from '@/components/dialogs/PromptPackPicker.vue'
import moonphase from '@/moonphase.js'
import MoonPhase from '@/components/MoonPhase.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'
import Loader from '@/components/Loader.vue'

import last from 'lodash-es/last'
import { nanoid } from 'nanoid'

export default {
  name: 'AddSpace',
  components: {
    Prompt,
    PromptPackPicker,
    MoonPhase,
    Loader
  },
  props: {
    visible: Boolean,
    shouldAddSpaceDirectly: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
      }
    })
  },
  mounted () {
    this.moonPhase = moonphase()
  },
  data () {
    return {
      moonPhase: {},
      editPromptsIsVisible: false,
      editNewSpaceIsVisible: false,
      urlIsCopied: false,
      promptPickerPosition: {
        left: 80,
        top: 5
      },
      screenIsShort: false,
      dialogHeight: null,
      loading: {
        weather: false
      },
      error: {
        location: false
      }
    }
  },
  computed: {
    userPrompts () { return this.$store.state.currentUser.journalPrompts },
    currentUserId () { return this.$store.state.currentUser.id },
    newSpacesAreBlank () { return this.$store.state.currentUser.newSpacesAreBlank },
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
    showScreenIsShort (value) {
      this.screenIsShort = true
      this.shouldHideFooter(true)
      this.updateDialogHeight()
    },
    shouldHideFooter (value) {
      this.$store.commit('shouldExplicitlyHideFooter', value)
    },
    async weather () {
      if (!this.showWeather) {
        this.store.commit('weather', undefined)
        return
      }
      try {
        this.loading.weather = true
        const apiKey = 'qM8rme33sr7AtpNB8l0xLa8itqjRk5Bi9HeQcecH'
        let url = `https://api.pirateweather.net/forecast/${apiKey}/${this.weatherLocation}`
        if (this.weatherUnitIsCelcius) {
          url = url + '?units=ca'
        }
        const response = await fetch(url)
        const data = await response.json()

        console.log('🐸', data, this.weatherUnitIsCelcius)
        console.log(data.currently.apparentTemperature, data.currently.icon)
      } catch (error) {
        console.error('🚒 weather', error)
        this.store.commit('weather', undefined)
      }
      this.loading.weather = false
    },
    async addJournalSpace () {
      if (this.loading.weather) { return }
      await this.weather()
      this.$emit('closeDialogs')
      this.$emit('addJournalSpace')
      if (this.shouldAddSpaceDirectly) {
        this.$store.dispatch('closeAllDialogs', 'addSpace.addJournalSpace')
        window.scrollTo(0, 0)
        this.$store.dispatch('currentSpace/addJournalSpace')
        this.$store.dispatch('currentSpace/updateSpacePageSize')
        this.$store.commit('triggerSpaceDetailsInfoIsVisible')
      }
    },
    addSpace () {
      const noUserSpaces = !cache.getAllSpaces().length
      if (noUserSpaces) {
        window.location.href = '/'
      } else {
        this.$emit('closeDialogs')
        this.$emit('addSpace')
      }
      if (this.shouldAddSpaceDirectly) {
        this.$store.dispatch('closeAllDialogs', 'addSpace.addSpace')
        window.scrollTo(0, 0)
        this.$store.dispatch('currentSpace/addSpace')
        this.$store.dispatch('currentSpace/updateSpacePageSize')
        this.$store.commit('triggerSpaceDetailsInfoIsVisible')
      }
    },
    toggleNewSpacesAreBlank () {
      const value = !this.newSpacesAreBlank
      this.$store.dispatch('currentUser/newSpacesAreBlank', value)
    },
    toggleEditNewSpaceIsVisible () {
      const value = !this.editNewSpaceIsVisible
      this.closeAll()
      this.editNewSpaceIsVisible = value
    },
    toggleEditPromptsIsVisible () {
      const value = !this.editPromptsIsVisible
      this.closeAll()
      this.editPromptsIsVisible = value
    },
    closeAll () {
      this.editNewSpaceIsVisible = false
      this.editPromptsIsVisible = false
      this.urlIsCopied = false
    },
    copyUrl () {
      const element = this.$refs.url
      element.select()
      element.setSelectionRange(0, 99999) // for mobile
      document.execCommand('copy')
      this.urlIsCopied = true
    },
    addCustomPrompt () {
      const emptyPrompt = { id: nanoid(), name: '', userId: this.currentUserId }
      this.$store.dispatch('currentUser/addJournalPrompt', emptyPrompt)
      this.$nextTick(() => {
        const textareas = document.querySelectorAll('.add-space textarea')
        last(textareas).focus()
      })
    },
    addPromptPack (pack) {
      const promptPack = { id: nanoid(), name: pack.name, packId: pack.packId, userId: this.currentUserId }
      this.$store.dispatch('currentUser/addJournalPrompt', promptPack)
    },
    togglePromptPack (pack) {
      const userPack = this.userPrompts.find(userPrompt => {
        if (!userPrompt.packId) { return }
        return pack.packId === userPrompt.packId.toString()
      })
      if (userPack) {
        this.$store.dispatch('currentUser/removeJournalPrompt', userPack)
      } else {
        this.addPromptPack(pack)
      }
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    },
    triggerTemplatesIsVisible () {
      this.closeAll()
      this.$store.dispatch('closeAllDialogs', 'addSpace.addJournalSpace')
      this.$store.commit('triggerTemplatesIsVisible')
    }
  },
  watch: {
    visible (visible) {
      this.closeAll()
      this.shouldHideFooter(false)
      this.updateDialogHeight()
    }
  }
}
</script>

<style lang="stylus">
.add-space
  overflow auto
  &.short
    top -68px !important
  max-height calc(100vh - 230px)
  .textarea
    background-color var(--secondary-background)
    border 0
    border-radius 3px
    padding 4px
  .button-down-arrow
    padding 0
  .weather-row
    align-items center
    p
      margin 0
      margin-left 6px
  .weather-units
    button
      width 27px
      text-overflow initial
</style>
