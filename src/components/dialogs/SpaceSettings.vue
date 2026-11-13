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
  newCardColorPickerIsVisible: false,
  scope: 'space' // user

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
  state.newCardColorPickerIsVisible = false
}

const spacePreviewThumbnailImage = computed(() => spaceStore.previewThumbnailImagePrivate || spaceStore.previewThumbnailImage)
const itemColors = computed(() => spaceStore.getSpaceItemColors.card)

// scope

const scopeIsSpace = computed(() => state.scope === 'space')
const scopeIsUser = computed(() => state.scope === 'user')
const toggleScope = (value) => {
  state.scope = value
}

// new card color

const newCardColor = computed(() => {
  if (scopeIsSpace.value) {
    return spaceStore.userNewCardColor || props.defaultColor
  } else {
    return userStore.newCardColor || props.defaultColor
  }
})
const toggleNewCardColorPickerIsVisible = () => {
  const value = state.newCardColorPickerIsVisible
  closeDialogs()
  state.newCardColorPickerIsVisible = !value
}
const updateNewCardColor = (color) => {
  if (scopeIsSpace.value) {
    color = colord(color).toHex()
    spaceStore.updateSpaceUserNewCardColor(color)
  } else {
    color = colord(color).toHex()
    userStore.updateUser({ newCardColor: color })
  }
}
const clearNewCardColor = () => {
  if (scopeIsSpace.value) {
    spaceStore.updateSpaceUserNewCardColor(null)
  } else {
    userStore.updateUser({ newCardColor: null })
  }
}

// card snap

const shouldPreventSnapToCard = computed(() => spaceStore.shouldPreventSnapToCard)
const toggleShouldPreventSnapToCard = () => {
  const value = shouldPreventSnapToCard.value
  closeDialogs()
  spaceStore.updateSpace({ shouldPreventSnapToCard: !value })
}

</script>

<template lang="pug">
dialog.narrow.space-settings(v-if="props.visible" :open="props.visible" @click.left.stop="closeDialogs" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section.title-section
    p Space Settings
    .segmented-buttons
      button(:class="{ active: scopeIsSpace }" @click="toggleScope('space')")
        span Current Space
      button(:class="{ active: scopeIsUser }" @click="toggleScope('user')")
        span All Spaces
  section

    //- all spaces (user)
    .row
      .button-wrap
        .segmented-buttons
          button(@click.stop="toggleNewCardColorPickerIsVisible" :class="{ active: state.newCardColorPickerIsVisible }")
            .badge.new-user-color-badge(:style="{ backgroundColor: newCardColor }")
            span New Card Color
          button(@click="clearNewCardColor")
            img.icon.cancel(src="@/assets/add.svg")
        ColorPicker(
          :currentColor="newCardColor"
          :visible="state.newCardColorPickerIsVisible"
          :removeIsVisible="true"
          :recentColors="itemColors"
          @selectedColor="updateNewCardColor"
          @removeColor="clearNewCardColor"
        )

    .row(v-if="scopeIsSpace")
      label(:class="{ active: shouldPreventSnapToCard }" @click.left.prevent="toggleShouldPreventSnapToCard" @keydown.stop.enter="toggleShouldPreventSnapToCard")
        input(type="checkbox" v-model="shouldPreventSnapToCard")
        img.icon.card-snap-disabled(src="@/assets/card-snap-disabled.svg")
        span Disable Card Snapping

</template>

<style lang="stylus">
dialog.space-settings
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
