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
  copyCardsIsVisible: false,
  moveCardsIsVisible: false,
  cardsIsConnected: false,
  cardsHaveCheckboxes: false,
  cardsCheckboxIsChecked: false,
  shareCardIsVisible: false
})

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
    updatePinchCounterZoomDecimal()
    checkIsCardsConnected()
    store.dispatch('currentConnections/removeUnusedTypes')
    scrollIntoView()
    closeDialogs()
    store.dispatch('history/snapshots')
  } else {
    store.dispatch('history/resume')
    store.dispatch('history/add', { cards: prevCards, boxes: prevBoxes, useSnapshot: true })
  }
})

const isThemeDarkAndUserColorLight = computed(() => {
  const isThemeDark = store.state.currentUser.theme === 'dark'
  const userColorIsLight = !utils.colorIsDark(userColor.value)
  return isThemeDark && userColorIsLight
})
const maxCardLength = computed(() => consts.maxCardLength)
const userColor = computed(() => store.state.currentUser.color)
const spaceCounterZoomDecimal = computed(() => store.getters.spaceCounterZoomDecimal)
const pinchCounterZoomDecimal = computed(() => store.state.pinchCounterZoomDecimal)
const spaceZoomDecimal = computed(() => store.getters.spaceZoomDecimal)

const shouldShowMultipleSelectedItemActions = computed(() => store.state.currentUser.shouldShowMultipleSelectedItemActions)
const moreOptionsIsVisible = computed(() => store.state.currentUser.shouldShowMoreAlignOptions)

const oneCardOrMultipleBoxesIsSelected = computed(() => cards.value.length || boxes.value.length > 1)

// cards

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
  }
})

// connections

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

// all

const multipleCardOrBoxesIsSelected = computed(() => {
  const cards = multipleCardsIsSelected.value
  const boxes = multipleBoxesSelectedIds.value.length > 1
  return cards || boxes
})
const canEditAsNonMember = computed(() => {
  const spaceIsOpen = store.state.currentSpace.privacy === 'open'
  const isSpaceMember = store.getters['currentUser/isSpaceMember']()
  return spaceIsOpen && !isSpaceMember
})
const selectedItemsIsCreatedByCurrentUser = computed(() => {
  const { cards, connections, boxes } = numberOfSelectedItemsCreatedByCurrentUser.value
  const cardsByCurrentUser = cards === cards.value.length
  const connectionsByCurrentUser = connections === connections.value.length
  const boxesByCurrentUser = boxes === boxes.value.length
  if (cardsByCurrentUser && connectionsByCurrentUser && boxesByCurrentUser) {
    return true
  } else {
    return false
  }
})
const numberOfSelectedItemsCreatedByCurrentUser = computed(() => {
  // const connections = connections.value.filter(Boolean)
  // const cards = cards.value.filter(Boolean)
  // const boxes = boxes.value.filter(Boolean)
  const connectionsCreatedByCurrentUser = connections.value.filter(connection => {
    if (connection) { return }
    return store.getters['currentUser/connectionIsCreatedByCurrentUser'](connection)
  })
  const cardsCreatedByCurrentUser = cards.value.filter(card => {
    if (!card) { return }
    return store.getters['currentUser/cardIsCreatedByCurrentUser'](card)
  })
  const boxesCreatedByCurrentUser = boxes.value.filter(box => {
    if (!box) { return }
    return store.getters['currentUser/boxIsCreatedByCurrentUser'](box)
  })
  return {
    connections: connectionsCreatedByCurrentUser.length,
    cards: cardsCreatedByCurrentUser.length,
    boxes: boxesCreatedByCurrentUser.length
  }
})
const isSpaceMember = computed(() => store.getters['currentUser/isSpaceMember']())
const canEditAll = computed(() => {
  if (isSpaceMember.value) { return { cards: true, connections: true, all: true } }
  const cards = multipleCardsSelectedIds.value.length === numberOfSelectedItemsCreatedByCurrentUser.value.cards
  const connections = multipleConnectionsSelectedIds.value.length === numberOfSelectedItemsCreatedByCurrentUser.value.connections
  const boxes = multipleBoxesSelectedIds.value.length === numberOfSelectedItemsCreatedByCurrentUser.value.boxes
  const all = cards && connections && boxes
  return { cards, connections, boxes, all }
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
  // split names while > maxCardLength
  do {
    let newName = name.substring(0, maxCardLength.value)
    const lastSpace = newName.lastIndexOf(' ')
    const lastLineBreak = newName.lastIndexOf('\n')
    const shouldSplitByMaxLength = lastSpace === -1 && lastLineBreak === -1
    if (name.length < maxCardLength.value) {
      newName = name
      name = ''
    } else if (shouldSplitByMaxLength) {
      // newName = newName
      name = name.substring(maxCardLength.value)
    } else if (lastSpace >= lastLineBreak) {
      newName = name.substring(0, lastSpace)
      name = name.substring(lastSpace)
    } else {
      newName = name.substring(0, lastLineBreak)
      name = name.substring(lastLineBreak)
    }
    newNames.push(newName)
  } while (name.length > maxCardLength.value)

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
const toggleCopyCardsIsVisible = () => {
  const isVisible = state.copyCardsIsVisible
  closeDialogs()
  state.copyCardsIsVisible = !isVisible
}
const toggleMoveCardsIsVisible = () => {
  const isVisible = state.moveCardsIsVisible
  closeDialogs()
  state.moveCardsIsVisible = !isVisible
}
const toggleShareCardIsVisible = () => {
  const isVisible = state.shareCardIsVisible
  closeDialogs()
  state.shareCardIsVisible = !isVisible
}
const toggleShouldShowMultipleSelectedCardActions = () => {
  closeDialogs()
  const isVisible = !shouldShowMultipleSelectedItemActions.value
  store.dispatch('currentUser/shouldShowMultipleSelectedItemActions', isVisible)
  nextTick(() => {
    scrollIntoView()
  })
}
const toggleShouldShowMultipleSelectedLineActions = () => {
  closeDialogs()
  const isVisible = !shouldShowMultipleSelectedItemActions.value
  store.dispatch('currentUser/shouldShowMultipleSelectedItemActions', isVisible)
  nextTick(() => {
    scrollIntoView()
  })
}
const closeDialogs = () => {
  state.copyCardsIsVisible = false
  state.moveCardsIsVisible = false
  state.shareCardIsVisible = false
  store.commit('triggerCloseChildDialogs')
}
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
const connectionAlreadyExists = (startCardId, endCardId) => {
  const connections = store.getters['currentConnections/all']
  const existingConnection = connections.find(connection => {
    const isStart = connection.startCardId === startCardId
    const isEnd = connection.endCardId === endCardId
    return isStart && isEnd
  })
  return Boolean(existingConnection)
}
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
const addCheckboxToCards = () => {
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
}
const checkIsCardsConnected = () => {
  const selectedCards = multipleCardsSelectedIds.value
  const connections = selectedCards.filter((cardId, index) => {
    const startCardId = selectedCards[index - 1]
    const endCardId = cardId
    const connectionExists = connectionAlreadyExists(startCardId, endCardId)
    const connectionExistsReverse = connectionAlreadyExists(endCardId, startCardId)
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
      const startCardId = cardId
      const endCardId = cardIds[index + 1]
      if (connectionAlreadyExists(startCardId, endCardId)) { return }
      const id = nanoid()
      const path = store.getters['currentConnections/connectionPathBetweenCards'](startCardId, endCardId)
      return {
        id, startCardId, endCardId, path
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
const scrollIntoView = () => {
  const element = dialogElement.value
  utils.scrollIntoView({ element })
}
const updatePinchCounterZoomDecimal = () => {
  store.commit('pinchCounterZoomDecimal', utils.pinchCounterZoomDecimal())
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
    .row
      //- [·]
      .button-wrap.cards-checkboxes(v-if="cardsIsSelected" :class="{ disabled: !canEditAll.cards }")
        label(v-if="state.cardsHaveCheckboxes" :class="{active: state.cardsCheckboxIsChecked}" tabindex="0")
          input(type="checkbox" v-model="cardCheckboxes" tabindex="-1")
        label(v-if="!state.cardsHaveCheckboxes" @click.left.prevent="addCheckboxToCards" @keydown.stop.enter="addCheckboxToCards" tabindex="0")
          input.add(type="checkbox" tabindex="-1")
      //- Connect
      button(v-if="multipleCardsIsSelected" :class="{active: state.cardsIsConnected}" @click.left.prevent="toggleConnectCards" @keydown.stop.enter="toggleConnectCards" :disabled="!canEditAll.cards" title="Connect Cards")
        img.icon.connect-cards(src="@/assets/connect-cards.svg")
      //- Share Card
      .button-wrap(v-if="oneCardIsSelected" @click.left.stop="toggleShareCardIsVisible")
        button(:class="{active: state.shareCardIsVisible}")
          span Share
        ShareCard(:visible="state.shareCardIsVisible" :card="cards[0]")

      //- CARD Options
      .button-wrap.more-options-button(v-if="cardsIsSelected")
        button(:disabled="!canEditAll.cards && !canEditAll.boxes" @click.left.stop="toggleShouldShowMultipleSelectedCardActions" :class="{active : shouldShowMultipleSelectedItemActions}")
          span.subsection-label CARD
          img.icon.down-arrow.button-down-arrow(src="@/assets/down-arrow.svg")
      //- LINE Options
      .button-wrap.more-options-button(v-if="connectionsIsSelected")
        button(:disabled="!canEditAll.cards && !canEditAll.boxes" @click.left.stop="toggleShouldShowMultipleSelectedLineActions" :class="{active : shouldShowMultipleSelectedItemActions}")
          span.subsection-label LINE
          img.icon.down-arrow.button-down-arrow(src="@/assets/down-arrow.svg")

    CardOrBoxActions(:visible="shouldShowMultipleSelectedItemActions && (cardsIsSelected || boxesIsSelected)" :cards="cards" :boxes="boxes" @closeDialogs="closeDialogs" :class="{ 'last-row': !connectionsIsSelected }" :backgroundColor="userColor" :labelIsVisible="true")
    ConnectionActions(:visible="shouldShowMultipleSelectedItemActions && connectionsIsSelected" :connections="editableConnections" @closeDialogs="closeDialogs" :canEditAll="canEditAll" :backgroundColor="userColor")

  section
    template(v-if="oneCardOrMultipleBoxesIsSelected")
      .row
        //- Align And Distribute
        AlignAndDistribute(:visible="multipleCardOrBoxesIsSelected" :shouldHideMoreOptions="true" :shouldDistributeWithAlign="true" :numberOfSelectedItemsCreatedByCurrentUser="numberOfSelectedItemsCreatedByCurrentUser" :canEditAll="canEditAll" :cards="cards" :editableCards="cards" :connections="connections" :boxes="boxes" :editableBoxes="editableBoxes")
        //- Move/Copy
        .segmented-buttons.move-or-copy-wrap(v-if="cardsIsSelected")
          button(@click.left.stop="toggleCopyCardsIsVisible" :class="{ active: state.copyCardsIsVisible }")
            span Copy
            MoveOrCopyItems(:visible="state.copyCardsIsVisible" :actionIsMove="false")
          button(@click.left.stop="toggleMoveCardsIsVisible" :class="{ active: state.moveCardsIsVisible }" :disabled="!canEditAll.cards")
            span Move
            MoveOrCopyItems(:visible="state.moveCardsIsVisible" :actionIsMove="true")
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

    p.badge.info(v-if="canEditAsNonMember && !selectedItemsIsCreatedByCurrentUser")
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
  .connect-cards
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

  .subsection-label
    position absolute
    top 5px
    left 0
    width 100%
    text-align center
    font-size 11px
  .more-options-button
    button
      position relative
      padding 5px 14px
    .button-down-arrow
      transform translateY(6px)
</style>
