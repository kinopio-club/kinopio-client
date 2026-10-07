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
  userNewCardColorPickerIsVisible: false,
  spaceUserNewCardColorPickerIsVisible: false

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
  state.userNewCardColorPickerIsVisible = false
  state.spaceUserNewCardColorPickerIsVisible = false
}
const spacePreviewThumbnailImage = computed(() => spaceStore.previewThumbnailImagePrivate || spaceStore.previewThumbnailImage)
const itemColors = computed(() => spaceStore.getSpaceItemColors.card)

// current space (space user)

const spaceUserNewCardColor = computed(() => spaceStore.userNewCardColor || props.defaultColor)
const toggleSpaceUserNewCardColorPickerIsVisible = () => {
  const value = state.spaceUserNewCardColorPickerIsVisible
  closeDialogs()
  state.spaceUserNewCardColorPickerIsVisible = !value
}
const updateSpaceUserCardColor = (color) => {
  color = colord(color).toHex()
  spaceStore.updateSpaceUserNewCardColor(color)
}
const clearSpaceUserCardColor = () => {
  spaceStore.updateSpaceUserNewCardColor(null)
}

// all spaces (user)

const userNewCardColor = computed(() => userStore.newCardColor || props.defaultColor)
const toggleUserNewCardColorPickerIsVisible = () => {
  const value = state.userNewCardColorPickerIsVisible
  closeDialogs()
  state.userNewCardColorPickerIsVisible = !value
}
const updateUserCardColor = (color) => {
  color = colord(color).toHex()
  userStore.updateUser({ newCardColor: color })
}
const clearUserCardColor = () => {
  userStore.updateUser({ newCardColor: null })
}
</script>

<template lang="pug">
dialog.narrow.new-card-color-picker(v-if="props.visible" :open="props.visible" @click.left.stop="closeDialogs" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section.title-section
    p New Card Color
  section
    //- current space (space user)
    .row
      .button-wrap
        .segmented-buttons
          button(@click.stop="toggleSpaceUserNewCardColorPickerIsVisible" :class="{ active: state.spaceUserNewCardColorPickerIsVisible }")
            .badge.new-user-color-badge(:style="{ backgroundColor: spaceUserNewCardColor }")
            img.preview-thumbnail-image(v-if="spacePreviewThumbnailImage" :src="spacePreviewThumbnailImage")
            span Current Space
          button(@click="clearSpaceUserCardColor")
            img.icon.cancel(src="@/assets/add.svg")
        ColorPicker(
          :currentColor="spaceUserNewCardColor"
          :visible="state.spaceUserNewCardColorPickerIsVisible"
          :removeIsVisible="true"
          :recentColors="itemColors"
          @selectedColor="updateSpaceUserCardColor"
          @removeColor="clearSpaceUserCardColor"
        )

    //- all spaces (user)
    .row
      .button-wrap
        .segmented-buttons
          button(@click.stop="toggleUserNewCardColorPickerIsVisible" :class="{ active: state.userNewCardColorPickerIsVisible }")
            .badge.new-user-color-badge(:style="{ backgroundColor: userNewCardColor }")
            span All Spaces
          button(@click="clearUserCardColor")
            img.icon.cancel(src="@/assets/add.svg")
        ColorPicker(
          :currentColor="userNewCardColor"
          :visible="state.userNewCardColorPickerIsVisible"
          :removeIsVisible="true"
          :recentColors="itemColors"
          @selectedColor="updateUserCardColor"
          @removeColor="clearUserCardColor"
        )
</template>

<style lang="stylus">
dialog.new-card-color-picker
  .new-user-color-badge
    margin 0
    display inline-block
    height 11px
    min-height inherit
    border-radius var(--small-entity-radius)
    width 15px
    min-width initial
    margin-right 5px

  dialog.color-picker
    top initial
    bottom 16px
</style>
