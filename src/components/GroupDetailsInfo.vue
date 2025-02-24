<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

// import utils from '@/utils.js'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import EmojiPicker from '@/components/dialogs/EmojiPicker.vue'

const store = useStore()

const nameInputElement = ref(null)

let unsubscribe

onMounted(() => {
  focusNameInput()
  unsubscribe = store.subscribe(mutation => {
    if (mutation.type === 'triggerCloseChildDialogs') {
      closeDialogs()
    }
  })
})
onBeforeUnmount(() => {
  unsubscribe()
})

const emit = defineEmits(['updateGroup', 'childDialogIsVisible'])

const props = defineProps({
  group: Object
})
const state = reactive({
  colorPickerIsVisible: false,
  emojiPickerIsVisible: false
})

const closeDialogs = (shouldEmit) => {
  state.colorPickerIsVisible = false
  state.emojiPickerIsVisible = false
  if (shouldEmit) {
    emit('childDialogIsVisible', false)
  }
}
const updateGroup = (updates) => {
  emit('updateGroup', updates)
}

// color

const groupColor = computed(() => props.group.color)
const updateGroupColor = (newValue) => {
  updateGroup({ color: newValue })
}
const toggleColorPicker = () => {
  const isVisible = state.colorPickerIsVisible
  closeDialogs(true)
  state.colorPickerIsVisible = !isVisible
  emit('childDialogIsVisible', !isVisible)
}

// emoji

const groupEmoji = computed(() => props.group.emoji)
const updateGroupEmoji = (newValue) => {
  if (newValue === groupEmoji.value) {
    updateGroup({ emoji: '' })
  } else {
    updateGroup({ emoji: newValue })
  }
}
const toggleEmojiPicker = () => {
  const isVisible = state.emojiPickerIsVisible
  closeDialogs(true)
  state.emojiPickerIsVisible = !isVisible
  emit('childDialogIsVisible', !isVisible)
}

// name

const focusNameInput = async () => {
  await nextTick()
  const element = nameInputElement.value
  if (!element) { return }
  element.focus()
  element.select()
}
const groupName = computed({
  get () {
    return props.group.name
  },
  set (newValue) {
    updateGroup({ name: newValue })
  }
})
</script>

<template lang="pug">
.row.group-details-info(@click.stop="closeDialogs")
  .button-wrap
    .segmented-buttons
      //- color
      button.change-color(@click.left.stop="toggleColorPicker" :class="{active: state.colorPickerIsVisible}" title="Change Group Color")
        .current-color(:style="{ background: groupColor }")
      //- emoji
      button.change-emoji(@click.left.stop="toggleEmojiPicker" :class="{active: state.emojiPickerIsVisible}" title="Change Emoji")
        span.emoji(v-if="groupEmoji") {{ groupEmoji }}
        img.icon.emoji(v-else src="@/assets/emoji.svg")
    ColorPicker(:currentColor="groupColor" :visible="state.colorPickerIsVisible" @selectedColor="updateGroupColor")
    EmojiPicker(:currentEmoji="groupEmoji" :visible="state.emojiPickerIsVisible" @selectedEmoji="updateGroupEmoji")

  //- name
  input.name(
    placeholder="Group Name"
    v-model="groupName"
    name="groupName"
    maxlength=100
    ref="nameInputElement"
    @keydown.enter.exact.prevent="createGroup"
    @keyup.stop.backspace
    @keyup.stop.enter
    @mouseup.stop
    @touchend.stop
  )
</template>

<style lang="stylus">
.group-details-info
  .segmented-buttons
    display flex
    align-items flex-start
  button.change-color
    .current-color
      border-radius 10px
  input.name
    margin-left 6px
    margin-bottom 0
  .icon.emoji
    vertical-align -1.5px
</style>
