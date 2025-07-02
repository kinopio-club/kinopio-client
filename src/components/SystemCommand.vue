<script setup>
import { reactive, computed, onMounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

const globalStore = useGlobalStore()
const spaceStore = useSpaceStore()

const props = defineProps({
  command: String,
  name: String
})

const commandIsExplore = computed(() => props.command === 'explore')
const commandIsTemplates = computed(() => props.command === 'templates')
const commandIsNewSpace = computed(() => props.command === 'newSpace')
const commandIsApps = computed(() => props.command === 'apps')

const clickCommand = async () => {
  const explore = commandIsExplore.value
  const templates = commandIsTemplates.value
  const newSpace = commandIsNewSpace.value
  const apps = commandIsApps.value
  globalStore.closeAllDialogs()
  await nextTick()
  if (explore) {
    globalStore.triggerExploreIsVisible()
  } else if (templates) {
    globalStore.triggerTemplatesIsVisible()
  } else if (newSpace) {
    spaceStore.createSpace()
    globalStore.addNotification({ message: 'New space created (N)', icon: 'add', type: 'success' })
    globalStore.triggerSpaceDetailsInfoIsVisible()
  } else if (apps) {
    globalStore.triggerAppsAndExtensionsIsVisible()
  }
}

</script>

<template lang="pug">
button.small-button.system-command(
  @click.stop="clickCommand"
  @touchstart.stop="clickCommand"
  @keyup.stop.enter="clickCommand"
  :class="{ success: commandIsNewSpace }"
  :title="name"
)
  img.icon.sunglasses(v-if="commandIsExplore" src="@/assets/sunglasses.svg")
  img.icon.templates(v-if="commandIsTemplates" src="@/assets/templates.svg")
  img.icon.add(v-if="commandIsNewSpace" src="@/assets/add.svg")
  span {{name}}
</template>

<style lang="stylus">
</style>
