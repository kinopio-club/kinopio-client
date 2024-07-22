<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import MoveOrCopyItems from '@/components/dialogs/MoveOrCopyItems.vue'
import CardOrBoxActions from '@/components/subsections/CardOrBoxActions.vue'
import ConnectionActions from '@/components/subsections/ConnectionActions.vue'
import AlignAndDistribute from '@/components/AlignAndDistribute.vue'
import ShareCard from '@/components/dialogs/ShareCard.vue'

import { nanoid } from 'nanoid'
import last from 'lodash-es/last'
import consts from '@/consts.js'

const store = useStore()

const dialogElement = ref(null)

let prevCards, prevBoxes

const state = reactive({
  copyItemsIsVisible: false,
  moveItemsIsVisible: false,
  cardsIsConnected: false,
  cardsHaveCheckboxes: false,
  cardsCheckboxIsChecked: false,
  shareCardIsVisible: false
})

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
    checkCardsHaveCheckboxes()
    checkCardsCheckboxIsChecked()
    await nextTick()
    store.commit('pinchCounterZoomDecimal', utils.pinchCounterZoomDecimal())
    checkIsCardsConnected()
    scrollIntoView()
    closeDialogs()
    store.dispatch('history/snapshots')
  } else {
    store.dispatch('history/resume')
    store.dispatch('history/add', { cards: prevCards, boxes: prevBoxes, useSnapshot: true })
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
const maxCardCharacterLimit = computed(() => consts.defaultCharacterLimit)
const userColor = computed(() => store.state.currentUser.color)
const spaceCounterZoomDecimal = computed(() => store.getters.spaceCounterZoomDecimal)
const pinchCounterZoomDecimal = computed(() => store.state.pinchCounterZoomDecimal)
const spaceZoomDecimal = computed(() => store.getters.spaceZoomDecimal)

const shouldShowMultipleSelectedCardActions = computed(() => store.state.currentUser.shouldShowMultipleSelectedCardActions)
const shouldShowMultipleSelectedLineActions = computed(() => store.state.currentUser.shouldShowMultipleSelectedLineActions)
const moreOptionsIsVisible = computed(() => store.state.currentUser.shouldShowMoreAlignOptions)

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
    return store.getters['currentCards/byId'](cardId)
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
const updateDimensionsAndPaths = async () => {
  store.dispatch('currentCards/updateDimensions', { cards: cards.value })
  await nextTick()
  await nextTick()
  store.dispatch('currentConnections/updateMultiplePaths', cards.value)
}

// card checkboxes

const cardCheckboxes = computed({
  get () {
    return state.cardsCheckboxIsChecked
  },
  set (value) {
    if (state.cardsCheckboxIsChecked) {
      cards.value.forEach(card => {
        store.dispatch('currentCards/removeChecked', card.id)
      })
    } else {
      cards.value.forEach(card => {
        store.dispatch('currentCards/toggleChecked', { cardId: card.id, value })
      })
    }
    checkCardsHaveCheckboxes()
    checkCardsCheckboxIsChecked()
    updateDimensionsAndPaths()
  }
})
const checkCardsHaveCheckboxes = () => {
  const cardsWithCheckboxes = cards.value.filter(card => {
    if (!card) { return }
    return utils.checkboxFromString(card.name)
  })
  state.cardsHaveCheckboxes = cardsWithCheckboxes.length === cards.value.length
}
const checkCardsCheckboxIsChecked = () => {
  const cardsChecked = cards.value.filter(card => utils.nameIsChecked(card.name))
  state.cardsCheckboxIsChecked = cardsChecked.length === cards.value.length
}
const addCheckboxToCards = async () => {
  let updatedCards = []
  cards.value.forEach(card => {
    if (!utils.checkboxFromString(card.name)) {
      const update = {
        id: card.id,
        name: `[] ${card.name}`
      }
      updatedCards.push(update)
    }
  })
  store.dispatch('currentCards/updateMultiple', updatedCards)
  state.cardsHaveCheckboxes = true
  updateDimensionsAndPaths()
}

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
      const path = store.getters['currentConnections/connectionPathBetweenItems']({ startItemId, endItemId })
      return {
        id, startItemId, endItemId, path
      }
    }
  })
  connections = connections.filter(Boolean)
  const type = connectionType(event)
  connections.forEach(connection => {
    store.dispatch('currentConnections/add', { connection, type })
    store.dispatch('addToMultipleConnectionsSelected', connection.id)
  })
}
const disconnectCards = () => {
  const cardIds = multipleCardsSelectedIds.value
  cardIds.forEach(cardId => {
    store.dispatch('currentConnections/removeFromSelectedCard', cardId)
  })
  store.dispatch('currentConnections/removeUnusedTypes')
}

// connections

const moreLineOptionsLabel = computed(() => {
  console.log(multipleConnectionsSelectedIds.value)
  if (multipleConnectionsSelectedIds.value.length > 1) {
    return 'LINES'
  } else {
    return 'LINE'
  }
})
const onlyConnectionsIsSelected = computed(() => connectionsIsSelected.value && !cardsIsSelected.value)
const connectionsIsSelected = computed(() => Boolean(multipleConnectionsSelectedIds.value.length))
const connections = computed(() => {
  let connections = multipleConnectionsSelectedIds.value.map(id => {
    return store.getters['currentConnections/byId'](id)
  })
  connections = connections.filter(connection => Boolean(connection))
  return connections
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
  let connectionType = last(store.getters['currentConnections/allTypes'])
  const shouldUseLastConnectionType = store.state.currentUser.shouldUseLastConnectionType
  const shiftKey = event.shiftKey
  const shouldAddType = !connectionType || (shouldUseLastConnectionType && shiftKey) || (!shouldUseLastConnectionType && !shiftKey)
  if (shouldAddType) {
    store.dispatch('currentConnections/addType')
  }
  connectionType = last(store.getters['currentConnections/allTypes'])
  return connectionType
}
const connectionAlreadyExists = (startItemId, endItemId) => {
  const connections = store.getters['currentConnections/all']
  const existingConnection = connections.find(connection => {
    const isStart = connection.startItemId === startItemId
    const isEnd = connection.endItemId === endItemId
    return isStart && isEnd
  })
  return Boolean(existingConnection)
}

// boxes

const boxesIsSelected = computed(() => multipleBoxesSelectedIds.value.length > 0)
const boxes = computed(() => {
  let boxes = multipleBoxesSelectedIds.value.map(boxId => {
    return store.getters['currentBoxes/byId'](boxId)
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
    const element = document.querySelector(`article [data-card-id="${prevCard.id}"]`)
    const prevCardRect = element.getBoundingClientRect()
    card.y = prevCard.y + (prevCardRect.height * spaceCounterZoomDecimal.value) + spaceBetweenCards
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
  store.dispatch('currentCards/updateMultiple', newCards)
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
  let newNames = []
  // split names while > maxCardCharacterLimit
  do {
    let newName = name.substring(0, maxCardCharacterLimit.value)
    const lastSpace = newName.lastIndexOf(' ')
    const lastLineBreak = newName.lastIndexOf('\n')
    const shouldSplitByMaxLength = lastSpace === -1 && lastLineBreak === -1
    if (name.length < maxCardCharacterLimit.value) {
      newName = name
      name = ''
    } else if (shouldSplitByMaxLength) {
      // newName = newName
      name = name.substring(maxCardCharacterLimit.value)
    } else if (lastSpace >= lastLineBreak) {
      newName = name.substring(0, lastSpace)
      name = name.substring(lastSpace)
    } else {
      newName = name.substring(0, lastLineBreak)
      name = name.substring(lastLineBreak)
    }
    newNames.push(newName)
  } while (name.length > maxCardCharacterLimit.value)

  newNames.push(name)
  newNames = newNames.filter(name => Boolean(name))
  let position = { x: cards[0].x, y: cards[0].y }
  let newCards = []
  remove({ shouldRemoveCardsOnly: true })
  // create merged cards
  newNames.forEach((newName, index) => {
    let newCard = {
      id: nanoid(),
      name: newName,
      x: position.x,
      y: position.y,
      ...urlPreview
    }
    newCards.push(newCard)
  })
  store.dispatch('currentCards/addMultiple', { cards: newCards })
  prevCards = newCards // for history
  positionNewCards(newCards)
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

const toggleShouldShowMultipleSelectedLineActions = () => {
  closeDialogs()
  const isVisible = !shouldShowMultipleSelectedLineActions.value
  store.dispatch('currentUser/shouldShowMultipleSelectedLineActions', isVisible)
  nextTick(() => {
    scrollIntoView()
  })
}

// remove

const remove = ({ shouldRemoveCardsOnly }) => {
  store.dispatch('history/resume')
  editableConnections.value.forEach(connection => store.dispatch('currentConnections/remove', connection))
  editableCards.value.forEach(card => store.dispatch('currentCards/remove', card))
  if (!shouldRemoveCardsOnly) {
    editableBoxes.value.forEach(box => store.dispatch('currentBoxes/remove', box))
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
)
  .dark-theme-background-layer(v-if="isThemeDarkAndUserColorLight")
  section
    //- Edit Cards
    .row(v-if="cardsIsSelected")
      //- [·]
      .button-wrap.cards-checkboxes(:class="{ disabled: !canEditAll.cards }" title="Card Checkboxes")
        label.fixed-height(v-if="state.cardsHaveCheckboxes" :class="{active: state.cardsCheckboxIsChecked}" tabindex="0")
          input(type="checkbox" v-model="cardCheckboxes" tabindex="-1")
        label(v-if="!state.cardsHaveCheckboxes" @click.left.prevent="addCheckboxToCards" @keydown.stop.enter="addCheckboxToCards" tabindex="0")
          input.add(type="checkbox" tabindex="-1")
      //- Connect
      button(v-if="multipleCardsIsSelected" :class="{active: state.cardsIsConnected}" @click.left.prevent="toggleConnectCards" @keydown.stop.enter="toggleConnectCards" :disabled="!canEditAll.cards" title="Connect/Disconnect Cards")
        img.connector-icon.icon(src="@/assets/connector-closed.svg" v-if="state.cardsIsConnected")
        img.connector-icon.icon(src="@/assets/connector-open.svg" v-else)
        span Connect
      //- Share Card
      //- .button-wrap(v-if="oneCardIsSelected" @click.left.stop="toggleShareCardIsVisible")
      //-   button(:class="{active: state.shareCardIsVisible}")
      //-     span Share
      //-   ShareCard(:visible="state.shareCardIsVisible" :card="cards[0]")

      //- LINE Options
      .button-wrap(v-if="connectionsIsSelected && !onlyConnectionsIsSelected")
        button(:disabled="!canEditAll.cards && !canEditAll.boxes" @click.left.stop="toggleShouldShowMultipleSelectedLineActions" :class="{active : shouldShowMultipleSelectedLineActions}" title="More Line Options")
          span Line
          img.icon.down-arrow(src="@/assets/down-arrow.svg")

    CardOrBoxActions(:visible="cardsIsSelected || boxesIsSelected" :cards="cards" :boxes="boxes" @closeDialogs="closeDialogs" :class="{ 'last-row': !connectionsIsSelected }" :backgroundColor="userColor")
    ConnectionActions(:visible="(shouldShowMultipleSelectedLineActions || onlyConnectionsIsSelected) && connectionsIsSelected" :connections="editableConnections" @closeDialogs="closeDialogs" :canEditAll="canEditAll" :backgroundColor="userColor" :label="moreLineOptionsLabel")

  section
    template(v-if="cardOrBoxIsSelected")
      .row
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
      //- Merge
      button(v-if="multipleCardsIsSelected" @click="mergeSelectedCards" :disabled="!canEditAll.cards")
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
  .cards-checkboxes
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
</style>
