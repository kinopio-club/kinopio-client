<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import GroupLabel from '@/components/GroupLabel.vue'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import Loader from '@/components/Loader.vue'

import randomColor from 'randomcolor'

const store = useStore()

const dialogElement = ref(null)
const nameInputElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['closeDialogs'])

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  dialogHeight: null,
  colorPickerIsVisible: false,
  team: null,
  loading: {
    createGroup: false
  },
  error: {
    missingName: false,
    unknownServerError: false
  }
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
    initGroup()
    focusNameInput()
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
const clearErrors = () => {
  state.error.missingName = false
  state.error.unknownServerError = false
}

// team color

const teamColor = computed(() => state.team.color)
const updateGroupColor = (newValue) => {
  state.team.color = newValue
}
const toggleColorPicker = () => {
  const isVisible = state.colorPickerIsVisible
  closeDialogs()
  state.colorPickerIsVisible = !isVisible
}

// team name

const focusNameInput = async () => {
  await nextTick()
  const element = nameInputElement.value
  element.focus()
  element.select()
}
const teamName = computed({
  get () {
    return state.team.name
  },
  set (newValue) {
    state.team.name = newValue
  }
})

// team

const initGroup = () => {
  let team = {
    name: 'Group Name',
    color: randomColor()
  }
  state.team = team
}
const createGroup = async () => {
  if (state.loading.createGroup) { return }
  clearErrors()
  if (!state.team.name) {
    state.error.missingName = true
    return
  }
  try {
    state.loading.createGroup = true
    await store.dispatch('teams/createGroup', state.team)
    emit('closeDialogs')
  } catch (error) {
    console.error('🚒 createGroup', error)
    state.unknownServerError = true
  }
  state.loading.createGroup = false
}

</script>

<template lang="pug">
dialog.narrow.add-team(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    .row
      .button-wrap
          button.change-color(@click.left.stop="toggleColorPicker" :class="{active: state.colorPickerIsVisible}" title="Change Group Color")
            .current-color.current-team-color(:style="{ background: teamColor }")
          ColorPicker(:currentColor="teamColor" :visible="state.colorPickerIsVisible" @selectedColor="updateGroupColor")
      input.name(placeholder="Group Name" v-model="teamName" name="teamName" maxlength=100 ref="nameInputElement" @keydown.enter.exact.prevent="createGroup")
    .row
      button(:class="{ active: state.loading.createGroup }" @click.stop="createGroup")
        img.icon.add(src="@/assets/add.svg")
        GroupLabel(:team="state.team")
        span Create Group
        Loader(:visible="state.loading.createGroup")
    //- errors
    .row(v-if="state.error.missingName")
      .badge.danger Group name missing
    .row(v-if="state.unknownServerError")
      .badge.danger (シ_ _)シ Something went wrong, Please try again or contact support

</template>

<style lang="stylus">
dialog.add-team
  input.name
    margin-bottom 0
  button.change-color
    margin-right 6px

</style>
