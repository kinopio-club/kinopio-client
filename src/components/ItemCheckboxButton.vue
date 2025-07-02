<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useCardStore } from '@/stores/useCardStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useBoxStore } from '@/stores/useBoxStore'

import utils from '@/utils.js'

const cardStore = useCardStore()
const connectionStore = useConnectionStore()
const boxStore = useBoxStore()

onMounted(() => {
  checkItemsHaveCheckboxes()
  checkItemsCheckboxIsChecked()
})

const emit = defineEmits(['updateCount'])

const props = defineProps({
  isDisabled: Boolean,
  boxes: {
    type: Array,
    default: () => {
      return []
    }
  },
  cards: {
    type: Array,
    default: () => {
      return []
    }
  }
})
watch(() => props.cards, async (value, prevValue) => {
  checkItemsHaveCheckboxes()
  checkItemsCheckboxIsChecked()
})
watch(() => props.boxes, async (value, prevValue) => {
  checkItemsHaveCheckboxes()
  checkItemsCheckboxIsChecked()
})

const state = reactive({
  itemsHaveCheckboxes: false,
  itemsCheckboxIsChecked: false
})

const items = computed(() => props.cards.concat(props.boxes))
const itemCheckboxes = computed({
  get () {
    return state.itemsCheckboxIsChecked
  },
  set (value) {
    // remove checkbox
    if (state.itemsCheckboxIsChecked) {
      props.cards.forEach(card => {
        cardStore.clearCardChecked(card.id)
      })
      props.boxes.forEach(box => {
        boxStore.clearBoxChecked(box.id)
      })
    // add checkbox
    } else {
      props.cards.forEach(card => {
        cardStore.toggleCardChecked(card.id, value)
      })
      props.boxes.forEach(box => {
        boxStore.toggleBoxChecked(box.id, value)
      })
    }
    checkItemsHaveCheckboxes()
    checkItemsCheckboxIsChecked()
    updateDimensionsAndPaths()
  }
})
const checkItemsHaveCheckboxes = () => {
  const itemsWithCheckboxes = items.value.filter(item => {
    if (!item) { return }
    return utils.checkboxFromString(item.name)
  })
  state.itemsHaveCheckboxes = itemsWithCheckboxes.length === items.value.length
}
const checkItemsCheckboxIsChecked = () => {
  const itemsChecked = items.value.filter(item => utils.nameIsChecked(item.name))
  state.itemsCheckboxIsChecked = itemsChecked.length === items.value.length
}
const addCheckboxToItems = async () => {
  const updatedCards = []
  const updatedBoxes = []
  // cards
  props.cards.forEach(card => {
    if (!utils.checkboxFromString(card.name)) {
      const update = {
        id: card.id,
        name: `[] ${card.name}`
      }
      updatedCards.push(update)
    }
  })
  cardStore.updateCards(updatedCards)
  // boxes
  props.boxes.forEach(box => {
    if (!utils.checkboxFromString(box.name)) {
      const update = {
        id: box.id,
        name: `[] ${box.name}`
      }
      updatedBoxes.push(update)
    }
  })
  boxStore.updateBoxes(updatedBoxes)
  state.itemsHaveCheckboxes = true
  updateDimensionsAndPaths()
}

// card positions

const updateDimensionsAndPaths = async () => {
  const ids = props.cards.map(card => card.id)
  cardStore.updateCardsDimensions(ids)
  await nextTick()
  await nextTick()
  connectionStore.updateConnectionPaths(ids)
}
</script>

<template lang="pug">
.button-wrap.items-checkboxes.checkbox-button(:class="{ disabled: isDisabled }" title="Toggle Checkboxes")
  label.fixed-height(v-if="state.itemsHaveCheckboxes" :class="{active: state.itemsCheckboxIsChecked}" tabindex="0")
    input(type="checkbox" v-model="itemCheckboxes" tabindex="-1")
  label.fixed-height(v-if="!state.itemsHaveCheckboxes" @click.left.prevent="addCheckboxToItems" @keydown.stop.enter="addCheckboxToItems" tabindex="0" title="Add Checkboxes")
    input.add(type="checkbox" tabindex="-1")
</template>

<style lang="stylus">
.checkbox-button
  input
    margin 0 !important
</style>
