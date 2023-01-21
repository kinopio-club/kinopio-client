<script setup>
// import utils from '@/utils.js'

import { reactive, computed, onMounted } from 'vue'
// https://vuex.vuejs.org/guide/composition-api.html#accessing-state-and-getters
import { useStore } from 'vuex'

defineProps({
  showSystem: Boolean
})
const store = useStore()

const themeName = computed(() => store.state.themes.current.name)
const isSystem = computed(() => store.state.themes.isSystem)
const updateTheme = (themeName) => {
  store.dispatch('themes/update', themeName)
  store.dispatch('themes/isSystem', false)
}
const toggleSystem = () => {
  store.dispatch('themes/toggleIsSystem')
}
</script>

<template lang="pug">
button(:class="{active: themeName === 'light'}" @click="updateTheme('light')")
  img.icon.light(src="@/assets/light.svg")
button(:class="{active: themeName === 'dark'}" @click="updateTheme('dark')")
  img.icon.dark(src="@/assets/dark.svg")
button(v-if="showSystem" @click="toggleSystem" :class="{active: isSystem}")
  span Use System
</template>

<style lang="stylus">
.icon.light,
.icon.dark
  vertical-align -1px
</style>
