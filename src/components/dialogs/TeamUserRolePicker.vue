<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import teamUserRoles from '@/data/teamUserRoles.js'

const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  store.subscribe(mutation => {
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    }
  })
})

const props = defineProps({
  visible: Boolean,
  user: Object
  // isPositionBottom: Boolean TODO
})
const state = reactive({
  dialogHeight: null,
  error: {
    isRemovingSoleAdmin: false
  }
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
    state.error.isRemovingSoleAdmin = false
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const currentSpaceTeam = computed(() => store.getters['teams/bySpace']())

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
  if (role === 'admin') { return }
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
dialog.narrow.team-user-role-picker(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section.results-section
    ul.results-list
      template(v-for="(role in roles")
        li(:class="{ active: roleIsActive(role) }" @click.left="updateRole(role)")
          .badge(:class="role.color")
            span {{roleName(role)}}
          .description {{ role.description }}
  section(v-if="state.error.isRemovingSoleAdmin")
    .badge.danger Team must have at least one admin
</template>

<style lang="stylus">
dialog.team-user-role-picker
  padding-top 4px
</style>
