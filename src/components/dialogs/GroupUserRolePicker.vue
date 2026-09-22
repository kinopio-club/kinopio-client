<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useGroupStore } from '@/stores/useGroupStore'

import utils from '@/utils.js'
import groupUserRoles from '@/data/groupUserRoles.js'
import User from '@/components/User.vue'

const globalStore = useGlobalStore()
const groupStore = useGroupStore()

const dialogElement = ref(null)

const props = defineProps({
  visible: Boolean,
  user: Object,
  group: Object
})
const state = reactive({
  isPositionBottom: false,
  error: {
    isRemovingSoleAdmin: false
  }
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    state.error.isRemovingSoleAdmin = false
    state.isPositionBottom = false
    updateIsPositionBottom()
  }
})

const updateIsPositionBottom = async () => {
  const threshold = 50
  await nextTick()
  const element = dialogElement.value
  const rect = element.getBoundingClientRect()
  const dialogIsBelowViewport = rect.y + rect.height + threshold > globalStore.viewportHeight
  state.isPositionBottom = dialogIsBelowViewport
}

const roles = computed(() => {
  return groupUserRoles.states()
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
  const groupUsers = props.group?.users || []
  const groupAdmins = groupUsers.filter(user => user.role === 'admin')
  if (groupAdmins.length > 1) { return }
  state.error.isRemovingSoleAdmin = true
  return true
}
const updateRole = (role) => {
  if (checkIsRemovingSoleAdminError(role)) {
    return
  }
  if (!props.group) { return }
  const update = {
    userId: props.user.id,
    groupId: props.group.id,
    role: role.name
  }
  groupStore.updateUserRole(update)
}

</script>

<template lang="pug">
dialog.narrow.group-user-role-picker(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :class="{'position-bottom': state.isPositionBottom}")
  section.title-section
    .row
      User(:user="props.user" :isClickable="false" :hideYouLabel="true" :isSmall="true" :shouldBounceIn="true")
      span {{ props.user.email }}
  section(v-if="state.error.isRemovingSoleAdmin")
    .badge.danger Group must have at least one admin
  section.results-section.results-section-border-top
    ul.results-list
      template(v-for="(role in roles")
        li(:class="{ active: roleIsActive(role) }" @click.left="updateRole(role)")
          .badge.secondary
            span {{roleName(role)}}
          .description {{ role.description }}
</template>

<style lang="stylus">
dialog.group-user-role-picker
  overflow auto
  &.position-bottom
    top initial
    bottom 10px
  .user
    margin-right 4px
    .anon-avatar
      top 6px !important
</style>
