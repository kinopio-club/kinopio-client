<script setup>
// import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const props = defineProps({
  command: String,
  name: String
})

const commandIsExplore = computed(() => props.command === 'explore')
const commandIsTemplates = computed(() => props.command === 'templates')
const commandIsNewSpace = computed(() => props.command === 'newSpace')

const clickCommand = () => {
  const explore = commandIsExplore.value
  const templates = commandIsTemplates.value
  const newSpace = commandIsNewSpace.value
  store.dispatch('closeAllDialogs')
  if (explore) {
    store.commit('triggerExploreIsVisible')
  } else if (templates) {
    store.commit('triggerTemplatesIsVisible')
  } else if (newSpace) {
    store.commit('triggerAddSpaceIsVisible')
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
