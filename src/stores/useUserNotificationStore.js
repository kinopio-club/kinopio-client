import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useGroupStore } from '@/stores/useGroupStore'

import { useGlobalStore } from '@/stores/useGlobalStore'

import utils from '@/utils.js'
import uniq from 'lodash-es/uniq'

const notifiedCardIds = []

export const useUserNotificationStore = defineStore('userNotifications', {

  getters: {
    recipientUserIds () {
      try {
        const userStore = useUserStore()
        const spaceStore = useSpaceStore()
        const groupStore = useGroupStore()
        const cardStore = useCardStore()
        const currentUserId = userStore.id
        const spaceIsOpen = spaceStore.privacy === 'open'
        // space members
        let members = spaceStore.getSpaceMembers
        members = utils.excludeCurrentUser(members, userStore.id)
        members = members.map(member => member.id)
        let recipients = members
        if (spaceIsOpen) {
          let contributors = []
          contributors = cardStore.getAllCards.map(card => card.userId)
          recipients = members.concat(contributors)
        }
        // group users who added cards
        let groupUsers = groupStore.getGroupUsersWhoAddedCards
        groupUsers = groupUsers.map(user => user.id)
        recipients = recipients.concat(groupUsers)
        recipients = uniq(recipients)
        // exclude currently connected recipients
        recipients = recipients.filter(userId => userId !== currentUserId)
        recipients = recipients.filter(userId => Boolean(userId))
        return recipients
      } catch (error) {
        console.error('🚑 recipientUserIds', error)
      }
    },
    recipientMemberIds () {
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const groupStore = useGroupStore()
      const currentUserId = userStore.id
      // space members
      let members = spaceStore.getSpaceMembers
      members = utils.excludeCurrentUser(members, userStore.id)
      members = members.map(member => member.id)
      let recipients = members
      // group users who added cards
      let groupUsers = groupStore.getGroupUsersWhoAddedCards || []
      groupUsers = groupUsers.map(user => user.id)
      recipients = recipients.concat(groupUsers)
      recipients = uniq(recipients)
      // exclude currently connected recipients
      recipients = recipients.filter(userId => userId !== currentUserId)
      recipients = recipients.filter(userId => Boolean(userId))
      return recipients
    }
  },

  actions: {

    // User

    async addFavoriteUser (favoriteUser) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const userId = userStore.id
      const recipientUserIds = [favoriteUser.id]
      const notification = {
        type: 'addFavoriteUser',
        userId,
        recipientUserIds
      }
      await apiStore.addToQueue({ name: 'createUserNotification', body: notification })
    },
    async removeFavoriteUser (favoriteUser) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const userId = userStore.id
      const recipientUserIds = [favoriteUser.id]
      const notification = {
        type: 'removeFavoriteUser',
        userId,
        recipientUserIds
      }
      await apiStore.addToQueue({ name: 'removeUserNotification', body: notification })
    },

    // Space

    async addFavoriteSpace (favoriteSpace) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const userId = userStore.id
      const recipientUserIds = this.recipientMemberIds
      const notification = {
        type: 'addFavoriteSpace',
        userId,
        recipientUserIds,
        spaceId: favoriteSpace.id
      }
      await apiStore.addToQueue({ name: 'createUserNotification', body: notification })
    },
    async removeFavoriteSpace (favoriteSpace) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const userId = userStore.id
      const recipientUserIds = this.recipientUserIds
      const notification = {
        type: 'removeFavoriteSpace',
        userId,
        recipientUserIds,
        spaceId: favoriteSpace.id
      }
      await apiStore.addToQueue({ name: 'removeUserNotification', body: notification })
    },

    // Card

    async addCardUpdated ({ cardId, type }) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      if (!cardId) { return }
      if (spaceStore.name === 'Hello Kinopio') { return }
      if (notifiedCardIds.includes(cardId)) { return }
      const userCanEdit = userStore.getUserCanEditSpace
      if (!userCanEdit) { return }
      const userId = userStore.id
      const recipientUserIds = this.recipientUserIds
      if (!recipientUserIds.length) { return }
      const notification = {
        type, // 'createCard' or 'updateCard'
        cardId,
        userId,
        recipientUserIds,
        spaceId: spaceStore.id
      }
      notifiedCardIds.push(cardId)
      await apiStore.addToQueue({ name: 'createUserNotification', body: notification })
    },

    // Group

    async addSpaceToGroup ({ groupId, addedToGroupByUserId }) {
      const apiStore = useApiStore()
      const spaceStore = useSpaceStore()
      const userStore = useUserStore()
      const groupStore = useGroupStore()
      const userCanEdit = userStore.getUserCanEditSpace
      if (!userCanEdit) { return }
      const group = groupStore.getGroup(groupId)
      // recipients are all other group users
      const recipients = group.users.filter(user => user.id !== addedToGroupByUserId)
      let recipientUserIds = recipients.map(recipient => recipient.id)
      recipientUserIds = uniq(recipientUserIds)
      if (!recipientUserIds.length) { return }
      const notification = {
        type: 'addSpaceToGroup',
        userId: addedToGroupByUserId,
        recipientUserIds,
        spaceId: spaceStore.id,
        groupId
      }
      await apiStore.addToQueue({ name: 'createUserNotification', body: notification })
    },

    // Ask to Add Space to Explore

    async addAskToAddToExplore () {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const userId = userStore.id
      const spaceId = spaceStore.id
      const recipientUserIds = this.recipientUserIds
      if (!recipientUserIds.length) { return }
      const notification = {
        type: 'askToAddToExplore',
        userId,
        spaceId,
        recipientUserIds
      }
      await apiStore.addToQueue({ name: 'createUserNotification', body: notification, allowNonMember: true })
    }

  }
})
