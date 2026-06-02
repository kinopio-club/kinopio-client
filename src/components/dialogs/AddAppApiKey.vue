<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

import utils from '@/utils.js'
import randomColor from 'randomcolor'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import ApiKeyScopePicker from '@/components/dialogs/ApiKeyScopePicker.vue'
import apiKeyScopes from '@/data/apiKeyScopes.js'

import { nanoid } from 'nanoid'

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
  apiKeyScopePickerIsVisible: false,
  name: 'App Name',
  color: 'red',
  scope: 'read',
  errorNameIsRequired: false
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    state.color = randomColor({ luminosity: 'dark' })
    updateDialogHeight()
    focusNameInput()
    closeDialogs()
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
  state.apiKeyScopePickerIsVisible = false
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

// scope

const currentScope = computed(() => {
  return apiKeyScopes.find(scope => scope.name === state.scope)
})
const toggleApiKeyScopePickerIsVisible = () => {
  const value = !state.apiKeyScopePickerIsVisible
  closeDialogs()
  state.apiKeyScopePickerIsVisible = value
}
const updateCurrentScope = (scope) => {
  state.scope = scope
  closeDialogs()
}

// submit

const createAppApiKey = () => {
  state.errorNameIsRequired = false
  if (!state.name) {
    state.errorNameIsRequired = true
    return
  }
  const appApiKey = {
    id: nanoid(),
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
  section.title-section
    p New App API Key
  section
    .row
      .button-wrap
        .segmented-buttons
          button.change-color(@click.left.stop="toggleColorPicker" :class="{active: state.colorPickerIsVisible}" title="Change Color")
            .current-color(:style="{ background: color }")
        ColorPicker(:currentColor="color" :visible="state.colorPickerIsVisible" @selectedColor="updateColor" :luminosityIsDark="true")
      //- name
      input.name(
        placeholder="App Name"
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
    //- scope picker
    .row
      .button-wrap
        button(@click.stop="toggleApiKeyScopePickerIsVisible" :class="{active: state.apiKeyScopePickerIsVisible}")
          span Scope
          span.badge.secondary.scope-badge {{currentScope.friendlyName}}
        ApiKeyScopePicker(:visible="state.apiKeyScopePickerIsVisible" :currentScopeName="state.scope" @updateCurrentScope="updateCurrentScope")
    //- create
    .row
      button(@click.stop="createAppApiKey")
        img.icon.add-icon(src="@/assets/add.svg")
        span Create API Key
    //- error
    .row(v-if="state.errorNameIsRequired")
      .badge.danger App Name is required
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
  .scope-badge
    margin-left 5px
    margin-right 0

</style>
