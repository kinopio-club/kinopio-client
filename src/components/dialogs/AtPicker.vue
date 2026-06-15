<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import UserList from '@/components/UserList.vue'
import utils from '@/utils.js'

import fuzzy from '@/libs/fuzzy.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['closeDialog', 'selectUser']) // TODO selectTimer

const props = defineProps({
  visible: Boolean,
  position: Object,
  search: String,
  cursorPosition: Number,
  cards: Array,
  searchIsDisabled: Boolean
})

const state = reactive({
  dialogHeight: null
})

watch(() => props.visible, async (value) => {
  if (value) {
    await nextTick()
    updateDialogHeight()
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const styles = computed(() => {
  return {
    top: props.position?.top + 'px',
    maxHeight: state.dialogHeight + 'px'
  }
})

const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)

const filteredUsers = computed(() => {
  let users = spaceStore.getSpaceAndGroupMembers
  if (!props.search) { return users }
  const options = {
    pre: '',
    post: '',
    extract: (item) => {
      const name = item.name || ''
      return name
    }
  }
  const filtered = fuzzy.filter(props.search, users, options)
  users = filtered.map(item => item.original)
  return users.slice(0, 5)
})

const selectUser = (event, user) => {
  emit('selectUser', event, user)
}

const selectedUsers = computed(() => {
  let users = []
  props.cards.forEach(card => {
    users = users.concat(userStore.getUsersByCardAtUserMentions(card))
  })
  return users
})

watch(() => props.search, async (value) => {
  globalStore.triggerPickerNavigationFirst()
})

</script>

<template lang="pug">
dialog.narrow.at-picker(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="styles")
  section.info-section(v-if="!props.search && currentUserIsSignedIn && !props.searchIsDisabled")
    p
      img.icon.search(src="@/assets/search.svg")
      span Type to search users

  UserList(
    :users="filteredUsers"
    :selectedUsers="selectedUsers"
    @selectUser="selectUser"
    :isClickable="true"
    :shouldHideOptionsButton="true"
    :shouldHideResultsFilter="true"
  )
</template>

<style lang="stylus">
dialog.at-picker
  overflow auto
</style>
