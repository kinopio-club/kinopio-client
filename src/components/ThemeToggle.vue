<script setup>
import { reactive, computed, onMounted, defineProps } from 'vue'
// https://vuex.vuejs.org/guide/composition-api.html#accessing-state-and-getters
import { useStore } from 'vuex'
const store = useStore()

defineProps({
  showSystem: Boolean
})

const themeName = computed(() => store.state.currentUser.theme)
const isSystem = computed(() => store.state.currentUser.themeIsSystem)
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
  span Use System Theme
</template>

<style lang="stylus">
.icon.light,
.icon.dark
  vertical-align -1px
</style>
