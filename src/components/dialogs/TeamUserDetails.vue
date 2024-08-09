<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import User from '@/components/User.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
const store = useStore()

const dialogElement = ref(null)

const state = reactive({
  loading: {
    removeTeamUser: false
  },
  error: {
    removeTeamUser: false
  }
})

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

const removeTeamUser = () => {
  if (state.loading.removeTeamUser) { return }
  try {
    state.loading.removeTeamUser = true
    // - api/removeTeamUserFromTeam (teamId, userId)
    // loader
    // on success show notification , update localstate, and close dialog
  } catch (error) {
    console.error('🚒 removeTeamUser', error)
    // on error show err in dialog
  }
  state.loading.removeTeamUser = false
}

// TODO

</script>

<template lang="pug">
dialog.narrow.team-user-details(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="styles")
  section
    .row.user-info
      User(:user="user")
      span {{user.name}}
    .row
      img.icon(src="@/assets/mail.svg")
      span {{ user.email }}
  section.team-user-role-picker
    //- like space privacy picker
    p .teamuserrolepicker / description
  section
    button.danger(@click="removeTeamUser" :class="{ active: state.loading.removeTeamUser }")
      img.icon.cancel(src="@/assets/add.svg")
      span Remove from Team
      Loader(:visible="state.loading.removeTeamUser" :isSmall="true")
    p.badge.danger(v-if="state.error.removeTeamUser")
      span (シ_ _)シ Could not remove team user, Please try again or contact support
</template>

<style lang="stylus">
dialog.team-user-details
  top calc(100% - 8px)
  position absolute
  .user-info
    > span
      margin-left 6px
</style>
