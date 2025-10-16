<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'
import MoveOrCopyItems from '@/components/dialogs/MoveOrCopyItems.vue'
import CardOrBoxActions from '@/components/subsections/CardOrBoxActions.vue'
import ConnectionActions from '@/components/subsections/ConnectionActions.vue'
import AlignAndDistribute from '@/components/AlignAndDistribute.vue'
import ItemDetailsCheckboxButton from '@/components/ItemDetailsCheckboxButton.vue'
import ShareCard from '@/components/dialogs/ShareCard.vue'

import { nanoid } from 'nanoid'
import last from 'lodash-es/last'
import consts from '@/consts.js'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const connectionStore = useConnectionStore()
const boxStore = useBoxStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const dialogElement = ref(null)

let prevCards, prevBoxes

const state = reactive({
  copyItemsIsVisible: false,
  moveItemsIsVisible: false,
  cardsIsConnected: false,
  shareCardIsVisible: false
})

const closeAllDialogs = () => {
  globalStore.closeAllDialogs()
}
const closeDialogs = () => {
  state.copyItemsIsVisible = false
  state.moveItemsIsVisible = false
  state.shareCardIsVisible = false
  globalStore.triggerCloseChildDialogs()
}
const multipleConnectionsSelectedIds = computed(() => globalStore.multipleConnectionsSelectedIds)
const multipleCardsSelectedIds = computed(() => globalStore.multipleCardsSelectedIds)
const multipleBoxesSelectedIds = computed(() => globalStore.multipleBoxesSelectedIds)

const visible = computed(() => {
  const isSelectedItems = multipleConnectionsSelectedIds.value.length || multipleCardsSelectedIds.value.length || multipleBoxesSelectedIds.value.length
  return globalStore.multipleSelectedActionsIsVisible && isSelectedItems
})
watch(() => visible.value, async (value, prevValue) => {
  if (value) {
    await nextTick()
    globalStore.pinchCounterZoomDecimal = utils.pinchCounterZoomDecimal()
    scrollIntoView()
    closeDialogs()
    globalStore.shouldExplicitlyHideFooter = true
  } else {
    globalStore.shouldExplicitlyHideFooter = false
  }
})

const scrollIntoView = () => {
  const element = dialogElement.value
  globalStore.scrollElementIntoView({ element })
}

const isThemeDarkAndUserColorLight = computed(() => {
  const isThemeDark = userStore.theme === 'dark'
  const userColorIsLight = !utils.colorIsDark(userColor.value)
  return isThemeDark && userColorIsLight
})
const colorClasses = computed(() => {
  return utils.colorClasses({ backgroundColor: userColor.value })
})
const maxCardCharacterLimit = computed(() => consts.cardCharacterLimit)
const userColor = computed(() => userStore.color)
const spaceCounterZoomDecimal = computed(() => globalStore.getSpaceCounterZoomDecimal)
const pinchCounterZoomDecimal = computed(() => globalStore.pinchCounterZoomDecimal)
const spaceZoomDecimal = computed(() => globalStore.getSpaceZoomDecimal)

const cardOrBoxIsSelected = computed(() => cards.value.length || boxes.value.length)

// items

const isSpaceMember = computed(() => userStore.getUserIsSpaceMember)
const canEditAsNonMember = computed(() => {
  const spaceIsOpen = spaceStore.privacy === 'open'
  const isSpaceMember = userStore.getUserIsSpaceMember
  return spaceIsOpen && !isSpaceMember
})
const canEditAll = computed(() => {
  if (isSpaceMember.value) { return { cards: true, connections: true, all: true } }
  const cards = multipleCardsSelectedIds.value.length === numberOfSelectedItemsCreatedByCurrentUser.value.cards
  const connections = multipleConnectionsSelectedIds.value.length === numberOfSelectedItemsCreatedByCurrentUser.value.connections
  const boxes = multipleBoxesSelectedIds.value.length === numberOfSelectedItemsCreatedByCurrentUser.value.boxes
  const all = cards && connections && boxes
  return { cards, connections, boxes, all }
})
const multipleCardOrBoxesIsSelected = computed(() => {
  const cards = multipleCardsIsSelected.value
  const boxes = multipleBoxesSelectedIds.value.length > 1
  return cards || boxes
})
const selectedItemsIsEditableByCurrentUser = computed(() => {
  const isCards = editableCards.value.length === cards.value.length
  const isConnections = editableConnections.value.length === connections.value.length
  const isBoxes = editableBoxes.value.length === boxes.value.length
  if (isCards && isConnections && isBoxes) {
    return true
  } else {
    return false
  }
})
const numberOfSelectedItemsCreatedByCurrentUser = computed(() => {
  const connectionsCreatedByCurrentUser = connections.value?.filter(connection => {
    if (!connection) { return }
    return userStore.getItemIsCreatedByUser(connection)
  })
  const cardsCreatedByCurrentUser = cards.value?.filter(card => {
    if (!card) { return }
    return userStore.getUserIsCardCreator(card)
  })
  const boxesCreatedByCurrentUser = boxes.value?.filter(box => {
    if (!box) { return }
    userStore.getUserIsBoxCreator(box)
  })
  return {
    connections: connectionsCreatedByCurrentUser.length,
    cards: cardsCreatedByCurrentUser.length,
    boxes: boxesCreatedByCurrentUser.length
  }
})
const multipleItemsSelectedIds = computed(() => multipleCardsSelectedIds.value.concat(multipleBoxesSelectedIds.value))
const multipleItemsIsSelected = computed(() => {
  return multipleItemsSelectedIds.value.length > 1
})
const itemsIsConnectedTogether = computed(() => {
  const itemIds = multipleItemsSelectedIds.value
  const connections = connectionStore.getConnectionsByItemIds(itemIds)
  const isConnected = connections.some(connection => {
    const isStart = itemIds.includes(connection.startItemId)
    const isEnd = itemIds.includes(connection.endItemId)
    return isStart && isEnd
  })
  return isConnected
})
const styles = computed(() => {
  const position = globalStore.multipleSelectedActionsPosition
  let zoom = spaceCounterZoomDecimal.value
  if (globalStore.isTouchDevice) {
    zoom = 1 / utils.visualViewport().scale
  }
  return {
    backgroundColor: userColor.value,
    left: position.x + 'px',
    top: position.y + 'px',
    transform: `scale(${zoom})`
  }
})

// cards

const moreCardOptionsLabel = computed(() => {
  if (multipleCardsSelectedIds.value.length > 1) {
    return 'CARDS'
  } else {
    return 'CARD'
  }
})

const cardCanBeSplit = computed(() => {
  if (!oneCardIsSelected.value) { return }
  if (!cards.value.length) { return }
  if (!cards.value[0].name) { return }
  return cards.value[0].name.includes('\n')
})
const oneCardIsSelected = computed(() => multipleCardsSelectedIds.value.length === 1)
const cardsIsSelected = computed(() => multipleCardsSelectedIds.value.length > 0)
const multipleCardsIsSelected = computed(() => multipleCardsSelectedIds.value.length > 1)
const cards = computed(() => {
  let cards = multipleCardsSelectedIds.value.map(cardId => {
    return cardStore.getCard(cardId)
  })
  cards = cards.filter(card => Boolean(card))
  prevCards = cards
  return cards
})
const editableCards = computed(() => {
  if (isSpaceMember.value) {
    return cards.value
  } else {
    return cards.value.filter(card => {
      return userStore.getUserIsCardCreator(card)
    })
  }
})

// connect

const toggleConnectItems = (event) => {
  if (itemsIsConnectedTogether.value) {
    disconnectItems()
  } else {
    connectItems(event)
  }
}
const connectItems = (event) => {
  const itemIds = multipleItemsSelectedIds.value
  itemIds.forEach((itemId, index) => {
    if (index + 1 < itemIds.length) { // create connections for middle items
      const startItemId = itemId
      const endItemId = itemIds[index + 1]
      const id = nanoid()
      const path = connectionStore.getConnectionPathBetweenItems({
        startItemId,
        endItemId,
        controlPoint: consts.straightLineConnectionPathControlPoint
      })
      connectionStore.createConnection({ id, startItemId, endItemId, path })
    }
  })
}
const disconnectItems = () => {
  const itemIds = multipleItemsSelectedIds.value
  let connections = connectionStore.getConnectionsByItemIds(itemIds)
  connections = connections.filter(connection => {
    const isStart = itemIds.includes(connection.startItemId)
    const isEnd = itemIds.includes(connection.endItemId)
    return isStart && isEnd
  })
  const connectionIds = connections.map(connection => connection.id)
  connectionStore.removeConnections(connectionIds)
}

// connections

const moreLineOptionsLabel = computed(() => 'LINE')
const onlyConnectionsIsSelected = computed(() => connectionsIsSelected.value && !cardsIsSelected.value && !boxesIsSelected.value)
const connectionsIsSelected = computed(() => Boolean(multipleConnectionsSelectedIds.value.length))
const connections = computed(() => {
  return multipleConnectionsSelectedIds.value.map(id => connectionStore.getConnection(id))
})
const editableConnections = computed(() => {
  if (isSpaceMember.value) {
    return connections.value
  } else {
    return connections.value.filter(connection => {
      return userStore.getItemIsCreatedByUser(connection)
    })
  }
})
const connectionType = (event) => {
  let type = connectionStore.getNewConnectionType
  const shouldUseLastConnectionType = userStore.shouldUseLastConnectionType
  const shiftKey = event.shiftKey
  const shouldAddType = !type || (shouldUseLastConnectionType && shiftKey) || (!shouldUseLastConnectionType && !shiftKey)
  if (shouldAddType) {
    connectionStore.createConnectionType()
  }
  type = connectionStore.getNewConnectionType
  return type
}

// boxes

const onlyBoxesIsSelected = computed(() => boxesIsSelected.value && !cardsIsSelected.value && !connectionsIsSelected.value)
const boxesIsSelected = computed(() => multipleBoxesSelectedIds.value.length > 0)
const boxes = computed(() => {
  let boxes = multipleBoxesSelectedIds.value.map(boxId => {
    return boxStore.getBox(boxId)
  })
  boxes = boxes.filter(box => Boolean(box))
  prevBoxes = boxes
  return boxes
})
const editableBoxes = computed(() => {
  if (isSpaceMember.value) {
    return boxes.value
  } else {
    return boxes.value.filter(box => {
      userStore.getUserIsBoxCreator(box)
    })
  }
})

// split and merge

const splitCard = () => {
  // open card details and trigger the split from there
  const cardId = cards.value[0].id
  globalStore.clearMultipleSelected()
  globalStore.closeAllDialogs()
  globalStore.currentDraggingCardId = cardId
  globalStore.updateCardDetailsIsVisibleForCardId(cardId)
  globalStore.triggerSplitCard(cardId)
}
const positionNewCards = async (newCards) => {
  const spaceBetweenCards = 12
  await nextTick()
  newCards = newCards.map((card, index) => {
    if (index === 0) { return card }
    const prevCard = newCards[index - 1]
    const rect = utils.cardElementDimensions(prevCard)
    card.y = rect.y + rect.height + spaceBetweenCards
    return card
  })
  newCards = newCards.map(card => {
    return {
      id: card.id,
      name: card.name,
      y: card.y,
      width: card.width,
      height: card.height
    }
  })
  cardStore.updateCards(newCards)
  globalStore.closeAllDialogs()
}
const cardsSortedByY = () => {
  return cards.value.sort((a, b) => {
    return a.y - b.y
  })
}
const mergeSelectedCards = () => {
  let name = ''
  const cards = cardsSortedByY()
  const urlPreview = {}
  cards.forEach(card => {
    name = `${name}\n\n${card.name.trim()}`
    Object.keys(card).forEach(key => {
      if (key.startsWith('urlPreview') && card[key] && !urlPreview[key]) {
        urlPreview[key] = card[key]
      }
    })
  })
  name = name.trim()
  let newName
  do {
    newName = name.substring(0, maxCardCharacterLimit.value)
    const lastSpace = newName.lastIndexOf(' ')
    const lastLineBreak = newName.lastIndexOf('\n')
    const shouldSplitByMaxLength = lastSpace === -1 && lastLineBreak === -1
    if (name.length < maxCardCharacterLimit.value) {
      newName = name
      name = ''
    } else if (shouldSplitByMaxLength) {
      name = name.substring(maxCardCharacterLimit.value)
    } else if (lastSpace >= lastLineBreak) {
      newName = name.substring(0, lastSpace)
      name = name.substring(lastSpace)
    } else {
      newName = name.substring(0, lastLineBreak)
      name = name.substring(lastLineBreak)
    }
  } while (name.length > maxCardCharacterLimit.value)
  const position = { x: cards[0].x, y: cards[0].y }
  remove({ shouldRemoveCardsOnly: true })
  const cardWithBackgroundColor = cards.find(card => card.backgroundColor)
  const cardBackgroundColor = cardWithBackgroundColor?.backgroundColor
  const userCardBackgroundColor = userStore.defaultCardBackgroundColor
  const newCard = {
    id: nanoid(),
    name: newName,
    x: position.x,
    y: position.y,
    backgroundColor: cardBackgroundColor || userCardBackgroundColor,
    ...urlPreview
  }
  cardStore.createCard(newCard)
  prevCards = [newCard] // for history
  setTimeout(() => {
    positionNewCards([newCard])
  }, 100)
}

// copy and move

const toggleCopyItemsIsVisible = () => {
  const isVisible = state.copyItemsIsVisible
  closeDialogs()
  state.copyItemsIsVisible = !isVisible
}
const toggleMoveItemsIsVisible = () => {
  const isVisible = state.moveItemsIsVisible
  closeDialogs()
  state.moveItemsIsVisible = !isVisible
}

// share

// const toggleShareCardIsVisible = () => {
//   const isVisible = state.shareCardIsVisible
//   closeDialogs()
//   state.shareCardIsVisible = !isVisible
// }

// more options

const moreOptionsIsVisible = computed(() => userStore.shouldShowMoreAlignOptions)
const shouldShowMultipleSelectedLineActions = computed(() => userStore.shouldShowMultipleSelectedLineActions)
const shouldShowMultipleSelectedBoxActions = computed(() => userStore.shouldShowMultipleSelectedBoxActions)
const toggleShouldShowMultipleSelectedLineActions = async () => {
  closeDialogs()
  const value = !shouldShowMultipleSelectedLineActions.value
  await userStore.updateUser({
    shouldShowMultipleSelectedLineActions: value
  })
  nextTick(() => {
    scrollIntoView()
  })
}
const toggleShouldShowMultipleSelectedBoxActions = async () => {
  closeDialogs()
  const value = !shouldShowMultipleSelectedBoxActions.value
  await userStore.updateUser({
    shouldShowMultipleSelectedBoxActions: value
  })
  nextTick(() => {
    scrollIntoView()
  })
}

// remove

const remove = ({ shouldRemoveCardsOnly }) => {
  const cardIds = editableCards.value.map(card => card.id)
  const connectionIds = editableConnections.value.map(connection => connection.id)
  cardStore.removeCards(cardIds)
  connectionStore.removeConnections(connectionIds)
  if (!shouldRemoveCardsOnly) {
    editableBoxes.value.forEach(box => boxStore.removeBox(box.id))
  }
  globalStore.closeAllDialogs()
  globalStore.clearMultipleSelected()
}

</script>

<template lang="pug">
dialog.narrow.multiple-selected-actions(
  v-if="visible"
  :open="visible"
  ref="dialogElement"
  @click.left="closeDialogs"
  :style="styles"
  :class="colorClasses"
)
  .dark-theme-background-layer(v-if="isThemeDarkAndUserColorLight")
  .close-button-wrap.inline-button-wrap(@click="closeAllDialogs")
    button.small-button.inline-button
      img.icon.cancel(src="@/assets/add.svg")
  section

    //- Edit Cards
    .row(v-if="cardOrBoxIsSelected")
      //- [·]
      ItemDetailsCheckboxButton(:boxes="boxes" :cards="cards" :isDisabled="!canEditAll.all")
      //- Connect
      button(v-if="multipleItemsIsSelected" :class="{active: itemsIsConnectedTogether}" @click.left.prevent="toggleConnectItems" @keydown.stop.enter="toggleConnectItems" :disabled="!canEditAll.all" title="Connect/Disconnect Cards")
        img.connect-items.icon(src="@/assets/connect-items.svg")
      //- LINE Options
      .button-wrap(v-if="connectionsIsSelected && !onlyConnectionsIsSelected")
        button(:disabled="!canEditAll.cards && !canEditAll.boxes" @click.left.stop="toggleShouldShowMultipleSelectedLineActions" :class="{active : shouldShowMultipleSelectedLineActions}" title="More Line Options")
          span Line
          img.icon.down-arrow(src="@/assets/down-arrow.svg")
      //- BOX options
      .button-wrap(v-if="boxesIsSelected && !onlyBoxesIsSelected")
        button(:disabled="!canEditAll.cards && !canEditAll.boxes" @click.left.stop="toggleShouldShowMultipleSelectedBoxActions" :class="{active : shouldShowMultipleSelectedBoxActions}" title="More Box Options")
          span Box
          img.icon.down-arrow(src="@/assets/down-arrow.svg")

    CardOrBoxActions(
      :visible="cardsIsSelected && canEditAll.all"
      :cards="cards"
      @closeDialogs="closeDialogs"
      :backgroundColor="userColor"
      :labelIsVisible="true"
    )
    CardOrBoxActions(
      :labelIsVisible="true"
      :visible="(shouldShowMultipleSelectedBoxActions || onlyBoxesIsSelected) && boxesIsSelected && canEditAll.all"
      :boxes="boxes"
      @closeDialogs="closeDialogs"
      :backgroundColor="userColor"
    )
    ConnectionActions(:visible="(shouldShowMultipleSelectedLineActions || onlyConnectionsIsSelected) && connectionsIsSelected" :connections="editableConnections" @closeDialogs="closeDialogs" :canEditAll="canEditAll" :backgroundColor="userColor" :label="moreLineOptionsLabel")

  section
    .row(v-if="cardOrBoxIsSelected")
      //- Align And Distribute
      AlignAndDistribute(:visible="multipleCardOrBoxesIsSelected" :shouldHideMoreOptions="true" :shouldDistributeWithAlign="true" :numberOfSelectedItemsCreatedByCurrentUser="numberOfSelectedItemsCreatedByCurrentUser" :canEditAll="canEditAll" :cards="cards" :editableCards="cards" :connections="connections" :boxes="boxes" :editableBoxes="editableBoxes")
      //- Move/Copy
      .segmented-buttons.move-or-copy-wrap
        button(@click.left.stop="toggleCopyItemsIsVisible" :class="{ active: state.copyItemsIsVisible }")
          span Copy
          MoveOrCopyItems(:visible="state.copyItemsIsVisible" :actionIsMove="false")
        button(@click.left.stop="toggleMoveItemsIsVisible" :class="{ active: state.moveItemsIsVisible }" :disabled="!canEditAll.all")
          span Move
          MoveOrCopyItems(:visible="state.moveItemsIsVisible" :actionIsMove="true")
    //- More Options
    AlignAndDistribute(:visible="multipleCardOrBoxesIsSelected && moreOptionsIsVisible" :numberOfSelectedItemsCreatedByCurrentUser="numberOfSelectedItemsCreatedByCurrentUser" :canEditAll="canEditAll" :cards="cards" :editableCards="cards" :connections="connections" :boxes="boxes" :editableBoxes="editableBoxes")

    .row
      //- Remove
      button.danger(:disabled="!canEditAll.all" @click.left="remove")
        img.icon(src="@/assets/remove.svg")

      template(v-if="multipleCardsIsSelected")
        //- Merge
        button(@click="mergeSelectedCards" :disabled="!canEditAll.cards")
          img.icon(src="@/assets/merge.svg")
          span Merge
        //- Split
        button(v-if="cardCanBeSplit" @click="splitCard" :disabled="!canEditAll.cards")
          img.icon(src="@/assets/split.svg")
          span Split

    p.badge.info(v-if="canEditAsNonMember && !selectedItemsIsEditableByCurrentUser")
      img.icon.open(src="@/assets/open.svg")
      span In open spaces, you can only edit items you created
</template>

<style lang="stylus">
.multiple-selected-actions
  transform-origin top left
  .segmented-colors
    display inline-block
    vertical-align middle
    .current-color
      display inline-block
      vertical-align bottom
      border-radius 0
      &:first-child
        border-top-left-radius var(--small-entity-radius)
        border-bottom-left-radius var(--small-entity-radius)
      &:last-child
        border-top-right-radius var(--small-entity-radius)
        border-bottom-right-radius var(--small-entity-radius)
        margin-right 0
  .items-checkboxes
    input
      margin 0
    vertical-align 1px
  .align-and-distribute + .move-or-copy-wrap
    margin-left 4px
  .more-options
    margin-bottom 10px
  .edit-connection-types
    flex-wrap wrap
    align-items flex-start
    .change-color
      display flex
      overflow hidden
      align-items center
      .segmented-colors
        max-width 14px
        margin-top 1px
        display flex

  .button-wrap.disabled
    opacity 0.5
    pointer-events none

  .style-actions + .connection-actions
    border-top 1px solid var(--primary-border)

  .down-arrow
    vertical-align 2px

  .segmented-buttons + .segmented-buttons
    margin-left 0

  .icon.connect-items
    height 12px
    vertical-align -1px

  &.is-background-light
    section
      border-color var(--primary-border-on-light-background)
    section.subsection + section.subsection
      border-top 1px solid var(--primary-border-on-light-background)
  &.is-background-dark
    section
      border-color var(--primary-border-on-dark-background)
    section.subsection + section.subsection
      border-top 1px solid var(--primary-border-on-dark-background)
  .close-button-wrap
    cursor pointer
    position absolute
    left initial
    right 0
    top -5px
    padding-right 2px
    padding-left 2px
    padding-bottom 2px
    z-index 1
    button
      cursor pointer
      background-color var(--primary-background)
</style>
