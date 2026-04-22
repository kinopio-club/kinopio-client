<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useConnectionStore } from '@/stores/useConnectionStore'

import utils from '@/utils.js'

import last from 'lodash-es/last'
import randomColor from 'randomcolor'

const globalStore = useGlobalStore()
const themeStore = useThemeStore()
const connectionStore = useConnectionStore()

const dialogElement = ref(null)

const props = defineProps({
  visible: Boolean,
  selectedConnections: Array
})

const state = reactive({
  nextColor: ''
})

// dialog

watch(() => props.visible, async (value, prevValue) => {
  await nextTick()
  if (value) {
    scrollIntoView()
    updateNextColor()
  }
})
const scrollIntoView = () => {
  const element = dialogElement.value
  globalStore.scrollElementIntoView({ element })
}
const changeColor = (color) => {
  props.selectedConnections.forEach(connection => {
    const update = {
      id: connection.id,
      color,
      updatedAt: new Date()
    }
    connectionStore.updateConnection(update)
  })
}
const colorIsActive = (color) => {
  return props.selectedConnections.find(connection => {
    return connection.connection.color === color
  })
}
const updateNextColor = () => {
  state.nextColor = themeStore.randomColor()
}
</script>

<template lang="pug">
dialog.narrow.multiple-connections-picker(v-if="visible" :open="visible" ref="dialogElement" @click.left.stop)
  section.results-actions
    //- button(@click.left="addConnectionType")
    //-   img.icon(src="@/assets/add.svg")
    //-   .badge.badge-in-button(:style="{backgroundColor: state.nextConnectionTypeColor}")
    //-   span Type
  section.results-section
    ul.results-list
      template(v-for="connection in connectionByUpdatedAtUniqueColors" :key="connection.id")
        li(:class="{ active: colorIsActive(type) }" @click.left="changeColor(connection.color)" tabindex="0" v-on:keyup.enter="changeColor(connection.color)")
          .badge(:style="{backgroundColor: connection.color}")
          //- .name {{connection.name}}
</template>

<style lang="stylus">
.multiple-connections-picker
  overflow auto
  .badge-in-button
    margin-left 5px
</style>
