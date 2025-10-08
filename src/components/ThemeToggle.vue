<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useThemeStore } from '@/stores/useThemeStore'

const userStore = useUserStore()
const spaceStore = useSpaceStore()
const themeStore = useThemeStore()

const props = defineProps({
  isSmall: Boolean
})

const themeName = computed(() => userStore.theme)
const updateTheme = (themeName) => {
  themeStore.updateTheme(themeName)
  themeStore.updateThemeIsSystem(false)
}

</script>

<template lang="pug">
button(:class="{active: themeName === 'light', 'small-button': props.isSmall}" @click="updateTheme('light')" title="Light Mode (T)")
  img.icon.light(src="@/assets/light.svg")
button(:class="{active: themeName === 'dark', 'small-button': props.isSmall}" @click="updateTheme('dark')" title="Dark Mode (T)")
  img.icon.dark(src="@/assets/dark.svg")
</template>

<style lang="stylus">
.icon.light,
.icon.dark
  vertical-align -1px
</style>
