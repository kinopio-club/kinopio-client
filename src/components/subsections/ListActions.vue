<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useListStore } from '@/stores/useListStore'
import { useUserStore } from '@/stores/useUserStore'

import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import utils from '@/utils.js'

import uniq from 'lodash-es/uniq'
import uniqBy from 'lodash-es/uniqBy'

const globalStore = useGlobalStore()
const spaceStore = useSpaceStore()
const listStore = useListStore()
const userStore = useUserStore()

let unsubscribes

const emit = defineEmits(['closeDialogs', 'scrollIntoView'])

onMounted(() => {
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerCloseChildDialogs' && props.visible) {
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
})

const props = defineProps({
  visible: Boolean,
  lists: Array,
  canEditAll: Object,
  backgroundColor: String,
  label: String,
  collapseExpandIsVisible: Boolean,
  colorIsHidden: Boolean
  // shouldHideColor: Boolean
})
const state = reactive({
  isHover: false,
  colorPickerIsVisible: false
  // defaultColor: '#e3e3e3',
})

const colorClasses = computed(() => {
  return utils.colorClasses({ backgroundColor: props.backgroundColor })
})

// utils

const closeDialogsAndEmit = () => {
  closeDialogs()
  emit('closeDialogs')
}
const closeDialogs = () => {
}
const updateIsHover = (value) => {
  state.isHover = value
}
const isHoverVisible = computed(() => {
  return state.isHover && props.collapseExpandIsVisible
})
const updateList = (list, updates) => {
  const keys = Object.keys(updates)
  list = { id: list.id }
  keys.forEach(key => {
    list[key] = updates[key]
  })
  listStore.updateList(list)
}

// collapse/expand

const shouldShowMultipleSelectedListActions = computed(() => userStore.shouldShowMultipleSelectedListActions)
const toggleShouldShowMultipleSelectedListActions = async () => {
  closeDialogs()
  const value = !shouldShowMultipleSelectedListActions.value
  await userStore.updateUser({
    shouldShowMultipleSelectedListActions: value
  })
  nextTick(() => {
    emit('scrollIntoView')
  })
}

// color

const toggleColorPickerIsVisible = () => {
  const isVisible = state.colorPickerIsVisible
  closeDialogs()
  state.colorPickerIsVisible = !isVisible
}
const color = computed(() => {
  let colors = props.lists.map(item => item.color)
  colors = colors.filter(color => Boolean(color))
  // const itemsHaveColors = colors.length === items.value.length
  // const colorsAreEqual = uniq(colors).length === 1
  // if (itemsHaveColors && colorsAreEqual) {
  return colors[0]
  // } else {
  //   return state.defaultColor
  // }
})
const itemColors = computed(() => spaceStore.getSpaceItemColors.list)
const updateColor = (color) => {
  props.lists.forEach(list => {
    const currentColor = list.color
    if (currentColor === color) { return }
    updateList(list, { color })
  })
}

</script>

<template lang="pug">
section.subsection.list-actions(
  v-if="props.lists.length"
  :class="colorClasses"
  @pointerover="updateIsHover(true)"
  @pointerleave="updateIsHover(false)"
)
  template(v-if="props.visible")
    p.subsection-vertical-label(v-if="props.label" :style="{ background: props.backgroundColor }")
      span.label(:class="colorClasses") {{ props.label }}
    .row
      //- Color
      .button-wrap(v-if="!colorIsHidden" @click.left.stop="toggleColorPickerIsVisible")
        button.change-color(:disabled="!canEditAll" :class="{active: state.colorPickerIsVisible}" title="Color")
          .current-color(:style="{ background: color }")
        ColorPicker(
          :currentColor="color"
          :visible="state.colorPickerIsVisible"
          :recentColors="itemColors"
          @selectedColor="updateColor"
          :luminosityIsDark="true"
        )
  //- collapsed horizontal label
  template(v-else)
    .subsection-horizontal-label(@click="toggleShouldShowMultipleSelectedListActions")
      span {{ props.label }}
  //- collapse/expand button
  .collapse-expand-button-wrap.inline-button-wrap(v-if="props.collapseExpandIsVisible" @click="toggleShouldShowMultipleSelectedListActions" title="Toggle List Line Options")
    button.small-button.inline-button(:class="{active: shouldShowMultipleSelectedListActions || isHoverVisible}")
      img.icon.down-arrow(src="@/assets/down-arrow.svg")
</template>

<style lang="stylus">
dialog section.list-actions
  position relative
  padding var(--subsection-padding)
  padding-bottom 0
  background-color transparent
  border 1px solid var(--primary-border)
  padding-bottom 0
  &.is-background-light
    border-color var(--primary-border-on-light-background) !important
  &.is-background-dark
    border-color var(--primary-border-on-dark-background) !important

  .row
    margin-top 0
    margin-bottom 0
  .button-wrap
    margin-left 0
    margin-right 4px
    vertical-align middle
    margin-bottom 4px
  .label
    &.is-background-light
      color var(--primary-on-light-background)
    &.is-background-dark
      color var(--primary-on-dark-background)

  .subsection-horizontal-label
    cursor pointer
</style>
