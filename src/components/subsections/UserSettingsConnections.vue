<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useUserStore } from '@/stores/useUserStore'
import { useConnectionStore } from '@/stores/useConnectionStore'

import UserSettingsConnections from '@/components/dialogs/UserSettingsConnections.vue'

const userStore = useUserStore()
const connectionStore = useConnectionStore()

const customInputElement = ref(null)

const props = defineProps({
  visible: Boolean
})

const lastColor = computed(() => {
  return connectionStore.getLastConnectionColor
})
const shouldUseLastConnectionColor = computed(() => userStore.shouldUseLastConnectionColor)
const toggleShouldUseLastConnectionColor = () => {
  const value = !shouldUseLastConnectionColor.value
  userStore.updateUser({ shouldUseLastConnectionColor: value })
}
</script>

<template lang="pug">
.connections-settings(v-if="visible")
  //- use last color
  section
    .row
      span New Connection Colors
    .row
      label(:class="{active: shouldUseLastConnectionColor}" @click.left.prevent="toggleShouldUseLastConnectionColor" @keydown.stop.enter="toggleShouldUseLastConnectionColor")
        input(type="checkbox" v-model="shouldUseLastConnectionColor")
        .badge.badge-in-button(:style="{backgroundColor: lastColor}")
        span Use Last Color
    section.subsection
      p(v-if="shouldUseLastConnectionColor")
       span New connection color will be from connection last created, edited, or clicked on.
      p(v-else) New connection color will be random.
      p
        img.icon.connector-icon(src="@/assets/connector-open.svg")
        span Shift-Drag to use{{' '}}
        span(v-if="shouldUseLastConnectionColor") random color
        span(v-if="!shouldUseLastConnectionColor") last color
</template>

<style lang="stylus">
.connections-settings
  overflow auto
  .badge-in-button
    margin 0
    padding initial
    vertical-align -2px
    margin-right 5px
    height 14px
    display inline-block
    width 14px
    min-width initial
    min-height initial
    border-radius var(--small-entity-radius)
  section.subsection
    p:first-child
      margin-top 0
</style>
