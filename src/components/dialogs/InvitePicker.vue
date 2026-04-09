<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import InviteLabel from '@/components/InviteLabel.vue'
import utils from '@/utils.js'
import invite from '@/data/invite.js'

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
  group: Object,
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

const inviteStates = computed(() => {
  let value = invite.states()
  if (!props.group) {
    value = value.filter(item => item.type !== 'group')
  }
  return value
})
const isActive = (inviteState) => {
  return inviteState.type === props.inviteType
}
const select = (inviteState) => {
  emit('select', inviteState.type)
  emit('closeDialogs')
}
</script>

<template lang="pug">
dialog.narrow.invite-picker(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section.results-section
    ul.results-list
      template(v-for="(inviteState in inviteStates")
        li(:class="{ active: isActive(inviteState) }" @click.left="select(inviteState)")
          InviteLabel(:inviteType="inviteState.type" :group="props.group" :randomUser="randomUser")
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
