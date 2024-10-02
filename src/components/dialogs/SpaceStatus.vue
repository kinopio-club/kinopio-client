<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Loader from '@/components/Loader.vue'
import cache from '@/cache.js'
import utils from '@/utils.js'
const store = useStore()

const props = defineProps({
  visible: Boolean
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    const cachedSpace = cache.space(currentSpace.value.id)
    state.spaceIsCached = utils.arrayHasItems(cachedSpace.cards)
  }
})

const state = reactive({
  spaceIsCached: false
})

const currentSpace = computed(() => store.state.currentSpace)

const refreshBrowser = () => {
  window.location.reload()
}

// loading

const isLoadingSpace = computed(() => store.state.isLoadingSpace)
const isLoadingOtherItems = computed(() => store.state.isLoadingOtherItems)
const isJoiningSpace = computed(() => store.state.isJoiningSpace)
const isReconnectingToBroadcast = computed(() => store.state.isReconnectingToBroadcast)

// saving

const sendingQueue = computed(() => store.state.sendingQueue)
const isSavingOperations = computed(() => Boolean(sendingQueue.value.length))
const pluralChanges = computed(() => {
  const condition = sendingQueue.value.length !== 1
  return utils.pluralize('change', condition)
})

// connected

const isConnected = computed(() => {
  const value = !isLoadingSpace.value && !isJoiningSpace.value && !isReconnectingToBroadcast.value && !isSavingOperations.value
  return value
})
</script>

<template lang="pug">
dialog.space-status(v-if="visible" :open="visible" ref="dialog")
  section
    .row.title-row
      div(v-if="isConnected")
        .badge.success Connected
      div(v-else)
        Loader(:visible="true")
        span(v-if="isLoadingSpace || isLoadingOtherItems") Downloading
        span(v-else-if="isJoiningSpace") Connecting to Broadcast
        span(v-else-if="isReconnectingToBroadcast") Reconnecting
        span(v-else-if="isSavingOperations") Syncing
      .button-wrap
        button.small-button(@click.left="refreshBrowser" title="Refresh browser")
          img.icon(src="@/assets/refresh.svg")

  section(v-if="isConnected")
    p Updates synced
  section(v-else)
    p(v-if="(isLoadingSpace || isLoadingOtherItems) && state.spaceIsCached")
      span.badge.info You can edit right now
      span and your changes will sync once connected
    p(v-else-if="isJoiningSpace || isReconnectingToBroadcast")
      span.badge.info You can edit right now
      span {{' '}}
      span but cannot collaborate yet, your changes will sync once connected
    p(v-else-if="isSavingOperations")
      span Your changes are saving to the server
      section.subsection.operations-list
        span.badge.info
          Loader(:visible="true" :isSmall="true" :isStatic="true")
          span {{sendingQueue.length}} {{pluralChanges}} to sync
</template>

<style lang="stylus">
dialog.space-status
  width 200px
  @media(max-width 414px)
    left -60px
  .badge
    display inline-block

  .loader
    width 14px
    height 14px
    vertical-align -3px
    margin-right 6px
  .loader + span
    margin-left 2px

  .operations-list
    margin-top 10px
</style>
