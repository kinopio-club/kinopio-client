<script setup>
import { reactive, computed, onMounted, defineProps } from 'vue'
// https://vuex.vuejs.org/guide/composition-api.html#accessing-state-and-getters
import { useStore } from 'vuex'
const store = useStore()

const themeName = computed(() => store.state.currentUser.theme)
const updateTheme = (themeName) => {
  store.dispatch('themes/update', themeName)
  store.dispatch('themes/isSystem', false)
}

</script>

<template lang="pug">
button(:class="{active: themeName === 'light'}" @click="updateTheme('light')" title="Light Mode (T)")
  img.icon.light(src="@/assets/light.svg")
button(:class="{active: themeName === 'dark'}" @click="updateTheme('dark')" title="Dark Mode (T)")
  img.icon.dark(src="@/assets/dark.svg")
</template>

<style lang="stylus">
.icon.light,
.icon.dark
  vertical-align -1px
</style>
