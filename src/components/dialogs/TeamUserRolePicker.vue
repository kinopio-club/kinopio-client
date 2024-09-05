<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, useTemplateRef, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import teamUserRoles from '@/data/teamUserRoles.js'

const store = useStore()

const dialogElement = useTemplateRef('dialogElement')

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})

const props = defineProps({
  visible: Boolean,
  user: Object
})
const state = reactive({
  dialogHeight: null,
  isPositionBottom: false,
  error: {
    isRemovingSoleAdmin: false
  }
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    state.error.isRemovingSoleAdmin = false
    state.isPositionBottom = false
    updateDialogHeight()
    updateIsPositionBottom()
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}
const updateIsPositionBottom = async () => {
  const threshold = 50
  await nextTick()
  const element = dialogElement.value
  const rect = element.getBoundingClientRect()
  const dialogIsBelowViewport = rect.y + rect.height + threshold > store.state.viewportHeight
  state.isPositionBottom = dialogIsBelowViewport
}

const currentSpaceTeam = computed(() => store.getters['teams/spaceTeam']())

const roles = computed(() => {
  return teamUserRoles.states()
})
const roleName = (role) => {
  return utils.capitalizeFirstLetter(role.name)
}
const roleIsActive = (role) => {
  return props.user.role === role.name
}
const roleIsAdmin = (role) => {
  return role.name === 'admin'
}
const roleIsMember = (role) => {
  return role.name === 'member'
}
const checkIsRemovingSoleAdminError = (role) => {
  if (props.user.role === 'member') { return }
  if (role.name === 'admin') { return }
  const teamAdmins = currentSpaceTeam.value.users.filter(user => user.role === 'admin')
  if (teamAdmins.length > 1) { return }
  state.error.isRemovingSoleAdmin = true
  return true
}
const updateRole = (role) => {
  if (checkIsRemovingSoleAdminError(role)) {
    return
  }
  const update = {
    userId: props.user.id,
    teamId: currentSpaceTeam.value.id,
    role: role.name
  }
  store.dispatch('teams/updateUserRole', update)
}

</script>

<template lang="pug">
dialog.narrow.team-user-role-picker(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}" :class="{'position-bottom': state.isPositionBottom}")
  section(v-if="state.error.isRemovingSoleAdmin")
    .badge.danger Team must have at least one admin
  section.results-section
    ul.results-list
      template(v-for="(role in roles")
        li(:class="{ active: roleIsActive(role) }" @click.left="updateRole(role)")
          .badge(:class="role.color")
            span {{roleName(role)}}
          .description {{ role.description }}
</template>

<style lang="stylus">
dialog.team-user-role-picker
  overflow auto
  padding-top 4px
  min-height 154px
  &.position-bottom
    top initial
    bottom 10px
</style>
