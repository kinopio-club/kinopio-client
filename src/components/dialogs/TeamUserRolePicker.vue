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
})
const state = reactive({
  dialogHeight: null
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
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
const updateRole = (role) => {
  try {
    const update = {
      userId: props.user.id,
      teamId: currentSpaceTeam.value.id,
      role: role.name
    }
    store.dispatch('teams/updateUserRole', update)
  } catch (error) {
    console.error('🚒 updateRole', error)
  }
}
</script>

<template lang="pug">
dialog.narrow.team-user-role-picker(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  p asdlfkj
  //- section.results-section
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
</template>

<style lang="stylus">
// .team-user-role-picker
</style>
