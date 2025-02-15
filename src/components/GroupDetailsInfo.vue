<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

// import utils from '@/utils.js'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'

const store = useStore()

const nameInputElement = ref(null)

let unsubscribe

onMounted(() => {
  focusNameInput()
  unsubscribe = store.subscribe(mutation => {
    if (mutation.type === 'triggerCloseChildDialogs') {
      // closeDialogs()
    }
  })
})
onBeforeUnmount(() => {
  unsubscribe()
})

const emit = defineEmits(['updateGroup'])

const props = defineProps({
  group: Object
})
const state = reactive({
  colorPickerIsVisible: false,
  emojiPickerIsVisible: false
})

const closeDialogs = () => {
  state.colorPickerIsVisible = false
  state.emojiPickerIsVisible = false
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
  closeDialogs()
  state.colorPickerIsVisible = !isVisible
}

// emoji

const groupEmoji = computed(() => props.group.emoji)
const updateEmoji = (newValue) => {
  updateGroup({ emoji: newValue })
}
const toggleEmojiPicker = () => {
  const isVisible = state.emojiPickerIsVisible
  closeDialogs()
  state.emojiPickerIsVisible = !isVisible
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
.row.group-details-info(@click="closeDialogs")
  .button-wrap
    .segmented-buttons
      //- color
      button.change-color(@click.left.stop="toggleColorPicker" :class="{active: state.colorPickerIsVisible}" title="Change Group Color")
        .current-color.current-group-color(:style="{ background: groupColor }")
      //- emoji
      button.change-emoji(@click.left.stop="toggleEmojiPicker" :class="{active: state.emojiPickerIsVisible}" title="Change Emoji")
        span.emoji(v-if="groupEmoji") {{ groupEmoji }}
        img.icon.group(v-else src="@/assets/group.svg")
    ColorPicker(:currentColor="groupColor" :visible="state.colorPickerIsVisible" @selectedColor="updateGroupColor")
    //- EmojiPicker(:currentEmoji="groupEmoji" :visible="state.emojiPickerIsVisible" @selectedEmoji="updateGroupEmoji")

  //- name
  input.name(placeholder="Group Name" v-model="groupName" name="groupName" maxlength=100 ref="nameInputElement" @keydown.enter.exact.prevent="createGroup")
</template>

<style lang="stylus">
.group-details-info
  button.change-emoji
    transform translateY(-1.5px)
  input.name
    margin-left 6px
    margin-bottom 0
</style>
