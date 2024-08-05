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
  billingTipsIsVisible: false
})

watch(() => props.visible, (value, prevValue) => {
  // state.selectedUser = {}
  closeDialogs()
  state.billingTipsIsVisible = false
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

const toggleBillingTipsIsVisible = () => {
  state.billingTipsIsVisible = !state.billingTipsIsVisible
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
  section
    .row
      template(v-if="currentUserIsTeamAdmin")
        input.name(placeholder="Team Name" v-model="teamName" name="teamName" maxlength=100)
        .button-wrap.billing-button-wrap
          button.small-button(v-if="currentUserIsTeamAdmin" @click="toggleBillingTipsIsVisible" :class="{ active: state.billingTipsIsVisible} ")
            span Billing

      template(v-else)
        span.team-name {{props.team.name}}
    //- TODO is billing user
    //- .row.billing-tips(v-if="currentUserIsTeamAdmin" :class="{ active: state.billingTipsIsVisible} ")
    section.subsection(v-if="state.billingTipsIsVisible")
      p Each team user costs 6$/mo or 60$/yr
      p Team users can create unlimited cards and have all the other benefits of an upgraded account.
      p If you have a multiple teams with the same user, you will only be billed once for that user.
      button team billing center
      //- p btn settings -> team billing
      //- p next bill cost
      //- p update team billing info
      //- p total current cost is $12/mo
  section
    .row
      button
        img.icon.copy(src="@/assets/copy.svg")
        span Copy Invite to TeamUrl
    .row
      button
        img.icon.mail(src="@/assets/mail.svg")
        span Email Invites

  //- todo replace w subsection per user w options and filter
  UserList(
    :users="props.team.users"
    @selectUser="toggleUserDetails"
    @removeUser="removeTeamUser"
    :isClickable="true"
    :showTeamUserOptions="currentUserIsTeamAdmin"
  )
</template>

<style lang="stylus">
dialog.team
  overflow auto
  input.name
    margin-bottom 0
  // .title-section
  // button.change-color,
  // .current-color-read-only
  //   margin-right 6px
  // .current-color
  //   height 14px
  //   width 14px
  //   border-radius 100px
  .billing-button-wrap
    padding-left 5px
  .search-wrap
    padding-top 6px
  // .tips-button-wrap
  //   padding-left 6px
  // .title-row
  //   margin-bottom 0
  // .billing-tips
  //   &.active
  //     margin-bottom 0
  //     button
  //       border-bottom-left-radius 0
  //       border-bottom-right-radius 0
  //   &.active + section.subsection
  //     border-top-left-radius 0
  .user-list
    border-top 1px solid var(--primary-border)
</style>
