<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

// import UserList from '@/components/UserList.vue'
import ResultsFilter from '@/components/ResultsFilter.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'
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

// const emit = defineEmits(['updateCount'])

const props = defineProps({
  visible: Boolean,
  team: Object
})
const state = reactive({
  dialogHeight: null,
  filter: '',
  filteredUsers: [],
  selectedUser: {}
})

watch(() => props.visible, (value, prevValue) => {
  state.selectedUser = {}
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

const currentUserIsTeamAdmin = computed(() => store.getters['currentUser/isTeamAdmin'](props.team.id))
// :selectedUser="selectedUser"
// const selectedUser = computed(() => {

// const removeTeamUser = async (user) => {
// }

// const toggleUserDetails = (event, user) => {
//   console.log(event, user)
//   // closeDialogs()
//   // showUserDetails(event, user)
// }

const updateFilteredUsers = (users) => {
  state.filteredUsers = users
}
const updateFilter = (filter) => {
  state.filter = filter
}
const usersFiltered = computed(() => {
  let items
  if (state.filter) {
    items = state.filteredUsers
  } else {
    items = props.team.users
  }
  return items
})

// user

const selectUser = (event, user) => {
  state.selectedUser = user
  console.log(state.selectedUser)
  // emit('selectUser', event, user)
}
const userIsSelected = (user) => {
  console.log('🌳', state.selectedUser.id, user.id, currentUserIsTeamAdmin.value, props.team.id)
  return state.selectedUser.id === user.id
}
const removeUser = (user) => {
  if (!props.isClickable) { }
  // emit('removeUser', user)
}

</script>

<template lang="pug">
dialog.narrow.dialog-name(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    p {{props.team.name}}

  span
    ResultsFilter(:items="props.team.users" @updateFilter="updateFilter" @updateFilteredItems="updateFilteredUsers")
    ul.results-list.user-list
      template(v-for="user in props.team.users" :key="user.id")
        li(@click.left.stop="selectUser($event, user)" tabindex="0" v-on:keyup.stop.enter="selectUser($event, user)" :class="{ active: userIsSelected(user) }")
          UserLabelInline(:user="user")
          button.remove-user.small-button(v-if="currentUserIsTeamAdmin" @click.left.stop="removeUser(user)" title="Remove from space")
            img.icon.cancel(src="@/assets/add.svg")

  //- UserList(
  //-   :users="props.team.users"
  //-   @selectUser="toggleUserDetails"
  //-   :showRemoveUser="isTeamAdmin"
  //-   @removeUser="removeTeamUser"
  //-   :isClickable="true"
  //- )
</template>

<style lang="stylus">
// .dialog-name
</style>
