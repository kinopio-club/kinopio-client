import utils from '@/utils.js'

import uniqBy from 'lodash-es/uniqBy'

// normalized state
// https://github.com/vuejs/vuejs.org/issues/1636

export default {
  namespaced: true,
  state: {
    ids: [],
    teams: {} // {id, {team}}
  },
  mutations: {

    // init

    clear: (state) => {
      state.ids = []
      state.teams = {}
    },
    restore: (state, teams) => {
      let teamIds = []
      teams.forEach(team => {
        teamIds.push(team.id)
        state.teams[team.id] = team
      })
      state.ids = state.ids.concat(teamIds)
      console.log('👫 teams', state.teams)
    },

    // create

    create: (state, team) => {
      utils.typeCheck({ value: team, type: 'object' })
      state.teams[team.id] = team
      state.ids.push(team.id)
      console.log('👫 teams', state.teams)
    },

    // update

    update: (state, team) => {
      if (!team.id) {
        console.warn('🚑 could not update team', team)
        return
      }
      const prevTeam = state.teams[team.id]
      if (prevTeam) {
        const keys = Object.keys(team)
        let updatedTeam = utils.clone(prevTeam)
        keys.forEach(key => {
          updatedTeam[key] = team[key]
        })
        state.teams[team.id] = updatedTeam
      } else {
        state.ids.push(team.id)
        state.teams[team.id] = team
      }
    }
  },
  actions: {
    createTeam: async (context, team) => {
      try {
        const response = await context.dispatch('api/createTeam', team, { root: true })
        let newTeam = response.team
        let teamUser = response.teamUser
        teamUser.id = teamUser.userId
        newTeam.teamUser = teamUser
        newTeam.users = [response.teamUser]
        context.commit('create', newTeam)
      } catch (error) {
        console.error('🚒 createTeam', error, team)
      }
    },
    loadTeam: async (context, space) => {
      context.commit('currentSpace/updateTeamMeta', space, { root: true })
      let team = space.team
      if (!team) { return }
      context.commit('update', team)
      const teamUser = context.getters.teamUser({ userId: context.rootState.currentUser.id })
      if (!teamUser) { return }
      try {
        team = await context.dispatch('api/getTeam', team.id, { root: true })
        context.commit('update', team)
      } catch (error) {
        console.error('🚒 loadTeam', error, team)
      }
    },
    joinTeam: async (context) => {
      const userId = context.rootState.currentUser.id
      const team = context.rootState.teamToJoinOnLoad
      if (!team) { return }
      context.commit('notifyIsJoiningTeam', true, { root: true })
      try {
        const response = await context.dispatch('api/createTeamUser', {
          teamId: team.teamId,
          collaboratorKey: team.collaboratorKey,
          userId
        }, { root: true })
        context.commit('addNotification', {
          message: `Joined ${response.team.name}`,
          type: 'success',
          isPersistentItem: true,
          team: response.team
        }, { root: true })
      } catch (error) {
        console.error('🚒 joinTeam', error)
        context.commit('addNotification', {
          message: `Failed to Join Team`,
          type: 'danger',
          icon: 'team',
          isPersistentItem: true
        }, { root: true })
      }
      context.commit('notifyIsJoiningTeam', false, { root: true })
      context.commit('teamToJoinOnLoad', null, { root: true })
    },
    update: (context, team) => {
      context.commit('update', team)
      context.dispatch('api/addToQueue', { name: 'updateTeam', body: team }, { root: true })
    },
    updateUserRole: (context, update) => {
      const { userId, teamId, role } = update
      let team = context.getters.byId(teamId)
      team = utils.clone(team)
      team.users = team.users.map(user => {
        if (user.id === userId) {
          user.role = role
        }
        return user
      })
      context.commit('update', team)
      context.dispatch('api/addToQueue', { name: 'updateTeamUser', body: update }, { root: true })
    },
    addCurrentSpace: (context, team) => {
      const user = context.rootState.currentUser
      context.dispatch('currentSpace/updateSpace', { teamId: team.id, addedToTeamByUserId: user.id }, { root: true })
    },
    removeCurrentSpace: (context) => {
      context.dispatch('currentSpace/updateSpace', { teamId: null, addedToTeamByUserId: null }, { root: true })
    },
    removeTeamUser: (context, { teamId, userId }) => {
      let team = context.getters.byId(teamId)
      team = utils.clone(team)
      team.users = team.users.filter(user => user.id !== userId)
      const updatedTeam = {
        id: team.id,
        users: team.users
      }
      context.commit('update', updatedTeam)
    }
  },
  getters: {
    byId: (state) => (id) => {
      return state.teams[id]
    },
    all: (state) => {
      return state.ids.map(id => state.teams[id])
    },
    byUser: (state, getters, rootState) => (user) => {
      user = user || rootState.currentUser
      const teams = getters.all
      let teamUserTeams = teams.filter(team => {
        return team.users.find(teamUser => {
          const teamUserId = teamUser.id || teamUser.userId
          return teamUserId === user.id
        })
      })
      teamUserTeams = uniqBy(teamUserTeams, 'id')
      return teamUserTeams
    },
    spaceTeam: (state, getters, rootState) => (space) => {
      const currentSpace = rootState.currentSpace
      space = space || currentSpace
      return state.teams[space.teamId]
    },
    teamUser: (state, getters, rootState) => ({ userId, space, teamId }) => {
      let team
      if (teamId) {
        team = getters.byId(teamId)
      } else {
        const currentSpace = rootState.currentSpace
        space = space || currentSpace
        team = getters.spaceTeam(space)
      }
      if (!team) { return }
      return team.users.find(user => user.id === userId)
    },
    teamUserIsAdmin: (state, getters, rootState) => ({ userId, space, teamId }) => {
      let teamUser
      if (teamId) {
        const team = getters.byId(teamId)
        teamUser = team.users.find(user => user.id === userId)
      } else {
        teamUser = getters.teamUser({ userId, space })
      }
      return teamUser?.role === 'admin'
    }
  }
}
