import Space from '@/views/Space.vue'
import store from '@/store/store.js'
import pageMeta from '@/pageMeta.js'

import consts from './consts.js'

import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  // server level redirects in _redirects

  routes: [
    {
      path: '/add',
      name: 'add',
      // route level code-splitting
      // this generates a separate chunk (Add.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('./views/Add.vue'),
      beforeEnter: (to, from, next) => {
        window.document.title = 'Add Card'
        const urlParams = new URLSearchParams(window.location.search)
        store.commit('isAddPage', true)
        next()
      }
    }, {
      path: '/',
      name: 'space',
      component: Space,
      beforeEnter: (to, from, next) => {
        const urlParams = new URLSearchParams(window.location.search)
        store.commit('disableViewportOptimizations', urlParams.get('disableViewportOptimizations'))
        next()
      }
    }, {
      path: '/beta',
      name: 'beta',
      component: Space,
      beforeEnter: (to, from, next) => {
        store.commit('isBeta', true)
        store.commit('addNotification', { message: 'No features currently in Beta' }) // 'No features currently in Beta'
        next()
      }
    }, {
      path: '/confirm-email',
      name: 'confirm-email',
      component: Space,
      redirect: to => {
        store.dispatch('currentUser/confirmEmail')
        store.commit('addNotification', { message: 'Email Confirmed', type: 'success' })
        return '/'
      }
    }, {
      path: '/reset-password',
      name: 'reset-password',
      component: Space,
      beforeEnter: (to, from, next) => {
        const urlParams = new URLSearchParams(window.location.search)
        const apiKey = urlParams.get('apiKey')
        if (apiKey) {
          store.commit('updatePasswordApiKey', apiKey)
          store.commit('passwordResetIsVisible', true)
        }
        next()
        history.replaceState({}, document.title, window.location.origin)
      }
    }, {
      path: '/update-arena-access-token',
      name: 'update-arena-access-token',
      component: Space,
      beforeEnter: (to, from, next) => {
        const urlParams = new URLSearchParams(window.location.search)
        const arenaReturnedCode = urlParams.get('code')
        next()
        history.replaceState({}, document.title, window.location.origin)
        store.dispatch('currentUser/updateArenaAccessToken', arenaReturnedCode)
      }
    }, {
      path: '/explore',
      component: Space,
      beforeEnter: (to, from, next) => {
        store.commit('shouldShowExploreOnLoad', true)
        next()
      }
    }, {
      path: '/new',
      component: Space,
      beforeEnter: (to, from, next) => {
        store.commit('loadNewSpace', true)
        next()
      }
    }, {
      path: '/blog',
      component: Space,
      beforeEnter: (to, from, next) => {
        store.commit('loadBlogSpace', true)
        next()
      }
    }, {
      path: '/inbox',
      component: Space,
      beforeEnter: (to, from, next) => {
        store.commit('loadInboxSpace', true)
        next()
      }
    }, {
      path: '/:space/:card',
      component: Space,
      beforeEnter: (to, from, next) => {
        const path = window.location.pathname
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get('present')) {
          store.commit('isPresentationMode', true)
        }
        if (urlParams.get('comment')) {
          store.commit('isCommentMode', true)
        }
        store.dispatch('updateSpaceAndCardUrlToLoad', path)
        next()
      }
    }, {
      path: '/:space',
      component: Space,
      beforeEnter: (to, from, next) => {
        pageMeta.spaceFromId({})
        const path = window.location.pathname
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get('present')) {
          store.commit('isPresentationMode', true)
        }
        store.dispatch('updateSpaceAndCardUrlToLoad', path)
        next()
      }
    }, {
      path: '/embed',
      component: Space,
      beforeEnter: (to, from, next) => {
        const urlParams = new URLSearchParams(window.location.search)
        const spaceId = urlParams.get('spaceId')
        const zoomLimit = {
          min: 40,
          max: 100
        }
        let zoom = urlParams.get('zoom')
        zoom = Math.max(zoomLimit.min, zoom)
        zoom = Math.min(zoomLimit.max, zoom)
        store.commit('spaceUrlToLoad', spaceId)
        store.commit('spaceZoomPercent', zoom)
        store.commit('isEmbedMode', true)
        next()
      }
    }, {
      path: '/donation-success',
      name: 'donation-success',
      component: Space,
      beforeEnter: (to, from, next) => {
        store.commit('notifyThanksForDonating', true)
        next()
      }
    }, {
      path: '/subscription-success',
      name: 'subscription-success',
      component: Space,
      beforeEnter: (to, from, next) => {
        const urlParams = new URLSearchParams(window.location.search)
        const sessionId = urlParams.get('sessionId')
        if (sessionId) {
          store.commit('notifyThanksForUpgrading', true)
        }
        next()
      }
    }, {
      path: '/group/invite',
      name: 'groupInvite',
      component: Space,
      beforeEnter: (to, from, next) => {
        const urlParams = new URLSearchParams(window.location.search)
        const groupId = urlParams.get('groupId')
        const collaboratorKey = urlParams.get('collaboratorKey')
        pageMeta.groupInvite({ groupId, isGroupInvite: true })
        store.commit('groupToJoinOnLoad', { groupId, collaboratorKey })
        store.commit('shouldNotifyIsJoiningGroup', true)
        next()
      }
    }, {
      path: '/invite',
      name: 'invite',
      component: Space,
      beforeEnter: (to, from, next) => {
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get('present')) {
          store.commit('isPresentationMode', true)
        }
        if (urlParams.get('comment')) {
          store.commit('isCommentMode', true)
        }
        const spaceId = urlParams.get('spaceId')
        const collaboratorKey = urlParams.get('collaboratorKey')
        const readOnlyKey = urlParams.get('readOnlyKey')
        const isPresentationMode = urlParams.get('present') || false
        const isDisableViewportOptimizations = Boolean(urlParams.get('disableViewportOptimizations'))
        store.commit('disableViewportOptimizations', isDisableViewportOptimizations)
        pageMeta.spaceFromId({ spaceId, isSpaceInvite: true })
        store.dispatch('currentUser/init')
        store.commit('isLoadingSpace', true)
        if (!spaceId) {
          store.commit('addNotification', { message: 'Invalid invite URL', type: 'danger' })
          next()
          return
        }
        store.commit('isPresentationMode', isPresentationMode)
        // edit
        if (collaboratorKey) {
          inviteToEdit({ next, store, spaceId, collaboratorKey })
        // read only
        } else if (readOnlyKey) {
          inviteToReadOnly({ next, store, spaceId, readOnlyKey })
        // error
        } else {
          store.commit('addNotification', { message: 'Invalid invite URL', type: 'danger' })
          next()
        }
      }
    }
  ]
})

export default router

const inviteToEdit = async ({ next, store, spaceId, collaboratorKey }) => {
  await store.dispatch('currentUser/init')
  const apiKey = store.state.currentUser.apiKey
  if (!apiKey) {
    store.commit('spaceUrlToLoad', spaceId)
    next()
    return
  }
  // join
  try {
    await store.dispatch('api/addSpaceCollaborator', { spaceId, collaboratorKey })
    store.commit('spaceUrlToLoad', spaceId)
    store.commit('addNotification', { message: 'You can now edit this space', type: 'success' })
    store.commit('addToSpaceCollaboratorKeys', { spaceId, collaboratorKey })
  } catch (error) {
    console.error('🚒 inviteToEdit', error)
    if (error.status === 401) {
      store.commit('addNotification', { message: 'Space could not be found, or your invite was invalid', type: 'danger' })
    } else {
      store.commit('addNotification', { message: '(シ_ _)シ Something went wrong, Please try again or contact support', type: 'danger' })
    }
  }
  // load
  next()
}

const inviteToReadOnly = ({ next, store, spaceId, readOnlyKey }) => {
  store.commit('spaceUrlToLoad', spaceId)
  store.commit('spaceReadOnlyKey', { spaceId, key: readOnlyKey })
  next()
}
