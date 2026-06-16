<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useGroupStore } from '@/stores/useGroupStore'

import utils from '@/utils.js'
import CardListItem from '@/components/CardListItem.vue'
import ItemCheckboxButton from '@/components/ItemCheckboxButton.vue'
import GroupLabel from '@/components/GroupLabel.vue'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const boxStore = useBoxStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const groupStore = useGroupStore()

const emit = defineEmits(['selectItem', 'selectSpace'])

const props = defineProps({
  lines: {
    type: Array,
    default: () => []
  },
  lists: {
    type: Array,
    default: () => []
  },
  boxes: {
    type: Array,
    default: () => []
  },
  cards: {
    type: Array,
    default: () => []
  },
  space: Object,
  shouldShowMarkAllComplete: Boolean
})

const state = reactive({
  confirmMarkAllCompleteIsVisible: false
})

const canEditSpace = computed(() => userStore.getUserCanEditSpace)

// adopted from CardList.vue
const normalizedCards = computed(() => {
  const items = utils.clone(props.cards)
  return items.map(card => {
    card = cardStore.cardWithNameSegments(card, true) // update w card.atUserMentions

    card.user = spaceStore.getSpaceUserById(card.userId)
    globalStore.updateOtherUsers(card.user)
    if (!card.user) {
      card.user = {
        id: '',
        name: '',
        color: undefined
      }
    }
    return card
  })
})
const allItems = computed(() => {
  let lines = utils.clone(props.lines)
  let boxes = utils.clone(props.boxes)
  let lists = utils.clone(props.lists)
  lines = lines.map(line => {
    line.itemType = 'line'
    return line
  })
  lists = lists.map(list => {
    list.itemType = 'list'
    return list
  })
  boxes = boxes.map(box => {
    box.itemType = 'box'
    return box
  })
  const cards = normalizedCards.value.map(card => {
    card.itemType = 'card'
    card.user = {
      id: card.userId
    }
    return card
  })
  let items = lines.concat(lists, boxes, cards)
  items = utils.sortByY(items)
  return items
})

const boxIsTodo = (box) => {
  return Boolean(utils.checkboxFromString(box.name))
}
const boxName = (box) => {
  const checkbox = utils.checkboxFromString(box.name)
  if (checkbox) {
    return box.name.replace(checkbox, '')
  } else {
    return box.name
  }
}

const selectItem = (item) => {
  emit('selectItem', item)
}
const selectSpace = () => {
  emit('selectSpace', props.space)
  updateConfirmMarkAllCompleteIsVisible(false)
}

// space

const isCurrentSpace = computed(() => props.space.id === spaceStore.id)
const group = (groupId) => {
  if (!groupId) { return }
  return groupStore.getGroup(groupId)
}
const previewImage = (space) => {
  if (!space.previewThumbnailImage) { return }
  return space.previewThumbnailImage + `?date=${globalStore.sessionDate}`
}
const markAllSpaceItemsChecked = () => {
  cardStore.markAllCheckboxCardsChecked()
  boxStore.markAllCheckboxBoxesChecked()
  updateConfirmMarkAllCompleteIsVisible(false)
}
const toggleConfirmMarkAllCompleteIsVisible = () => {
  state.confirmMarkAllCompleteIsVisible = !state.confirmMarkAllCompleteIsVisible
}
const updateConfirmMarkAllCompleteIsVisible = (value) => {
  state.confirmMarkAllCompleteIsVisible = value
}

// styles

const boxBadgeStyles = (box) => {
  return {
    border: `1px solid ${box.color}`,
    borderTop: `8px solid ${box.color}`
  }
}
const badgeColorClasses = (item) => {
  return utils.colorClasses({ backgroundColor: item.color || item.backgroundColor })
}
</script>

<template lang="pug">
ul.results-list.item-list(v-if="allItems.length" :class="{ 'item-list-border': props.space }")
  //- space
  li.space-list-item(v-if="props.space" @click.left="selectSpace" :class="{ active: isCurrentSpace }")
    //- inbox
    template(v-if="space.name === 'Inbox'")
      img.icon.inbox-icon(src="@/assets/inbox.svg")
    //- preview image
    .preview-thumbnail-image-wrap(v-if="previewImage(props.space)")
      img.preview-thumbnail-image(:src="previewImage(props.space)" loading="lazy")
    //- group
    template(v-if="group(space.groupId)")
      GroupLabel(:group="group(space.groupId)")
    .badge.secondary {{ space.name }}

    //- complete all
    .mark-all-checked-button-wrap(v-if="isCurrentSpace && props.shouldShowMarkAllComplete")
      button.small-button(title="Mark All Complete" @click.stop="toggleConfirmMarkAllCompleteIsVisible" :class="{ active: state.confirmMarkAllCompleteIsVisible }")
        img.icon.checkmark(src="@/assets/checkmark.svg")
        span All

  section.subsection(v-if="state.confirmMarkAllCompleteIsVisible" @click.stop)
    .row.confirmation-row
      button.small-button(@click="updateConfirmMarkAllCompleteIsVisible(false)")
        img.icon.cancel(src="@/assets/add.svg")
      button.small-button.danger(@click.stop="markAllSpaceItemsChecked")
        img.icon.checkmark(src="@/assets/checkmark.svg")
        span Mark All Complete

  //- items
  template(v-for="item in allItems" :key="item.id")
    //- box
    template(v-if="item.itemType === 'box'")
      li(@click.left="selectItem(item)" tabindex="0" v-on:keyup.enter="selectItem(item)")
        ItemCheckboxButton(:visible="boxIsTodo(item)" :box="item" :canEditItem="canEditSpace" :parentIsList="true")
        .box-badge.badge(:style="boxBadgeStyles(item)")
          .box-info(:style="{backgroundColor: item.color}")
          .box-fill(:style="{backgroundColor: item.color}")
        span {{ boxName(item) }}
    //- line
    template(v-if="item.itemType === 'line'")
      li(@click.left="selectItem(item)" tabindex="0" v-on:keyup.enter="selectItem(item)")
        .badge-horizontal-line(:style="{ background: item.color }")
        .badge.button-badge(:style="{background: item.color}" :class="badgeColorClasses(item)")
          span {{ item.name }}
    //- list
    template(v-if="item.itemType === 'list'")
      li(@click.left="selectItem(item)" tabindex="0" v-on:keyup.enter="selectItem(item)")
        .badge.button-badge(:style="{background: item.color}" :class="badgeColorClasses(item)")
          span {{ item.name }}
    //- card
    template(v-if="item.itemType === 'card'")
      CardListItem(:card="item" @selectCard="selectItem" tabindex="0" v-on:keyup.enter="selectItem(item)" :shouldHideDate="true")

.badge.secondary(v-if="!allItems.length && !props.space")
  span No items in this space yet
</template>

<style lang="stylus">
.item-list
  .box-badge
    padding 1px 4px
    overflow hidden
    margin-top -1px
    .box-fill
      top 0
      left 0
      width 100%
      height 100%
      position absolute
      opacity 0.5
  .badge-horizontal-line
    position absolute
    left 0
    top 17px
    width 100%
    height 1px

  &.item-list-border:not(:first-child)
    border-top 1px solid var(--primary-border)
    padding-top 5px
    margin-top 5px
  .space-list-item
    display flex
    align-items center
    .preview-thumbnail-image-wrap
      margin-right 6px
      margin-bottom -2px
    .inbox-icon
      margin-right 6px
  .icon.checkmark
    vertical-align 2px
  .mark-all-checked-button-wrap
    position absolute
    left initial
    right 7px
    z-index 1
  .confirmation-row
    justify-content flex-end
  .card-image
    margin-right 5px
</style>
