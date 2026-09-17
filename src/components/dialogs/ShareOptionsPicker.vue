<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useSpaceStore } from '@/stores/useSpaceStore'

import InviteLabel from '@/components/InviteLabel.vue'
import utils from '@/utils.js'
import invite from '@/data/invite.js'

const spaceStore = useSpaceStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['closeDialogs', 'select'])

const props = defineProps({
  visible: Boolean,
  inviteType: String,
  groups: {
    type: Array,
    default: () => []
  },
  groupId: String,
  randomUser: Object
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
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const spaceIsPublic = computed(() => spaceStore.getSpaceIsPublic)
// a space can be in multiple groups, so each one gets its own invite option
const inviteStates = computed(() => {
  let states = invite.privateSpaceStates()
  if (spaceIsPublic.value) {
    states = invite.publicSpaceStates()
  }
  return states.flatMap(inviteState => {
    if (inviteState.type !== 'group') { return [inviteState] }
    return props.groups.map(group => ({ ...inviteState, group }))
  })
})
const isActive = (inviteState) => {
  if (inviteState.type !== props.inviteType) { return }
  if (inviteState.type === 'group') {
    return inviteState.group.id === props.groupId
  }
  return true
}
const select = (inviteState) => {
  emit('select', { type: inviteState.type, groupId: inviteState.group?.id })
  emit('closeDialogs')
}
</script>

<template lang="pug">
dialog.narrow.invite-picker(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section.results-section
    ul.results-list
      template(v-for="inviteState in inviteStates" :key="inviteState.type + (inviteState.group?.id || '')")
        li(:class="{ active: isActive(inviteState) }" @click.left="select(inviteState)")
          InviteLabel(:inviteType="inviteState.type" :group="inviteState.group" :randomUser="randomUser")
          .row.description(v-if="inviteState.description")
            span {{ inviteState.description }}
  //- tips
  section
    p
      span.badge.info If your account is upgraded, collaborators can create cards in this space without increasing their free card count.
</template>

<style lang="stylus">
dialog.invite-picker
  overflow auto
  .results-section
    padding-top 4px
    max-height calc(92vh - 120px)
  li
    display block
</style>
