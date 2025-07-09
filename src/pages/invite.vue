<script setup>
import { navigateTo } from '#app'
import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useApiStore } from '@/stores/useApiStore'

const inviteToEdit = async ({ spaceId, collaboratorKey }) => {
  const globalStore = useGlobalStore()
  const userStore = useUserStore()
  const apiStore = useApiStore()
  const apiKey = userStore.apiKey
  if (!apiKey) {
    globalStore.spaceUrlToLoad = spaceId
    globalStore.addToSpaceCollaboratorKeys({ spaceId, collaboratorKey })
    return
  }
  // join
  try {
    await apiStore.addSpaceCollaborator({ spaceId, collaboratorKey })
    globalStore.spaceUrlToLoad = spaceId
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
  globalStore.spaceUrlToLoad = spaceId
  globalStore.spaceReadOnlyKey = { spaceId, key: readOnlyKey }
}

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
userStore.initializeUser()
globalStore.isLoadingSpace = true
if (!spaceId) {
  globalStore.addNotification({ message: 'Invalid invite URL', type: 'danger' })
}
globalStore.isPresentationMode = isPresentationMode
// edit
if (collaboratorKey) {
  inviteToEdit({ spaceId, collaboratorKey })
// read only
} else if (readOnlyKey) {
  inviteToReadOnly({ spaceId, readOnlyKey })
// error
} else {
  globalStore.addNotification({ message: 'Invalid invite URL', type: 'danger' })
}

navigateTo('/')
</script>
