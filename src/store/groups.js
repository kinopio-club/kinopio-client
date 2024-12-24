import utils from '@/utils.js'
import cache from '@/cache.js'

import uniqBy from 'lodash-es/uniqBy'
import uniq from 'lodash-es/uniq'

// normalized state
// https://github.com/vuejs/vuejs.org/issues/1636

export default {
  namespaced: true,
  state: {
    ids: [],
    groups: {} // {id, {group}}
  },
  mutations: {

    // init

    clear: (state) => {
      state.ids = []
      state.groups = {}
    },
    restore: (state, groups) => {
      state.ids = []
      state.groups = {}
      let groupIds = []
      groups.forEach(group => {
        groupIds.push(group.id)
        state.groups[group.id] = group
      })
      state.ids = state.ids.concat(groupIds)
      console.log('👫 groups', state.groups)
      cache.saveGroups(state.groups)
    },

    // create

    create: (state, group) => {
      utils.typeCheck({ value: group, type: 'object' })
      state.groups[group.id] = group
      state.ids.push(group.id)
      cache.saveGroups(state.groups)
    },

    // update

    update: (state, group) => {
      if (!group.id) {
        console.warn('🚑 could not update group', group)
        return
      }
      const prevGroup = state.groups[group.id]
      if (prevGroup) {
        const keys = Object.keys(group)
        let updatedGroup = utils.clone(prevGroup)
        keys.forEach(key => {
          updatedGroup[key] = group[key]
        })
        state.groups[group.id] = updatedGroup
      } else {
        state.ids.push(group.id)
        state.groups[group.id] = group
      }
      cache.saveGroups(state.groups)
    },

    // remove

    remove: (state, groupToRemove) => {
      if (!groupToRemove) { return }
      const group = state.groups[groupToRemove.id]
      if (!group) { return }
      let ids = utils.clone(state.ids)
      ids = ids.filter(id => id !== group.id)
      state.ids = ids
      delete state.groups[groupToRemove.id]
      cache.saveGroups(state.groups)
    }
  },
  actions: {
    init: async (context) => {
      let groups = await cache.groups()
      groups = utils.denormalizeItems(groups)
      context.commit('restore', groups)
      // remote groups restored in restoreRemoteUser
    },
    restore: (context, groups) => {
      context.commit('restore', groups)
      context.commit('isLoadingGroups', false, { root: true })
    },
    createGroup: async (context, group) => {
      try {
        const response = await context.dispatch('api/createGroup', group, { root: true })
        let newGroup = response.group
        let groupUser = response.groupUser
        groupUser.id = groupUser.userId
        newGroup.groupUser = groupUser
        newGroup.users = [response.groupUser]
        context.commit('create', newGroup)
      } catch (error) {
        console.error('🚒 createGroup', error, group)
      }
    },
    loadGroup: async (context, space) => {
      context.commit('currentSpace/updateGroupMeta', space, { root: true })
      let group = space.group
      if (!group) { return }
      context.commit('update', group)
      const groupUser = context.getters.groupUser({ userId: context.rootState.currentUser.id })
      if (!groupUser) { return }
      try {
        group = await context.dispatch('api/getGroup', group.id, { root: true })
        context.commit('update', group)
      } catch (error) {
        console.error('🚒 loadGroup', error, group)
      }
    },
    joinGroup: async (context) => {
      const userId = context.rootState.currentUser.id
      const group = context.rootState.groupToJoinOnLoad
      if (!group) { return }
      context.commit('notifyIsJoiningGroup', true, { root: true })
      try {
        const response = await context.dispatch('api/createGroupUser', {
          groupId: group.groupId,
          collaboratorKey: group.collaboratorKey,
          userId
        }, { root: true })
        context.commit('addNotification', {
          badge: 'Joined Group',
          message: `${response.group.name}`,
          type: 'success',
          isPersistentItem: true,
          group: response.group
        }, { root: true })
        context.commit('triggerSpaceDetailsVisible', null, { root: true })
        context.commit('update', response.group)
        console.log('👫 joined group', response.group)
      } catch (error) {
        console.error('🚒 joinGroup', error)
        context.commit('addNotification', {
          message: `Failed to Join Group`,
          type: 'danger',
          icon: 'group',
          isPersistentItem: true
        }, { root: true })
      }
      context.commit('notifyIsJoiningGroup', false, { root: true })
      context.commit('groupToJoinOnLoad', null, { root: true })
    },
    update: async (context, group) => {
      context.commit('update', group)
      await context.dispatch('api/addToQueue', { name: 'updateGroup', body: group }, { root: true })
    },
    updateUserRole: async (context, update) => {
      const { userId, groupId, role } = update
      let group = context.getters.byId(groupId)
      group = utils.clone(group)
      group.users = group.users.map(user => {
        if (user.id === userId) {
          user.role = role
        }
        return user
      })
      context.commit('update', group)
      await context.dispatch('api/addToQueue', { name: 'updateGroupUser', body: update }, { root: true })
    },
    addCurrentSpace: async (context, group) => {
      const user = context.rootState.currentUser
      const body = { groupId: group.id, addedToGroupByUserId: user.id }
      await context.dispatch('currentSpace/updateSpace', body, { root: true })
      await context.dispatch('userNotifications/addSpaceToGroup', body, { root: true })
    },
    removeCurrentSpace: async (context) => {
      await context.dispatch('currentSpace/updateSpace', { groupId: null, addedToGroupByUserId: null }, { root: true })
    },
    removeGroupUser: (context, { groupId, userId }) => {
      let group = context.getters.byId(groupId)
      group = utils.clone(group)
      group.users = group.users.filter(user => user.id !== userId)
      const updatedGroup = {
        id: group.id,
        users: group.users
      }
      context.commit('update', updatedGroup)
    },
    updateOtherGroups: async (context, otherGroup) => {
      let group = context.getters.byId(otherGroup.id)
      if (group) { return }
      group = await context.dispatch('api/getGroup', otherGroup.id, { root: true })
      context.commit('create', group)
    },
    remove: async (context, group) => {
      await context.dispatch('api/deleteGroupPermanent', group, { root: true })
      context.commit('remove', group)
    }
  },
  getters: {
    byId: (state) => (id) => {
      return state.groups[id]
    },
    all: (state) => {
      return state.ids.map(id => state.groups[id])
    },
    byUser: (state, getters, rootState) => (user) => {
      user = user || rootState.currentUser
      const groups = getters.all
      let groupUserGroups = groups.filter(group => {
        if (!group.users) { return }
        return group.users.find(groupUser => {
          const groupUserId = groupUser.id || groupUser.userId
          return groupUserId === user.id
        })
      })
      groupUserGroups = uniqBy(groupUserGroups, 'id')
      return groupUserGroups
    },
    spaceGroup: (state, getters, rootState) => (space) => {
      const currentSpace = rootState.currentSpace
      space = space || currentSpace
      return state.groups[space.groupId]
    },
    groupUser: (state, getters, rootState) => ({ userId, space, groupId }) => {
      let group
      if (groupId) {
        group = getters.byId(groupId)
      } else {
        const currentSpace = rootState.currentSpace
        space = space || currentSpace
        group = getters.spaceGroup(space)
      }
      if (!group) { return }
      return group.users.find(user => user.id === userId)
    },
    currentUserIsCurrentSpaceGroupUser: (state, getters, rootState) => {
      const userId = rootState.currentUser.id
      const groupId = rootState.currentSpace.groupId
      if (!groupId) { return }
      const group = getters.spaceGroup()
      if (!group) { return }
      const user = group.users.find(user => user.id === userId)
      return Boolean(user)
    },
    groupUserIsAdmin: (state, getters, rootState) => ({ userId, space, groupId }) => {
      let groupUser
      if (groupId) {
        const group = getters.byId(groupId)
        groupUser = group.users.find(user => user.id === userId)
      } else {
        groupUser = getters.groupUser({ userId, space })
      }
      return groupUser?.role === 'admin'
    }
  }
}
