import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useUserNotificationStore } from '@/stores/useUserNotificationStore'

import store from '@/store/store.js' // TEMP Import Vuex store

import utils from '@/utils.js'
import cache from '@/cache.js'

import uniqBy from 'lodash-es/uniqBy'
import uniq from 'lodash-es/uniq'

export const useCardStore = defineStore('cards', {
  state: () => ({
    ids: [],
    groups: {} // {id, {group}}
  }),

  getters: {

    getAllGroups () {
      return this.ids.map(id => this.groups[id])
    },
    getIsCurrentSpaceGroupUser () {
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const groupId = spaceStore.groupId
      if (!groupId) { return }
      const group = this.getSpaceGroup
      if (!group) { return }
      const user = group.users.find(user => user.id === userStore.id)
      return Boolean(user)
    },
    getCurrentSpaceGroup () {
      const spaceStore = useSpaceStore()
      return this.groups[spaceStore.groupId]
    },
    getCurrentUserGroup () {
      const userStore = useUserStore()
      const groups = this.getAllGroups
      let groupUserGroups = groups.filter(group => {
        if (!group.users) { return }
        return group.users.find(groupUser => {
          const groupUserId = groupUser.id || groupUser.userId
          return groupUserId === userStore.id
        })
      })
      groupUserGroups = uniqBy(groupUserGroups, 'id')
      return groupUserGroups
    },

    getGroupUsersWhoAddedCards () {
      // TODO get all cards, get users, uniq by id, filter by users in current group
      return []
      // userIds: (state, getters) => {
      //   const cards = getters.all
      //   let users = []
      //   cards.forEach(card => {
      //     users.push(card.userId)
      //     users.push(card.nameUpdatedByUserId)
      //   })
      //   users = users.filter(user => Boolean(user))
      //   users = uniq(users)
      //   return users
      // },
      // users: (state, getters, rootState, rootGetters) => {
      //   let users = getters.userIds.map(id => {
      //     const user = rootGetters['currentSpace/userById'](id)
      //     return user
      //   })
      //   users = users.filter(user => Boolean(user))
      //   return users
      // },
      // groupUsersWhoAddedCards: (state, getters, rootState, rootGetters) => {
      //   const spaceGroup = groupStore.getCurrentSpaceGroup
      //   const groupUsers = spaceGroup?.users
      //   if (!groupUsers) { return }
      //   let users = getters.users
      //   users = users.filter(user => {
      //     const isGroupUser = groupUsers.find(groupUser => groupUser.id === user.id)
      //     return isGroupUser
      //   })
      //   return users
      // },
    }
  },

  actions: {

    getGroup (id) {
      return this.groups[id]
    },
    getGroupUser ({ userId, space, groupId }) {
      const spaceStore = useSpaceStore()
      let group
      if (groupId) {
        group = this.getGroup(groupId)
      } else {
        const currentSpace = spaceStore.getSpaceAllState
        space = space || currentSpace
        group = this.getCurrentSpaceGroup
      }
      if (!group) { return }
      return group.users.find(user => user.id === userId)
    },
    getGroupUserIsAdmin ({ userId, space, groupId }) {
      let groupUser
      if (groupId) {
        const group = this.getGroup(groupId)
        groupUser = group.users.find(user => user.id === userId)
      } else {
        groupUser = this.getGroupUser({ userId, space })
      }
      return groupUser?.role === 'admin'
    }

  }
})
