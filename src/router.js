import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router'
import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'

import consts from './consts.js'

const router = {
  history: consts.isStaticPrerenderingPage ? createMemoryHistory() : createWebHistory(import.meta.env.BASE_URL),

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
        const globalStore = useGlobalStore()
        window.document.title = 'Add Card'
        const urlParams = new URLSearchParams(window.location.search)
        globalStore.isAddPage = true
        next()
      }
    }, {
      path: '/',
      alias: '/about',
      name: 'about',
      component: () => import('./views/About.vue')
    }, {
      path: '/app',
      name: 'space',
      component: () => import('./views/Space.vue'),
      beforeEnter: (to, from, next) => {
        console.log('🍇🍇🍇🍇 APP')
        if (!consts.isStaticPrerenderingPage) {
          const globalStore = useGlobalStore()
          const urlParams = new URLSearchParams(window.location.search)
          globalStore.disableViewportOptimizations = urlParams.get('disableViewportOptimizations')
        }
        next()
      }
    }, {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('./views/Space.vue'),
      beforeEnter: (to, from, next) => {
        const globalStore = useGlobalStore()
        const urlParams = new URLSearchParams(window.location.search)
        const apiKey = urlParams.get('apiKey')
        if (apiKey) {
          globalStore.updatePasswordApiKey = apiKey
          globalStore.passwordResetIsVisible = true
        }
        history.replaceState({}, document.title, window.location.origin)
        next()
      }
    }, {
      path: '/update-arena-access-token',
      name: 'update-arena-access-token',
      component: () => import('./views/Space.vue'),
      beforeEnter: (to, from, next) => {
        const urlParams = new URLSearchParams(window.location.search)
        const arenaReturnedCode = urlParams.get('code')
        next()
        history.replaceState({}, document.title, window.location.origin)
        const userStore = useUserStore()
        userStore.updateUserArenaAccessToken(arenaReturnedCode)
      }
    }, {
      path: '/explore',
      component: () => import('./views/Space.vue'),
      beforeEnter: (to, from, next) => {
        const globalStore = useGlobalStore()
        globalStore.shouldShowExploreOnLoad = true
        next()
      }
    }, {
      path: '/new',
      component: () => import('./views/Space.vue'),
      beforeEnter: (to, from, next) => {
        const globalStore = useGlobalStore()
        globalStore.loadNewSpace = true
        next()
      }
    }, {
      path: '/inbox', // used by /add
      component: () => import('./views/Space.vue'),
      beforeEnter: (to, from, next) => {
        const globalStore = useGlobalStore()
        globalStore.loadInboxSpace = true
        next()
      }
    }, {
      path: '/:space/:card',
      component: () => import('./views/Space.vue'),
      beforeEnter: (to, from, next) => {
        const globalStore = useGlobalStore()
        const path = window.location.pathname
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get('present')) {
          globalStore.isPresentationMode = true
        }
        if (urlParams.get('comment')) {
          globalStore.isCommentMode = true
        }
        globalStore.updateSpaceAndCardUrlToLoad(path)
        next()
      }
    }, {
      path: '/embed',
      component: () => import('./views/Space.vue'),
      beforeEnter: (to, from, next) => {
        const globalStore = useGlobalStore()
        const urlParams = new URLSearchParams(window.location.search)
        const spaceId = urlParams.get('spaceId')
        const zoomLimit = {
          min: 40,
          max: 100
        }
        let zoom = urlParams.get('zoom')
        zoom = Math.max(zoomLimit.min, zoom)
        zoom = Math.min(zoomLimit.max, zoom)
        globalStore.spaceUrlToLoad = `${consts.kinopioDomain()}/${spaceId}`
        globalStore.spaceZoomPercent = zoom
        globalStore.isEmbedMode = true
        next()
      }
    }, {
      path: '/donation-success',
      name: 'donation-success',
      component: () => import('./views/Space.vue'),
      beforeEnter: (to, from, next) => {
        const globalStore = useGlobalStore()
        globalStore.notifyThanksForDonating = true
        next()
      }
    }, {
      path: '/subscription-success',
      name: 'subscription-success',
      component: () => import('./views/Space.vue'),
      beforeEnter: (to, from, next) => {
        const globalStore = useGlobalStore()
        const urlParams = new URLSearchParams(window.location.search)
        const sessionId = urlParams.get('sessionId')
        if (sessionId) {
          globalStore.notifyThanksForUpgrading = true
        }
        next()
      }
    }, {
      path: '/group/invite',
      name: 'groupInvite',
      component: () => import('./views/Space.vue'),
      beforeEnter: (to, from, next) => {
        const globalStore = useGlobalStore()
        const urlParams = new URLSearchParams(window.location.search)
        const groupId = urlParams.get('groupId')
        const collaboratorKey = urlParams.get('collaboratorKey')
        globalStore.groupToJoinOnLoad = { groupId, collaboratorKey }
        globalStore.shouldNotifyIsJoiningGroup = true
        next()
      }
    }, {
      path: '/invite',
      name: 'invite',
      component: () => import('./views/Space.vue'),
      beforeEnter: async (to, from, next) => {
        const globalStore = useGlobalStore()
        const userStore = useUserStore()
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get('present')) {
          globalStore.isPresentationMode = true
        }
        if (urlParams.get('comment')) {
          globalStore.isCommentMode = true
        }
        const spaceId = urlParams.get('spaceId')
        const collaboratorKey = urlParams.get('collaboratorKey')
        const readOnlyKey = urlParams.get('readOnlyKey')
        const isPresentationMode = urlParams.get('present') || false
        const isDisableViewportOptimizations = Boolean(urlParams.get('disableViewportOptimizations'))
        globalStore.disableViewportOptimizations = isDisableViewportOptimizations
        await userStore.restoreRemoteUser()
        globalStore.isLoadingSpace = true
        if (!spaceId) {
          globalStore.addNotification({ message: 'Invalid invite URL', type: 'danger' })
          next()
          return
        }
        globalStore.isPresentationMode = isPresentationMode
        // edit
        if (collaboratorKey) {
          inviteToEdit({ next, spaceId, collaboratorKey })
        // read only
        } else if (readOnlyKey) {
          inviteToReadOnly({ next, spaceId, readOnlyKey })
        // error
        } else {
          globalStore.addNotification({ message: 'Invalid invite URL', type: 'danger' })
          next()
        }
      }
    }, {
      path: '/:space',
      component: () => import('./views/Space.vue'),
      beforeEnter: (to, from, next) => {
        console.log('🍇🍇🍇🍇 SPACE', new URLSearchParams(window.location.search))
        const globalStore = useGlobalStore()
        const path = window.location.pathname
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get('present')) {
          globalStore.isPresentationMode = true
        }
        globalStore.updateSpaceAndCardUrlToLoad(path)
        next()
      }
    }
  ]
}

export default router

const inviteToEdit = async ({ next, spaceId, collaboratorKey }) => {
  const globalStore = useGlobalStore()
  const userStore = useUserStore()
  const apiStore = useApiStore()
  const apiKey = userStore.apiKey
  if (!apiKey) {
    globalStore.spaceUrlToLoad = `${consts.kinopioDomain()}/${spaceId}`
    globalStore.addToSpaceCollaboratorKeys({ spaceId, collaboratorKey })
    next()
    return
  }
  // join
  try {
    await apiStore.addSpaceCollaborator({ spaceId, collaboratorKey })
    globalStore.spaceUrlToLoad = `${consts.kinopioDomain()}/${spaceId}`
    globalStore.addNotification({ message: 'You can now edit this space', type: 'success' })
    globalStore.addToSpaceCollaboratorKeys({ spaceId, collaboratorKey })
  } catch (error) {
    console.error('🚒 inviteToEdit', error)
    if (error.status === 401) {
      globalStore.addNotification({ message: 'Space could not be found, or your invite was invalid', type: 'danger' })
    } else {
      globalStore.addNotification({ message: '(シ_ _)シ Something went wrong, Please try again or contact support', type: 'danger' })
    }
  }
  // load
  next()
}

const inviteToReadOnly = ({ next, spaceId, readOnlyKey }) => {
  const globalStore = useGlobalStore()
  globalStore.spaceUrlToLoad = `${consts.kinopioDomain()}/${spaceId}`
  globalStore.spaceReadOnlyKey = { spaceId, key: readOnlyKey }
  next()
}
