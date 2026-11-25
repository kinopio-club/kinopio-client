<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import utils from '@/utils.js'

import { colord } from 'colord'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

let unsubscribes

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)

  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'closeAllDialogs') {
        closeDialogs()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
  window.removeEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['updateCount'])

const props = defineProps({
  visible: Boolean,
  defaultColor: String
})
const state = reactive({
  dialogHeight: null,
  spaceNewCardColorPickerIsVisible: false,
  userNewCardColorPickerIsVisible: false
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

const closeDialogs = () => {
  state.spaceNewCardColorPickerIsVisible = false
  state.userNewCardColorPickerIsVisible = false
}

// const spacePreviewThumbnailImage = computed(() => spaceStore.previewThumbnailImagePrivate || spaceStore.previewThumbnailImage)
const itemColors = computed(() => spaceStore.getSpaceItemColors.card)

// scope

const scopeIsSpace = computed(() => state.scope === 'space')
const scopeIsUser = computed(() => state.scope === 'user')
const toggleScope = (value) => {
  state.scope = value
}

// new card color

const userNewCardColor = computed(() => userStore.newCardColor || props.defaultColor)
const spaceNewCardColor = computed(() => spaceStore.userNewCardColor || props.defaultColor)

// color picker is visible

const toggleSpaceNewCardColorPickerIsVisible = () => {
  const value = state.spaceNewCardColorPickerIsVisible
  closeDialogs()
  state.spaceNewCardColorPickerIsVisible = !value
}
const toggleUserNewCardColorPickerIsVisible = () => {
  const value = state.userNewCardColorPickerIsVisible
  closeDialogs()
  state.userNewCardColorPickerIsVisible = !value
}

// update

const updateSpaceNewCardColor = (color) => {
  color = colord(color).toHex()
  spaceStore.updateSpaceUserNewCardColor(color)
}
const updateUserNewCardColor = (color) => {
  color = colord(color).toHex()
  userStore.updateUser({ newCardColor: color })
}

// clear

const clearSpaceNewCardColor = () => {
  spaceStore.updateSpaceUserNewCardColor(null)
}
const clearUserNewCardColor = () => {
  userStore.updateUser({ newCardColor: null })
}
</script>

<template lang="pug">
dialog.narrow.new-card-color-settings(v-if="props.visible" :open="props.visible" @click.left.stop="closeDialogs" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section.title-section
    p New Card Color
  section
    //- space
    .row
      .button-wrap
        .segmented-buttons
          button(@click.stop="toggleSpaceNewCardColorPickerIsVisible" :class="{ active: state.spaceNewCardColorPickerIsVisible }")
            .badge.new-user-color-badge(:style="{ backgroundColor: spaceNewCardColor }")
            span Current Space
          button(@click="clearSpaceNewCardColor")
            img.icon.cancel(src="@/assets/add.svg")
        ColorPicker(
          :currentColor="spaceNewCardColor"
          :visible="state.spaceNewCardColorPickerIsVisible"
          :removeIsVisible="true"
          :recentColors="itemColors"
          @selectedColor="updateSpaceNewCardColor"
          @removeColor="clearSpaceNewCardColor"
        )
    //- user
    .row
      .button-wrap
        .segmented-buttons
          button(@click.stop="toggleUserNewCardColorPickerIsVisible" :class="{ active: state.userNewCardColorPickerIsVisible }")
            .badge.new-user-color-badge(:style="{ backgroundColor: userNewCardColor }")
            span All Spaces
          button(@click="clearUserNewCardColor")
            img.icon.cancel(src="@/assets/add.svg")
        ColorPicker(
          :currentColor="userNewCardColor"
          :visible="state.userNewCardColorPickerIsVisible"
          :removeIsVisible="true"
          :recentColors="itemColors"
          @selectedColor="updateUserNewCardColor"
          @removeColor="clearUserNewCardColor"
        )
</template>

<style lang="stylus">
dialog.new-card-color-settings
  .new-user-color-badge
    margin 0
    display inline-block
    height 11px
    min-height inherit
    border-radius var(--small-entity-radius)
    width 15px
    min-width initial
    margin-right 5px
  .preview-thumbnail-image
    height 17px
    vertical-align -3px
  dialog.color-picker
    top initial
    bottom 16px
</style>
