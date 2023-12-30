import utils from '@/utils.js'

import uniq from 'lodash-es/uniq'

let notifiedCardIds = []

export default {
  namespaced: true,
  actions: {

    // User

    addFavoriteUser: (context, favoriteUser) => {
      const userId = context.rootState.currentUser.id
      const recipientUserIds = [favoriteUser.id]
      const notification = {
        type: 'addFavoriteUser',
        userId,
        recipientUserIds
      }
      context.dispatch('api/addToQueue', { name: 'createUserNotification', body: notification }, { root: true })
    },
    removeFavoriteUser: (context, favoriteUser) => {
      const userId = context.rootState.currentUser.id
      const recipientUserIds = [favoriteUser.id]
      const notification = {
        type: 'removeFavoriteUser',
        userId,
        recipientUserIds
      }
      context.dispatch('api/addToQueue', { name: 'removeUserNotification', body: notification }, { root: true })
    },

    // Space

    addFavoriteSpace: (context, favoriteSpace) => {
      const userId = context.rootState.currentUser.id
      const recipientUserIds = context.getters.recipientUserIds
      const notification = {
        type: 'addFavoriteSpace',
        userId,
        recipientUserIds,
        spaceId: favoriteSpace.id
      }
      context.dispatch('api/addToQueue', { name: 'createUserNotification', body: notification }, { root: true })
    },
    removeFavoriteSpace: (context, favoriteSpace) => {
      const userId = context.rootState.currentUser.id
      const recipientUserIds = context.getters.recipientUserIds
      const notification = {
        type: 'removeFavoriteSpace',
        userId,
        recipientUserIds,
        spaceId: favoriteSpace.id
      }
      context.dispatch('api/addToQueue', { name: 'removeUserNotification', body: notification }, { root: true })
    },

    // Card

    addCardUpdated: (context, { cardId, type }) => {
      if (!cardId) { return }
      if (context.state.name === 'Hello Kinopio') { return }
      if (notifiedCardIds.includes(cardId)) { return }
      const userCanEdit = context.rootGetters['currentUser/canEditSpace']()
      if (!userCanEdit) { return }
      const userId = context.rootState.currentUser.id
      let recipientUserIds = context.getters.recipientUserIds
      if (!recipientUserIds.length) { return }
      const notification = {
        type, // 'createCard' or 'updateCard'
        cardId,
        userId,
        recipientUserIds,
        spaceId: context.state.id
      }
      context.dispatch('api/addToQueue', { name: 'createUserNotification', body: notification }, { root: true })
      notifiedCardIds.push(cardId)
    },

    // Ask to Add Space to Explore

    addAskToAddToExplore: (context) => {
      const userId = context.rootState.currentUser.id
      const spaceId = context.rootState.currentSpace.id
      let recipientUserIds = context.getters.recipientUserIds
      if (!recipientUserIds.length) { return }
      const notification = {
        type: 'askToAddToExplore',
        userId,
        spaceId,
        recipientUserIds
      }
      context.dispatch('api/addToQueue', { name: 'createUserNotification', body: notification }, { root: true })
    }

  },
  getters: {
    recipientUserIds: (state, getters, rootState, rootGetters) => {
      const currentUserId = rootState.currentUser.id
      const spaceIsOpen = rootState.currentSpace.privacy === 'open'
      let members = rootGetters['currentSpace/members'](true)
      members = members.map(member => member.id)
      let recipients = members
      if (spaceIsOpen) {
        let contributors = []
        contributors = rootState.currentSpace.cards.map(card => card.userId)
        recipients = members.concat(contributors)
      }
      recipients = uniq(recipients)
      // exclude currently connected recipients
      recipients = recipients.filter(userId => userId !== currentUserId)
      recipients = recipients.filter(userId => Boolean(userId))
      return recipients
    }
  }
}
