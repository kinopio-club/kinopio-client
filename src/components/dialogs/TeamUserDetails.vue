<!-- delete -->

<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import User from '@/components/User.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
import teamUserRoles from '@/data/teamUserRoles.js'

const store = useStore()

const dialogElement = ref(null)

const state = reactive({
  // loading: {
  //   removeTeamUser: false
  // },
  // error: {
  //   removeTeamUser: false
  // }
})

const visible = computed(() => store.state.teamUserDetailsIsVisible)
const position = computed(() => store.state.userDetailsPosition)
const team = computed(() => {
  const teamId = store.state.teamUserDetailsTeamId
  return store.getters('teams/byId', teamId)
})
const user = computed(() => {
  const userId = store.state.teamUserDetailsUserId
  const teamId = store.state.teamUserDetailsTeamId
  return store.getters('teams/teamUser', { userId, teamId })
})

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

// team roles

const roles = computed(() => {
  return teamUserRoles.states()
})
const roleName = (role) => {
  return utils.capitalizeFirstLetter(role.name)
}
const roleIsActive = (role) => {
  return user.value.role === role.name
}
const roleIsAdmin = (role) => {
  return role.name === 'admin'
}
const roleIsMember = (role) => {
  return role.name === 'member'
}
const updateRole = (role) => {
  try {
    const update = {
      userId: user.value.id,
      teamId: team.value.id,
      role: role.name
    }
    store.dispatch('teams/updateUserRole', update)
  } catch (error) {
    console.error('🚒 updateRole', error)
  }
  // TODO team userlist userlabel :showYouLabel
  // TODO cannot unadmin yourself if you're the only admin
}

// remove user

const removeTeamUser = () => {
  // TODO
  if (state.loading.removeTeamUser) { return }
  try {
    // do it in async , show global notification and notification success
    state.loading.removeTeamUser = true
    // - api/removeTeamUser ({ teamId, userId })
    // loader
    // on success show notification , update localstate, and close dialog
  } catch (error) {
    console.error('🚒 removeTeamUser', error)
    // on error show err in dialog
  }
  state.loading.removeTeamUser = false
}

</script>

<template lang="pug">
dialog.narrow.team-user-details(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="styles")
  section
    .row
      User(:user="user")
      span.user-name {{user.name}}
    .row
      .badge.secondary
        img.icon(src="@/assets/mail.svg")
        span {{ user.email }}
  //- section.results-section.team-user-role-picker
  //-   ul.results-list
  //-     template(v-for="(role in roles")
  //-       li(:class="{ active: roleIsActive(role) }" @click.left="updateRole(role)")
  //-         .badge(:class="role.color")
  //-           img.icon.key(
  //-             v-if="roleIsAdmin(role)"
  //-             src="@/assets/key.svg"
  //-           )
  //-           img.icon.star(
  //-             v-if="roleIsMember(role)"
  //-             src="@/assets/star.svg"
  //-           )
  //-           span {{roleName(role)}}
  //-         .description {{ role.description }}

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
  .user-name
    margin-left 6px
  .results-section
    padding-top 4px
    border-top 1px solid var(--primary-border)
  li
    flex-direction column
  // .user-info-wrap
  //   align-items flex-start
  //   .user-info
  //     margin-left 6px
  .badge
    flex-shrink 0
  .description
    margin-top 3px
</style>
