<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import UserList from '@/components/UserList.vue'
import utils from '@/utils.js'

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
  team: Object
})
const state = reactive({
  dialogHeight: null,
  colorPickerIsVisible: false,
  tipsIsVisible: false
})

watch(() => props.visible, (value, prevValue) => {
  // state.selectedUser = {}
  closeDialogs()
  state.tipsIsVisible = false
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
const closeDialogs = () => {
  state.colorPickerIsVisible = false
}

const currentUserIsTeamAdmin = computed(() => store.getters['currentUser/isTeamAdmin'](props.team.id))
const updateTeam = (update) => {
  update.id = props.team.id
  store.dispatch('updateTeam', update)
}

// color

const toggleColorPicker = () => {
  const isVisible = state.colorPickerIsVisible
  closeDialogs()
  state.colorPickerIsVisible = !isVisible
}
const teamColor = computed(() => 'teal') // TODO props.team.color
const updateUserColor = (newValue) => {
  updateTeam({ color: newValue })
}

// name

const teamName = computed({
  get () {
    return props.team.name
  },
  set (newValue) {
    updateTeam({ name: newValue })
  }
})

// tips

const toggleTipsIsVisible = () => {
  state.tipsIsVisible = !state.tipsIsVisible
}

// user

// :selectedUser="selectedUser"
// const selectedUser = computed(() => {

const removeTeamUser = async (user) => {
  console.log('⛪️', user)
}

const toggleUserDetails = (event, user) => {
  console.log(event, user)
  // closeDialogs()
  // showUserDetails(event, user)
}

// const updateFilteredUsers = (users) => {
//   state.filteredUsers = users
// }
// const updateFilter = (filter) => {
//   state.filter = filter
// }
// const usersFiltered = computed(() => {
//   let items
//   if (state.filter) {
//     items = state.filteredUsers
//   } else {
//     items = props.team.users
//   }
//   return items
// })

// user

const selectUser = (event, user) => {
  console.log(user)
  // state.selectedUser = user
  // console.log(state.selectedUser)
  // emit('selectUser', event, user)
}
// const userIsSelected = (user) => {
//   console.log('🌳', state.selectedUser.id, user.id, currentUserIsTeamAdmin.value, props.team.id)
//   return state.selectedUser.id === user.id
// }
// const removeUser = (user) => {
//   if (!props.isClickable) { }
//   // emit('removeUser', user)
// }

</script>

<template lang="pug">
dialog.team(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section.title-section
    //- edit team info
    template(v-if="currentUserIsTeamAdmin")
      .row
        //- .button-wrap
        //-   button.change-color(@click.left.stop="toggleColorPicker" :class="{active: state.colorPickerIsVisible}")
        //-     .current-color.team-color(:style="{ background: teamColor }")
        //-   ColorPicker(:currentColor="teamColor" :visible="state.colorPickerIsVisible" @selectedColor="updateTeamColor")
        input.name(placeholder="Team Name" v-model="teamName" name="teamName" maxlength=100)
        .button-wrap.tips-button-wrap
          button.small-button(@click="toggleTipsIsVisible" :class="{active: state.tipsIsVisible}")
            span ?
    //- read only team info
    template(v-else)
      .row.title-row
        .row.title-row
          //- .current-color.team-color.current-color-read-only(:style="{ background: teamColor }")
          span.team-name {{props.team.name}}
        .button-wrap.tips-button-wrap
          button.small-button(@click="toggleTipsIsVisible" :class="{active: state.tipsIsVisible}")
            span ?
    section.subsection.tips-section(v-if="state.tipsIsVisible")
      p TODO tips goes here. explain admins, invite new members to your teams. team members can see and edit team spaces. link to help site

  UserList(
    :users="props.team.users"
    @selectUser="toggleUserDetails"
    :showRemoveUser="true"
    @removeUser="removeTeamUser"
    :isClickable="true"
    :showTeamAdmin="true"
  )
</template>

<style lang="stylus">
dialog.team
  input.name
    margin-bottom 0
  .title-section
    border-bottom 1px solid var(--primary-border)
  button.change-color,
  .current-color-read-only
    margin-right 6px
  .current-color
    height 14px
    width 14px
    border-radius 100px
  .search-wrap
    padding-top 6px
  .tips-button-wrap
    padding-left 6px
  .title-row
    margin-bottom 0
  .tips-section
    margin-top 10px
</style>
