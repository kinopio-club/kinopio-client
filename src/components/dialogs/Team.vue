<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import UserList from '@/components/UserList.vue'

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

const isTeamAdmin = computed(() => store.getters['currentUser/isTeamAdmin'](props.team.id))
// :selectedUser="selectedUser"
// const selectedUser = computed(() => {

const removeTeamUser = async (user) => {
}

const toggleUserDetails = (event, user) => {
  console.log(event, user)
  // closeDialogs()
  // showUserDetails(event, user)
}

</script>

<template lang="pug">
dialog.narrow.dialog-name(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    p {{props.team.name}}
    section.results-section
  UserList(
    :users="props.team.users"
    @selectUser="toggleUserDetails"
    :showRemoveUser="isTeamAdmin"
    @removeUser="removeTeamUser"
    :isClickable="true"
  )
</template>

<style lang="stylus">
// .dialog-name
</style>
