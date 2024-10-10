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
  group: null,
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

// group color

const groupColor = computed(() => state.group.color)
const updateGroupColor = (newValue) => {
  state.group.color = newValue
}
const toggleColorPicker = () => {
  const isVisible = state.colorPickerIsVisible
  closeDialogs()
  state.colorPickerIsVisible = !isVisible
}

// group name

const focusNameInput = async () => {
  await nextTick()
  const element = nameInputElement.value
  element.focus()
  element.select()
}
const groupName = computed({
  get () {
    return state.group.name
  },
  set (newValue) {
    state.group.name = newValue
  }
})

// group

const initGroup = () => {
  let group = {
    name: 'Group Name',
    color: randomColor()
  }
  state.group = group
}
const createGroup = async () => {
  if (state.loading.createGroup) { return }
  clearErrors()
  if (!state.group.name) {
    state.error.missingName = true
    return
  }
  try {
    state.loading.createGroup = true
    await store.dispatch('groups/createGroup', state.group)
    emit('closeDialogs')
  } catch (error) {
    console.error('🚒 createGroup', error)
    state.unknownServerError = true
  }
  state.loading.createGroup = false
}

</script>

<template lang="pug">
dialog.narrow.add-group(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    .row
      .button-wrap
          button.change-color(@click.left.stop="toggleColorPicker" :class="{active: state.colorPickerIsVisible}" title="Change Group Color")
            .current-color.current-group-color(:style="{ background: groupColor }")
          ColorPicker(:currentColor="groupColor" :visible="state.colorPickerIsVisible" @selectedColor="updateGroupColor")
      input.name(placeholder="Group Name" v-model="groupName" name="groupName" maxlength=100 ref="nameInputElement" @keydown.enter.exact.prevent="createGroup")
    .row
      button(:class="{ active: state.loading.createGroup }" @click.stop="createGroup")
        img.icon.add(src="@/assets/add.svg")
        GroupLabel(:group="state.group")
        span Create Group
        Loader(:visible="state.loading.createGroup")
    //- errors
    .row(v-if="state.error.missingName")
      .badge.danger Group name missing
    .row(v-if="state.unknownServerError")
      .badge.danger (シ_ _)シ Something went wrong, Please try again or contact support

</template>

<style lang="stylus">
dialog.add-group
  input.name
    margin-bottom 0
  button.change-color
    margin-right 6px

</style>
