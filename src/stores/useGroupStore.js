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

// spaces can be in multiple groups
const spaceGroups = (groupStore, space) => {
  const spaceStore = useSpaceStore()
  space = space || { groups: spaceStore.groups }
  const groups = utils.spaceGroups(space)
  return groups.map(group => groupStore.groups[group.id] || group)
}
// the first group the user is in, of the groups the space is in
const spaceGroupUser = (groupStore, { userId, space }) => {
  const groups = spaceGroups(groupStore, space)
  for (const group of groups) {
    const groupUser = group.users?.find(user => user.id === userId)
    if (groupUser) { return groupUser }
  }
}

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
      const user = spaceGroupUser(this, { userId: userStore.id })
      return Boolean(user)
    },
    getCurrentSpaceGroups () {
      return spaceGroups(this)
    },
    getCurrentSpaceGroupUsers () {
      const groups = this.getCurrentSpaceGroups
      const users = groups.flatMap(group => group.users || [])
      return uniqBy(users, 'id')
    },
    getCurrentUserGroups () {
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
      const cardStore = useCardStore()
      const groupUsers = this.getCurrentSpaceGroupUsers
      if (!groupUsers.length) { return [] }
      const cards = cardStore.getAllCards
      if (!cards) { return }
      let userIds = []
      const users = []
      cards.forEach(card => {
        userIds.push(card.userId)
        userIds.push(card.nameUpdatedByUserId)
      })
      userIds = uniq(userIds)
      userIds = userIds.filter(id => Boolean(id))
      userIds.forEach(id => {
        const user = groupUsers.find(user => user.id === id)
        if (!user) { return }
        users.push(user)
      })
      return users || []
    }
  },
  actions: {

    getGroup (id) {
      return this.groups[id]
    },
    getSpaceGroups (space) {
      return spaceGroups(this, space)
    },
    getSpaceGroupUser ({ userId, space }) {
      return spaceGroupUser(this, { userId, space })
    },
    getGroupUser ({ userId, space, groupId }) {
      if (!groupId) {
        return this.getSpaceGroupUser({ userId, space })
      }
      const group = this.getGroup(groupId)
      if (!group) { return }
      return group.users?.find(user => user.id === userId)
    },
    getGroupUserIsAdmin ({ userId, space, groupId }) {
      if (groupId) {
        const groupUser = this.getGroupUser({ userId, groupId })
        return groupUser?.role === 'admin'
      }
      // admin of any of the space's groups
      const groups = spaceGroups(this, space)
      const isAdmin = groups.find(group => {
        const groupUser = group.users?.find(user => user.id === userId)
        return groupUser?.role === 'admin'
      })
      return Boolean(isAdmin)
    },

    // init

    async initializeGroups () {
      let groups = await cache.groups()
      groups = utils.denormalizeItems(groups)
      this.restoreGroups(groups)
      // remote groups restored in restoreRemoteUser
    },
    restoreGroups (groups) {
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

    async loadGroups (space) {
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const apiStore = useApiStore()
      const groups = utils.spaceGroups(space)
      if (!utils.arrayHasItems(groups)) { return }
      for (const group of groups) {
        this.update(group)
        const groupUser = this.getGroupUser({ userId: userStore.id, groupId: group.id })
        if (!groupUser) { continue }
        try {
          const remoteGroup = await apiStore.getGroup(group.id)
          this.update(remoteGroup)
        } catch (error) {
          console.error('🚒 loadGroup', error, group)
        }
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
    async upateGroupsFromRemote () {
      const globalStore = useGlobalStore()
      const apiStore = useApiStore()
      try {
        globalStore.isLoadingGroups = true
        const groups = await apiStore.getUserGroups()
        if (groups) {
          this.restoreGroups(groups)
        }
      } catch (error) {
        console.error('🚒 updateWithRemote', error)
      }
      globalStore.isLoadingGroups = false
    },

    // user

    async joinGroup () {
      const globalStore = useGlobalStore()
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const userId = userStore.id
      const group = globalStore.groupToJoinOnLoad
      if (!group.groupId) { return }
      globalStore.updateNotifyIsJoiningGroup(true)
      try {
        const response = await apiStore.createGroupUser({
          groupId: group.groupId,
          collaboratorKey: group.collaboratorKey,
          userId
        })
        globalStore.addNotification({
          message: 'Joined Group',
          type: 'success',
          isPersistentItem: true,
          group: response.group
        })
        globalStore.triggerSpaceDetailsVisible()
        this.update(response.group)
        console.info('👫 joined group', response.group)
        await this.upateGroupsFromRemote()
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
    getGroupInviteUrl (group) {
      if (!group.collaboratorKey) { return }
      const url = utils.groupInviteUrl({
        groupId: group.id,
        groupName: group.name,
        collaboratorKey: group.collaboratorKey
      })
      return url
    },

    // space

    async addSpaceToGroup (group) {
      const spaceStore = useSpaceStore()
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const userNotificationStore = useUserNotificationStore()
      const body = { groupId: group.id, addedToGroupByUserId: userStore.id, spaceId: spaceStore.id }
      let groups = this.getCurrentSpaceGroups
      groups = groups.concat(group)
      groups = uniqBy(groups, 'id')
      await spaceStore.updateGroupsLocal(groups)

      await apiStore.addToQueue({ name: 'addSpaceToGroup', body })
      await userNotificationStore.addSpaceToGroup(body)
    },
    async removeSpaceFromGroup (group) {
      const spaceStore = useSpaceStore()
      const apiStore = useApiStore()
      const body = { spaceId: spaceStore.id, groupId: group.id }
      let groups = this.getCurrentSpaceGroups.filter(spaceGroup => spaceGroup.id !== group.id)
      groups = uniqBy(groups, 'id')
      await spaceStore.updateGroupsLocal(groups)

      console.log('removeSpaceGroup', groups)
      await apiStore.addToQueue({ name: 'removeSpaceFromGroup', body })
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
