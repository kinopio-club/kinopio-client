<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import UserLabelInline from '@/components/UserLabelInline.vue'
import utils from '@/utils.js'
const store = useStore()

const dialogElement = ref(null)

const visible = computed(() => store.state.teamUserDetailsIsVisible)
const user = computed(() => store.state.userDetailsUser)
const position = computed(() => store.state.userDetailsPosition)

const styles = computed(() => {
  let { x, y, shouldIgnoreZoom, transformOriginIsTopRight } = position.value
  let zoom = store.getters.spaceCounterZoomDecimal
  if (shouldIgnoreZoom) {
    zoom = 1
  }
  if (store.state.isTouchDevice) {
    zoom = utils.pinchCounterZoomDecimal()
    if (zoom > 1) {
      x = x * zoom
      y = y * zoom
    }
  }
  const styles = {
    transform: `scale(${zoom})`,
    left: x + 'px',
    top: y + 'px'
  }
  if (transformOriginIsTopRight) {
    styles.transformOrigin = 'top right'
  }
  return styles
})
</script>

<template lang="pug">
dialog.narrow.team-user-details(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="styles")
  section
    //- UserLabelInline(:user="user")
    p blah@blah.com {{ user.email }}
  section
    p TODO team user details: {{user.name}}
    p user email  (and/or show in team) (server: teammembers get it, w collaboratorkey)

  section
    p .teamuserrolepicker / description
  section
    button.danger
      span x remove from team
</template>

<style lang="stylus">
dialog.team-user-details
  top calc(100% - 8px)
  position absolute
</style>
