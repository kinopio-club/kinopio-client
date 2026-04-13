import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router'
import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useCardStore } from '@/stores/useCardStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useLineStore } from '@/stores/useLineStore'
import { useListStore } from '@/stores/useListStore'
import { useApiStore } from '@/stores/useApiStore'

import consts from './consts.js'
import utils from './utils.js'

// ensures space will load properly after
const resetStoresForStaticPage = () => {
  useGlobalStore().$reset()
  useSpaceStore().$reset()
  useCardStore().$reset()
  useBoxStore().$reset()
  useLineStore().$reset()
  useListStore().$reset()
}

const affiliateRefferers = ['/foxy']
const aboutPaths = ['/about', ...affiliateRefferers]

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
        globalStore.isAddPage = true
        next()
      }
    }, {
      path: '/',
      alias: aboutPaths,
      name: 'about',
      component: () => import('./views/About.vue'),
      beforeEnter: (to, from, next) => {
        const globalStore = useGlobalStore()
        resetStoresForStaticPage()
        if (affiliateRefferers.includes(to.path.toLowerCase())) {
          const affiliatePromoCode = to.path.replace('/', '')
          globalStore.currentUserAffiliatePromoCode = affiliatePromoCode
          globalStore.notifyAffiliateReferrer = true
        }
        next()
      }
    }, {
      path: '/app',
      name: 'space',
      component: () => import('./views/Space.vue'),
      beforeEnter: (to, from, next) => {
        if (!consts.isStaticPrerenderingPage) {
          const globalStore = useGlobalStore()
          globalStore.disableViewportOptimizations = utils.stringToBoolean(to.query.disableViewportOptimizations)
        }
        next()
      }
    }, {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('./views/Space.vue'),
      beforeEnter: (to, from, next) => {
        const globalStore = useGlobalStore()
        const apiKey = to.query.apiKey
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
        const arenaReturnedCode = to.query.code
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
        globalStore.disableViewportOptimizations = utils.stringToBoolean(to.query.disableViewportOptimizations)
        globalStore.isPresentationMode = utils.stringToBoolean(to.query.present)
        globalStore.isCommentMode = utils.stringToBoolean(to.query.comment)
        globalStore.updateSpaceAndCardUrlToLoad(path)
        next()
      }
    }, {
      path: '/embed',
      component: () => import('./views/Space.vue'),
      beforeEnter: (to, from, next) => {
        const globalStore = useGlobalStore()
        const spaceId = to.query.spaceId
        const zoomLimit = {
          min: 40,
          max: 100
        }
        let zoom = parseInt(to.query.zoom)
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
        const sessionId = to.query.sessionId
        if (sessionId) {
          globalStore.notifyThanksForUpgrading = true
        }
        next()
      }
    }, {
      path: '/group/invite/:groupId',
      name: 'groupInvite',
      component: () => import('./views/Space.vue'),
      beforeEnter: async (to, from, next) => {
        const globalStore = useGlobalStore()
        const apiStore = useApiStore()
        const groupId = to.params.groupId
        const collaboratorKey = to.query.collaboratorKey
        globalStore.groupToJoinOnLoad = { groupId, collaboratorKey }
        globalStore.shouldNotifyIsJoiningGroup = true
        next()
        const group = await apiStore.getGroupPublicMeta(groupId)
        globalStore.groupToJoinOnLoad.group = group
      }
    }, {
      path: '/affiliates',
      name: 'affiliates',
      component: () => import('./views/Affiliates.vue'),
      beforeEnter: (to, from, next) => {
        const globalStore = useGlobalStore()
        next()
      }
    }, {
      path: '/space/invite/:spaceId',
      name: 'invite',
      component: () => import('./views/Space.vue'),
      beforeEnter: async (to, from, next) => {
        const globalStore = useGlobalStore()
        const userStore = useUserStore()
        const spaceId = to.params.spaceId
        const collaboratorKey = to.query.collaboratorKey
        const readOnlyKey = to.query.readOnlyKey
        await userStore.initializeUser()
        globalStore.isLoadingSpace = true
        if (!spaceId) {
          globalStore.addNotification({ message: 'Invalid invite URL', type: 'danger' })
          next()
          return
        }
        globalStore.isPresentationMode = utils.stringToBoolean(to.query.present)
        globalStore.isCommentMode = utils.stringToBoolean(to.query.comment)
        globalStore.disableViewportOptimizations = utils.stringToBoolean(to.query.disableViewportOptimizations)
        // edit
        if (collaboratorKey) {
          await inviteToEdit({ spaceId, collaboratorKey })
        // read only
        } else if (readOnlyKey) {
          inviteToReadOnly({ spaceId, readOnlyKey })
        // error
        } else {
          globalStore.addNotification({ message: 'Invalid invite URL', type: 'danger' })
        }
        // load space
        next()
      }
    }, {
      path: '/:space',
      component: () => import('./views/Space.vue'),
      beforeEnter: (to, from, next) => {
        const globalStore = useGlobalStore()
        const path = window.location.pathname
        globalStore.isPresentationMode = utils.stringToBoolean(to.query.present)
        globalStore.updateSpaceAndCardUrlToLoad(path)
        next()
      }
    }
  ]
}

export default router

const inviteToEdit = async ({ spaceId, collaboratorKey }) => {
  const globalStore = useGlobalStore()
  const userStore = useUserStore()
  const apiStore = useApiStore()
  const isSignedIn = userStore.getUserIsSignedIn
  if (!isSignedIn) {
    globalStore.spaceUrlToLoad = `${consts.kinopioDomain()}/${spaceId}`
    globalStore.addToSpaceCollaboratorKeys({ spaceId, collaboratorKey })
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
}

const inviteToReadOnly = ({ spaceId, readOnlyKey }) => {
  const globalStore = useGlobalStore()
  globalStore.spaceUrlToLoad = `${consts.kinopioDomain()}/${spaceId}`
  globalStore.spaceReadOnlyKey = { spaceId, key: readOnlyKey }
}
