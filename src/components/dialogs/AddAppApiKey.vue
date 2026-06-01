<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

import utils from '@/utils.js'
import randomColor from 'randomcolor'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import apiKeyScopes from '@/data/apiKeyScopes.js'

const globalStore = useGlobalStore()

let unsubscribes

const dialogElement = ref(null)
const nameInputElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerCloseChildDialogs') {
        closeDialogs()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDialogHeight)
  unsubscribes()
})

const emit = defineEmits(['childDialogIsVisible', 'createAppApiKey'])

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  dialogHeight: null,
  colorPickerIsVisible: false,
  name: 'App Name',
  color: 'red',
  scope: 'read'
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    state.color = randomColor({ luminosity: 'dark' })
    updateDialogHeight()
    focusNameInput()
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}
const closeDialogs = (shouldEmit) => {
  state.colorPickerIsVisible = false
  if (shouldEmit) {
    emit('childDialogIsVisible', false)
  }
}
const clearState = () => {
  state.name = 'App Name'
  state.scope = 'read'
}

// color

const color = computed(() => state.color)
const updateColor = (newValue) => {
  state.color = newValue
}
const toggleColorPicker = () => {
  const isVisible = state.colorPickerIsVisible
  closeDialogs(true)
  state.colorPickerIsVisible = !isVisible
  emit('childDialogIsVisible', !isVisible)
}
const inputColorClasses = computed(() => {
  if (!props.isBackgroundColor) { return }
  return utils.colorClasses({ backgroundColor: state.color })
})

// name

const focusNameInput = async () => {
  await nextTick()
  const element = nameInputElement.value
  if (!element) { return }
  element.focus()
  element.select()
}
const name = computed({
  get () {
    return state.name
  },
  set (newValue) {
    state.name = newValue
  }
})

// submit

const createAppApiKey = () => {
  const appApiKey = {
    name: state.name,
    color: state.color,
    apiKey: self.crypto.randomUUID(),
    scope: state.scope
  }
  emit('createAppApiKey', appApiKey)
  clearState()
}
</script>

<template lang="pug">
dialog.narrow.add-app-api-key(
  v-if="props.visible"
  :open="props.visible"
  @click.left.stop="closeDialogs"
  ref="dialogElement"
  :style="{'max-height': state.dialogHeight + 'px'}"
)
  section
    .row
      .button-wrap
        .segmented-buttons
          button.change-color(@click.left.stop="toggleColorPicker" :class="{active: state.colorPickerIsVisible}" title="Change Color")
            .current-color(:style="{ background: color }")
        ColorPicker(:currentColor="color" :visible="state.colorPickerIsVisible" @selectedColor="updateColor")
      //- name
      input.name(
        placeholder="App API Key Name"
        v-model="name"
        name="apiKeyName"
        maxlength=100
        ref="nameInputElement"
        @keyup.stop.backspace
        @keyup.stop.enter
        @mouseup.stop
        @touchend.stop
        :class="inputColorClasses"
      )
    .row
      button
        span User Scope
    .row
      button(@click.stop="createAppApiKey")
        img.icon.add-icon(src="@/assets/add.svg")
        span Create API Key
</template>

<style lang="stylus">
dialog.add-app-api-key
  left initial
  right 8px
  top 22px
  .segmented-buttons
    display flex
    align-items flex-start
  button.change-color
    .current-color
      border-radius 10px
  input.name
    margin-left 6px
    margin-bottom 0
  .button-label
    margin-right 5px
</style>
