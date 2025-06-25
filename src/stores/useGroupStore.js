import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useCardStore } from '@/stores/useCardStore'
import { useApiStore } from '@/stores/useApiStore'
import { useUserNotificationStore } from '@/stores/useUserNotificationStore'

import { useGlobalStore } from '@/stores/useGlobalStore'

import utils from '@/utils.js'
import cache from '@/cache.js'

import uniqBy from 'lodash-es/uniqBy'
import uniq from 'lodash-es/uniq'

export const useGroupStore = defineStore('groups', {
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
      const group = this.groups[groupId]
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
      const spaceStore = useSpaceStore()
      const cardStore = useCardStore()
      const groupId = spaceStore.groupId
      const group = this.getGroup(groupId)
      console.log('🍇🍇🍇🍇gruop', group)

      if (!group) { return }
      const groupUserIds = group.users.map(user => user.id)
      let users = []
      const cards = cardStore.getAllCards
      console.log('🍇🍇🍇🍇cards', cards)
      if (!cards) { return }
      cards.forEach(card => {
        users.push(card.userId)
        users.push(card.nameUpdatedByUserId)
      })
      users = uniq(users)
      users = users.filter(user => Boolean(user))

      console.log('🐸🐸🐸🐸🐸🐸temp', group, groupUserIds, users)

      users = users.filter(user => groupUserIds.includes(user.id))
      return users
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
    },

    // init

    async initializeGroups () {
      let groups = await cache.groups()
      groups = utils.denormalizeItems(groups)
      this.restoreGroup(groups)
      // remote groups restored in restoreRemoteUser
    },
    restoreGroup (groups) {
      this.ids = []
      this.groups = {}
      const groupIds = []
      groups.forEach(group => {
        groupIds.push(group.id)
        this.groups[group.id] = group
      })
      this.ids = this.ids.concat(groupIds)
      console.info('👫 groups', this.groups)
      cache.saveGroups(this.groups)
    },

    // load

    async loadGroup (space) {
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const apiStore = useApiStore()
      spaceStore.updateGroupMeta(space)
      let group = space.group
      if (!group) { return }
      this.update(group)
      const groupUser = this.getGroupUser({ userId: userStore.id })
      if (!groupUser) { return }
      try {
        group = await apiStore.getGroup(group.id)
        this.update(group)
      } catch (error) {
        console.error('🚒 loadGroup', error, group)
      }
    },

    // create

    async createGroup (group) {
      const apiStore = useApiStore()
      try {
        const response = await apiStore.createGroup(group)
        const newGroup = response.group
        const groupUser = response.groupUser
        groupUser.id = groupUser.userId
        newGroup.groupUser = groupUser
        newGroup.users = [response.groupUser]
        this.groups[newGroup.id] = newGroup
        this.ids.unshift(newGroup.id)
        cache.saveGroups(this.groups)
      } catch (error) {
        console.error('🚒 createGroup', error, group)
      }
    },

    // update

    update (group) {
      if (!group?.id) {
        console.warn('🚑 could not update group', group)
        return
      }
      const prevGroup = this.groups[group.id]
      if (prevGroup) {
        const keys = Object.keys(group)
        const updatedGroup = utils.clone(prevGroup)
        keys.forEach(key => {
          updatedGroup[key] = group[key]
        })
        this.groups[group.id] = updatedGroup
      } else {
        this.ids.push(group.id)
        this.groups[group.id] = group
      }
      cache.saveGroups(this.groups)
    },
    async updateGroup (group) {
      const apiStore = useApiStore()
      this.update(group)
      await apiStore.addToQueue({ name: 'updateGroup', body: group })
    },
    async updateUserRole (update) {
      const apiStore = useApiStore()
      const { userId, groupId, role } = update
      let group = this.getGroup(groupId)
      group = utils.clone(group)
      group.users = group.users.map(user => {
        if (user.id === userId) {
          user.role = role
        }
        return user
      })
      this.update(group)
      await apiStore.addToQueue({ name: 'updateGroupUser', body: update })
    },
    async updateOtherGroups (otherGroup) {
      const apiStore = useApiStore()
      let group = this.getGroup(otherGroup.id)
      if (group) { return }
      group = await apiStore.getGroup(otherGroup.id)
      this.createGroup(group)
    },

    // user

    async joinGroup () {
      const globalStore = useGlobalStore()
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const userId = userStore.id
      const group = globalStore.groupToJoinOnLoad
      if (!group) { return }
      globalStore.updateNotifyIsJoiningGroup(true)
      try {
        const response = await apiStore.createGroupUser({
          groupId: group.groupId,
          collaboratorKey: group.collaboratorKey,
          userId
        })
        globalStore.addNotification({
          badge: 'Joined Group',
          message: `${response.group.name}`,
          type: 'success',
          isPersistentItem: true,
          group: response.group
        })
        globalStore.triggerSpaceDetailsVisible()
        this.update(response.group)
        console.info('👫 joined group', response.group)
      } catch (error) {
        console.error('🚒 joinGroup', error)
        globalStore.addNotification({
          message: 'Failed to Join Group',
          type: 'danger',
          icon: 'group',
          isPersistentItem: true
        })
      }
      globalStore.updateNotifyIsJoiningGroup(false)
      globalStore.groupToJoinOnLoad = null
    },
    removeGroupUser ({ groupId, userId }) {
      let group = this.getGroup(groupId)
      group = utils.clone(group)
      group.users = group.users.filter(user => user.id !== userId)
      const updatedGroup = {
        id: group.id,
        users: group.users
      }
      this.update(updatedGroup)
    },

    // space

    async addSpaceToGroup (group) {
      const spaceStore = useSpaceStore()
      const userStore = useUserStore()
      const userNotificationStore = useUserNotificationStore()
      const user = userStore
      const body = { groupId: group.id, addedToGroupByUserId: user.id }
      await spaceStore.updateSpace(body)
      await userNotificationStore.addSpaceToGroup(body)
    },
    async removeSpaceFromGroup () {
      const spaceStore = useSpaceStore()
      await spaceStore.updateSpace({ groupId: null, addedToGroupByUserId: null })
    },

    // remove

    async removeGroup (group) {
      const apiStore = useApiStore()
      await apiStore.deleteGroupPermanent(group)
      if (!group) { return }
      group = this.groups[group.id]
      if (!group) { return }
      let ids = utils.clone(this.ids)
      ids = ids.filter(id => id !== group.id)
      this.ids = ids
      delete this.groups[group.id]
      cache.saveGroups(this.groups)
    }

  }
})
