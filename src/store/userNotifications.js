import { useUserStore } from '@/stores/useUserStore'
import utils from '@/utils.js'

import uniq from 'lodash-es/uniq'

const notifiedCardIds = []

export default {
  namespaced: true,
  actions: {

    // User

    addFavoriteUser: async (context, favoriteUser) => {
      const userStore = useUserStore()
      const userId = userStore.id
      const recipientUserIds = [favoriteUser.id]
      const notification = {
        type: 'addFavoriteUser',
        userId,
        recipientUserIds
      }
      await context.dispatch('api/addToQueue', { name: 'createUserNotification', body: notification }, { root: true })
    },
    removeFavoriteUser: async (context, favoriteUser) => {
      const userStore = useUserStore()
      const userId = userStore.id
      const recipientUserIds = [favoriteUser.id]
      const notification = {
        type: 'removeFavoriteUser',
        userId,
        recipientUserIds
      }
      await context.dispatch('api/addToQueue', { name: 'removeUserNotification', body: notification }, { root: true })
    },

    // Space

    addFavoriteSpace: async (context, favoriteSpace) => {
      const userStore = useUserStore()
      const userId = userStore.id
      const recipientUserIds = context.getters.recipientMemberIds
      const notification = {
        type: 'addFavoriteSpace',
        userId,
        recipientUserIds,
        spaceId: favoriteSpace.id
      }
      await context.dispatch('api/addToQueue', { name: 'createUserNotification', body: notification }, { root: true })
    },
    removeFavoriteSpace: async (context, favoriteSpace) => {
      const userStore = useUserStore()
      const userId = userStore.id
      const recipientUserIds = context.getters.recipientUserIds
      const notification = {
        type: 'removeFavoriteSpace',
        userId,
        recipientUserIds,
        spaceId: favoriteSpace.id
      }
      await context.dispatch('api/addToQueue', { name: 'removeUserNotification', body: notification }, { root: true })
    },

    // Card

    addCardUpdated: async (context, { cardId, type }) => {
      const userStore = useUserStore()
      if (!cardId) { return }
      if (context.state.name === 'Hello Kinopio') { return }
      if (notifiedCardIds.includes(cardId)) { return }
      const userCanEdit = context.rootGetters['currentUser/canEditSpace']()
      if (!userCanEdit) { return }
      const userId = userStore.id
      const recipientUserIds = context.getters.recipientUserIds
      if (!recipientUserIds.length) { return }
      const notification = {
        type, // 'createCard' or 'updateCard'
        cardId,
        userId,
        recipientUserIds,
        spaceId: context.state.id
      }
      notifiedCardIds.push(cardId)
      await context.dispatch('api/addToQueue', { name: 'createUserNotification', body: notification }, { root: true })
    },

    // Group

    addSpaceToGroup: async (context, { groupId, addedToGroupByUserId }) => {
      const userCanEdit = context.rootGetters['currentUser/canEditSpace']()
      if (!userCanEdit) { return }
      const group = context.rootGetters['groups/byId'](groupId)
      // recipients are all other group users
      const recipients = group.users.filter(user => user.id !== addedToGroupByUserId)
      let recipientUserIds = recipients.map(recipient => recipient.id)
      recipientUserIds = uniq(recipientUserIds)
      if (!recipientUserIds.length) { return }
      const notification = {
        type: 'addSpaceToGroup',
        userId: addedToGroupByUserId,
        recipientUserIds,
        spaceId: context.state.id,
        groupId
      }
      await context.dispatch('api/addToQueue', { name: 'createUserNotification', body: notification }, { root: true })
    },

    // Ask to Add Space to Explore

    addAskToAddToExplore: async (context) => {
      const userStore = useUserStore()
      const userId = userStore.id
      const spaceId = context.rootState.currentSpace.id
      const recipientUserIds = context.getters.recipientUserIds
      if (!recipientUserIds.length) { return }
      const notification = {
        type: 'askToAddToExplore',
        userId,
        spaceId,
        recipientUserIds
      }
      await context.dispatch('api/addToQueue', { name: 'createUserNotification', body: notification }, { root: true })
    }

  },
  getters: {
    recipientUserIds: (state, getters, rootState, rootGetters) => {
      const userStore = useUserStore()
      const currentUserId = userStore.id
      const spaceIsOpen = rootState.currentSpace.privacy === 'open'
      // space members
      let members = rootGetters['currentSpace/members'](true)
      members = members.map(member => member.id)
      let recipients = members
      if (spaceIsOpen) {
        let contributors = []
        contributors = rootState.currentSpace.cards.map(card => card.userId)
        recipients = members.concat(contributors)
      }
      // group users who added cards
      let groupUsers = rootGetters['groups/groupUsersWhoAddedCards'] || []
      groupUsers = groupUsers.map(user => user.id)
      recipients = recipients.concat(groupUsers)
      recipients = uniq(recipients)
      // exclude currently connected recipients
      recipients = recipients.filter(userId => userId !== currentUserId)
      recipients = recipients.filter(userId => Boolean(userId))
      return recipients
    },
    recipientMemberIds: (state, getters, rootState, rootGetters) => {
      const userStore = useUserStore()
      const currentUserId = userStore.id
      // space members
      let members = rootGetters['currentSpace/members'](true)
      members = members.map(member => member.id)
      let recipients = members
      // group users who added cards
      let groupUsers = rootGetters['groups/groupUsersWhoAddedCards'] || []
      groupUsers = groupUsers.map(user => user.id)
      recipients = recipients.concat(groupUsers)
      recipients = uniq(recipients)
      // exclude currently connected recipients
      recipients = recipients.filter(userId => userId !== currentUserId)
      recipients = recipients.filter(userId => Boolean(userId))
      return recipients
    }
  }
}
