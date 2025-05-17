<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useCardStore } from '@/stores/useCardStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useBoxStore } from '@/stores/useBoxStore'

import utils from '@/utils.js'
import MoveOrCopyItems from '@/components/dialogs/MoveOrCopyItems.vue'
import CardOrBoxActions from '@/components/subsections/CardOrBoxActions.vue'
import ConnectionActions from '@/components/subsections/ConnectionActions.vue'
import AlignAndDistribute from '@/components/AlignAndDistribute.vue'
import ItemCheckboxButton from '@/components/ItemCheckboxButton.vue'
import ShareCard from '@/components/dialogs/ShareCard.vue'

import { nanoid } from 'nanoid'
import last from 'lodash-es/last'
import consts from '@/consts.js'

const store = useStore()
const cardStore = useCardStore()
const connectionStore = useConnectionStore()
const boxStore = useBoxStore()

const dialogElement = ref(null)

let prevCards, prevBoxes

const state = reactive({
  copyItemsIsVisible: false,
  moveItemsIsVisible: false,
  cardsIsConnected: false,
  shareCardIsVisible: false
})

const closeAllDialogs = () => {
  store.dispatch('closeAllDialogs')
}
const closeDialogs = () => {
  state.copyItemsIsVisible = false
  state.moveItemsIsVisible = false
  state.shareCardIsVisible = false
  store.commit('triggerCloseChildDialogs')
}
const multipleConnectionsSelectedIds = computed(() => store.state.multipleConnectionsSelectedIds)
const multipleCardsSelectedIds = computed(() => store.state.multipleCardsSelectedIds)
const multipleBoxesSelectedIds = computed(() => store.state.multipleBoxesSelectedIds)

const visible = computed(() => {
  const isSelectedItems = multipleConnectionsSelectedIds.value.length || multipleCardsSelectedIds.value.length || multipleBoxesSelectedIds.value.length
  return store.state.multipleSelectedActionsIsVisible && isSelectedItems
})
watch(() => visible.value, async (value, prevValue) => {
  if (value) {
    await nextTick()
    store.commit('pinchCounterZoomDecimal', utils.pinchCounterZoomDecimal())
    checkIsCardsConnected()
    scrollIntoView()
    closeDialogs()
    store.dispatch('history/snapshots')
    store.commit('shouldExplicitlyHideFooter', true)
  } else {
    store.dispatch('history/resume')
    store.dispatch('history/add', { cards: prevCards, boxes: prevBoxes, useSnapshot: true })
    store.commit('shouldExplicitlyHideFooter', false)
  }
})

const scrollIntoView = () => {
  const element = dialogElement.value
  store.commit('scrollElementIntoView', { element })
}

const isThemeDarkAndUserColorLight = computed(() => {
  const isThemeDark = store.state.currentUser.theme === 'dark'
  const userColorIsLight = !utils.colorIsDark(userColor.value)
  return isThemeDark && userColorIsLight
})
const colorClasses = computed(() => {
  return utils.colorClasses({ backgroundColor: userColor.value })
})
const maxCardCharacterLimit = computed(() => consts.cardCharacterLimit)
const userColor = computed(() => store.state.currentUser.color)
const spaceCounterZoomDecimal = computed(() => store.getters.spaceCounterZoomDecimal)
const pinchCounterZoomDecimal = computed(() => store.state.pinchCounterZoomDecimal)
const spaceZoomDecimal = computed(() => store.getters.spaceZoomDecimal)

const cardOrBoxIsSelected = computed(() => cards.value.length || boxes.value.length)

// items

const isSpaceMember = computed(() => store.getters['currentUser/isSpaceMember']())
const canEditAsNonMember = computed(() => {
  const spaceIsOpen = store.state.currentSpace.privacy === 'open'
  const isSpaceMember = store.getters['currentUser/isSpaceMember']()
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
    return store.getters['currentUser/connectionIsCreatedByCurrentUser'](connection)
  })
  const cardsCreatedByCurrentUser = cards.value?.filter(card => {
    if (!card) { return }
    return store.getters['currentUser/cardIsCreatedByCurrentUser'](card)
  })
  const boxesCreatedByCurrentUser = boxes.value?.filter(box => {
    if (!box) { return }
    return store.getters['currentUser/boxIsCreatedByCurrentUser'](box)
  })
  return {
    connections: connectionsCreatedByCurrentUser.length,
    cards: cardsCreatedByCurrentUser.length,
    boxes: boxesCreatedByCurrentUser.length
  }
})
const multipleItemsSelected = computed(() => {
  const total = multipleConnectionsSelectedIds.value.length + multipleCardsSelectedIds.value.length
  return Boolean(total > 1)
})
const styles = computed(() => {
  const position = store.state.multipleSelectedActionsPosition
  let zoom = spaceCounterZoomDecimal.value
  if (store.state.isTouchDevice) {
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
    cardStore.getCard(cardId)
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
      return store.getters['currentUser/cardIsCreatedByCurrentUser'](card)
    })
  }
})

// connect cards

const checkIsCardsConnected = () => {
  const selectedCards = multipleCardsSelectedIds.value
  const connections = selectedCards.filter((cardId, index) => {
    const startItemId = selectedCards[index - 1]
    const endItemId = cardId
    const connectionExists = connectionAlreadyExists(startItemId, endItemId)
    const connectionExistsReverse = connectionAlreadyExists(endItemId, startItemId)
    if (connectionExists || connectionExistsReverse) { return true }
  })
  if (connections.length === selectedCards.length - 1) {
    state.cardsIsConnected = true
  } else {
    state.cardsIsConnected = false
  }
}
const toggleConnectCards = (event) => {
  store.dispatch('history/resume')
  if (state.cardsIsConnected) {
    disconnectCards()
  } else {
    connectCards(event)
  }
  checkIsCardsConnected()
  store.dispatch('history/pause')
}
const connectCards = (event) => {
  const cardIds = multipleCardsSelectedIds.value
  let connections = cardIds.map((cardId, index) => {
    if (index + 1 < cardIds.length) { // create connections for middle cards
      const startItemId = cardId
      const endItemId = cardIds[index + 1]
      if (connectionAlreadyExists(startItemId, endItemId)) { return }
      const id = nanoid()
      const path = connectionStore.getConnectionPathBetweenItems({
        startItemId,
        endItemId,
        controlPoint: consts.straightLineConnectionPathControlPoint
      })
      return {
        id, startItemId, endItemId, path
      }
    }
  })
  connections = connections.filter(Boolean)
  const type = connectionType(event)
  connections.forEach(connection => {
    connection.type = type
    connectionStore.createConnection(connection)
    store.dispatch('addToMultipleConnectionsSelected', connection.id)
  })
}
const disconnectCards = () => {
  const cardIds = multipleCardsSelectedIds.value
  const connections = connectionStore.getItemsConnections(cardIds)
  const ids = connections.map(connection => connection.id)
  connectionStore.removeConnections(ids)
  connectionStore.removeAllUnusedConnectionTypes()
}

// connections

const moreLineOptionsLabel = computed(() => {
  if (multipleConnectionsSelectedIds.value.length > 1) {
    return 'LINES'
  } else {
    return 'LINE'
  }
})
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
      return store.getters['currentUser/connectionIsCreatedByCurrentUser'](connection)
    })
  }
})
const connectionType = (event) => {
  let type = connectionStore.getNewConnectionType
  const shouldUseLastConnectionType = store.state.currentUser.shouldUseLastConnectionType
  const shiftKey = event.shiftKey
  const shouldAddType = !type || (shouldUseLastConnectionType && shiftKey) || (!shouldUseLastConnectionType && !shiftKey)
  if (shouldAddType) {
    connectionStore.createConnectionType()
  }
  type = connectionStore.getNewConnectionType
  return type
}
const connectionAlreadyExists = (startItemId, endItemId) => {
  const connections = connectionStore.getAllConnections
  const existingConnection = connections.find(connection => {
    const isStart = connection.startItemId === startItemId
    const isEnd = connection.endItemId === endItemId
    return isStart && isEnd
  })
  return Boolean(existingConnection)
}

// boxes

const onlyBoxesIsSelected = computed(() => boxesIsSelected.value && !cardsIsSelected.value && !connectionsIsSelected.value)
const boxesIsSelected = computed(() => multipleBoxesSelectedIds.value.length > 0)
const boxes = computed(() => {
  const seletectBoxes = boxStore.getBoxesSelected
  prevBoxes = seletectBoxes
  return boxes
})
const editableBoxes = computed(() => {
  if (isSpaceMember.value) {
    return boxes.value
  } else {
    return boxes.value.filter(box => {
      return store.getters['currentUser/boxIsCreatedByCurrentUser'](box)
    })
  }
})

// split and merge

const splitCard = () => {
  // open card details and trigger the split from there
  const cardId = cards.value[0].id
  store.dispatch('clearMultipleSelected')
  store.dispatch('closeAllDialogs')
  store.commit('preventCardDetailsOpeningAnimation', true)
  store.commit('cardDetailsIsVisibleForCardId', cardId)
  store.commit('triggerSplitCard', cardId)
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
  store.dispatch('closeAllDialogs')
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
  const userCardBackgroundColor = store.state.currentUser.defaultCardBackgroundColor
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

const moreOptionsIsVisible = computed(() => store.state.currentUser.shouldShowMoreAlignOptions)
const shouldShowMultipleSelectedLineActions = computed(() => store.state.currentUser.shouldShowMultipleSelectedLineActions)
const shouldShowMultipleSelectedBoxActions = computed(() => store.state.currentUser.shouldShowMultipleSelectedBoxActions)
const toggleShouldShowMultipleSelectedLineActions = () => {
  closeDialogs()
  const isVisible = !shouldShowMultipleSelectedLineActions.value
  store.dispatch('currentUser/shouldShowMultipleSelectedLineActions', isVisible)
  nextTick(() => {
    scrollIntoView()
  })
}
const toggleShouldShowMultipleSelectedBoxActions = () => {
  closeDialogs()
  const isVisible = !shouldShowMultipleSelectedBoxActions.value
  store.dispatch('currentUser/shouldShowMultipleSelectedBoxActions', isVisible)
  nextTick(() => {
    scrollIntoView()
  })
}

// remove

const remove = ({ shouldRemoveCardsOnly }) => {
  store.dispatch('history/resume')
  const cardIds = editableCards.value.map(card => card.id)
  const connectionIds = editableConnections.value.map(connection => connection.id)
  cardStore.removeCards(cardIds)
  connectionStore.removeConnections(connectionIds)
  if (!shouldRemoveCardsOnly) {
    editableBoxes.value.forEach(box => boxStore.removeBox(box.id))
  }
  store.dispatch('closeAllDialogs')
  store.dispatch('clearMultipleSelected')
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
      ItemCheckboxButton(:boxes="boxes" :cards="cards" :isDisabled="!canEditAll.cards && !canEditAll.boxes")
      //- Connect
      button(v-if="multipleCardsIsSelected" :class="{active: state.cardsIsConnected}" @click.left.prevent="toggleConnectCards" @keydown.stop.enter="toggleConnectCards" :disabled="!canEditAll.cards" title="Connect/Disconnect Cards")
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

    CardOrBoxActions(:visible="cardsIsSelected" :cards="cards" @closeDialogs="closeDialogs" :backgroundColor="userColor")
    CardOrBoxActions(:labelIsVisible="true" :visible="(shouldShowMultipleSelectedBoxActions || onlyBoxesIsSelected) && boxesIsSelected" :boxes="boxes" @closeDialogs="closeDialogs" :backgroundColor="userColor")

      //- :class="{ 'last-row': !connectionsIsSelected }"

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
        button(@click.left.stop="toggleMoveItemsIsVisible" :class="{ active: state.moveItemsIsVisible }" :disabled="!canEditAll.cards")
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
