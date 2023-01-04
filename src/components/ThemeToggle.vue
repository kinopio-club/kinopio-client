<script setup>
// import utils from '@/utils.js'

import { reactive, computed, onMounted } from 'vue'
// https://vuex.vuejs.org/guide/composition-api.html#accessing-state-and-getters
import { useStore } from 'vuex'
const store = useStore()

const themeName = computed(() => store.state.themes.current.name)
const updateTheme = (themeName) => {
  console.log('💖', themeName)
  store.dispatch('themes/update', themeName)
}
</script>

<template lang="pug">
button(:class="{active: themeName === 'light'}" @click="updateTheme('light')")
  img.icon.light(src="@/assets/light.svg")
button(:class="{active: themeName === 'dark'}" @click="updateTheme('dark')")
  img.icon.dark(src="@/assets/dark.svg")
</template>

<style lang="stylus">
.icon.light,
.icon.dark
  vertical-align -1px
</style>
