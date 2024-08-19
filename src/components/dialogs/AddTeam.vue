<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import TeamLabel from '@/components/TeamLabel.vue'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import Loader from '@/components/Loader.vue'

import randomColor from 'randomcolor'

const store = useStore()

const dialogElement = ref(null)
const nameInputElement = ref(null)

onMounted(() => {
  store.subscribe(mutation => {
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    }
  })
})

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  dialogHeight: null,
  colorPickerIsVisible: false,
  team: null,
  loading: {
    createTeam: false
  },
  error: {
    missingName: false,
    unknownServerError: false
  }
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
    initTeam()
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
const updateTeamColor = (newValue) => {
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

const initTeam = () => {
  let team = {
    name: 'Team Name',
    color: randomColor()
  }
  state.team = team
}
const createTeam = async () => {
  if (state.loading.createTeam) { return }
  clearErrors()
  if (!state.team.name) {
    state.error.missingName = true
    return
  }
  try {
    state.loading.createTeam = true
    // const newTeam = await store.dispatch('teams/create', state.team)
    // on success,
    // update localstate
    // open team details: close this dialog, emit update teamDetailsIsVisibleForTeamId (newteam)
  } catch (error) {
    console.error('🚒 createTeam', error)
    state.unknownServerError = true
  }
  state.loading.createTeam = false
}

</script>

<template lang="pug">
dialog.narrow.add-team(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    .row
      .button-wrap
          button.change-color(@click.left.stop="toggleColorPicker" :class="{active: state.colorPickerIsVisible}" title="Change Team Color")
            .current-color.current-team-color(:style="{ background: teamColor }")
          ColorPicker(:currentColor="teamColor" :visible="state.colorPickerIsVisible" @selectedColor="updateTeamColor")
      input.name(placeholder="Team Name" v-model="teamName" name="teamName" maxlength=100 ref="nameInputElement")
    .row
      button(:class="{ active: state.loading.createTeam }" @click.stop="createTeam")
        img.icon.add(src="@/assets/add.svg")
        TeamLabel(:team="state.team")
        span Create Team
        Loader(:visible="state.loading.createTeam")
    //- errors
    .row(v-if="state.error.missingName")
      .badge.danger Team name missing
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
