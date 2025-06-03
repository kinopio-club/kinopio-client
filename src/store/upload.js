import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import utils from '@/utils.js'
import consts from '@/consts.js'

import { nanoid } from 'nanoid'
import { nextTick } from 'vue'

export default {
  namespaced: true,
  state: {
    pendingUploads: []
  },
  getters: {
    hasPendingUploadForCardId: (state) => (id) => {
      return state.pendingUploads.some(item => item.cardId === id)
    }
  },
  mutations: {
    s3Policy: (state, value) => {
      utils.typeCheck({ value, type: 'object', origin: 's3Policy' })
      state.s3Policy = value
    },
    addPendingUpload: (state, upload) => { // key, fileName, cardId, spaceId
      upload.percentComplete = 0
      state.pendingUploads = state.pendingUploads.filter(item => (item.cardId !== upload.cardId || item.spaceId === upload.spaceId))
      state.pendingUploads.push(upload)
    },
    updatePendingUpload: (state, { cardId, spaceId, percentComplete, imageDataUrl }) => {
      state.pendingUploads = state.pendingUploads.map(item => {
        if (percentComplete && item.cardId === cardId) {
          item.percentComplete = percentComplete
        }
        if (imageDataUrl && item.cardId === cardId) {
          item.imageDataUrl = imageDataUrl
        }
        return item
      })
      state.pendingUploads = state.pendingUploads.filter(item => item.percentComplete !== 100)
    },
    removePendingUpload: (state, { cardId, spaceId, boxId }) => {
      state.pendingUploads = state.pendingUploads.filter(item => (item.cardId !== cardId || item.spaceId === spaceId || item.boxId !== boxId))
    }
  },
  actions: {
    checkIfFileTooBig: (context, file) => {
      const userStore = useUserStore()
      const userIsUpgraded = userStore.isUpgraded
      const isFileTooBig = utils.isFileTooBig({ file, userIsUpgraded })
      if (isFileTooBig) {
        throw {
          type: 'sizeLimit',
          message: 'To upload files over 5mb, upgrade for unlimited size uploads'
        }
      }
    },
    addImageDataUrl: (context, { file, cardId, spaceId }) => {
      const isImage = file.type.includes('image')
      if (!isImage) { return null }
      context.commit('updatePendingUpload', {
        cardId,
        spaceId,
        imageDataUrl: URL.createObjectURL(file)
      })
    },
    uploadFile: async (context, { file, cardId, spaceId, boxId }) => {
      const userStore = useUserStore()
      const uploadId = nanoid()
      const fileName = utils.normalizeFileUrl(file.name)
      const id = cardId || spaceId || boxId
      const key = `${id}/${fileName}`
      context.dispatch('checkIfFileTooBig', file)
      // add presignedPostData to upload
      let presignedPostData
      if (file.presignedPostData) {
        presignedPostData = file.presignedPostData
      } else {
        presignedPostData = await context.dispatch('api/createPresignedPost', { key, type: file.type }, { root: true })
      }
      const formData = new FormData()
      Object.keys(presignedPostData.fields).forEach(key => {
        formData.append(key, presignedPostData.fields[key])
      })
      formData.append('file', file)
      // upload
      return new Promise(resolve => {
        const request = new XMLHttpRequest()
        // progress
        request.upload.onprogress = (event) => {
          const percentComplete = event.loaded / event.total * 100
          const percentCompleteDisplay = Math.floor(percentComplete)
          console.info(`🛫 Uploading ${fileName} for ${id}, percent: ${percentCompleteDisplay}`)
          const updates = {
            cardId,
            spaceId,
            boxId,
            percentComplete: percentCompleteDisplay,
            userId: userStore.id,
            id: uploadId
          }
          context.commit('updatePendingUpload', updates)
          context.commit('broadcast/updateStore', { updates, type: 'updateRemotePendingUploads' }, { root: true })
          // end
          if (percentComplete >= 100) {
            const complete = {
              cardId,
              spaceId,
              boxId,
              url: `${consts.cdnHost}/${key}`
            }
            console.info('🛬 Upload completed or failed', event, complete)
            context.commit('triggerUploadComplete', complete, { root: true })
            context.commit('removePendingUpload', { cardId, spaceId, boxId })
            resolve(request.response)
            nextTick(() => {
              nextTick(() => {
                const card = { id: cardId }
                context.dispatch('currentCards/updateNameRemovePlaceholders', cardId, { root: true })
              })
            })
          }
        }
        // start
        request.open('POST', presignedPostData.url)
        request.send(formData)
        context.commit('addPendingUpload', { key, fileName, cardId, spaceId, boxId })
        context.dispatch('addImageDataUrl', { file, cardId, spaceId, boxId })
      })
    },
    addCardsAndUploadFiles: async (context, { files, event, position }) => {
      const userStore = useUserStore()
      position = position || utils.cursorPositionInSpace(event)
      context.dispatch('currentUser/notifyReadOnly', position, { root: true })
      const canEditSpace = context.rootGetters['currentUser/canEditSpace']()
      if (!canEditSpace) {
        context.commit('addNotification', { message: 'You can only upload files on spaces you can edit', type: 'info' }, { root: true })
        return
      }
      const cardIds = []
      const currentUserIsSignedIn = context.rootGetters['currentUser/isSignedIn']
      if (!currentUserIsSignedIn) {
        context.commit('addNotificationWithPosition', { message: 'Sign Up or In', position, type: 'info', layer: 'space', icon: 'cancel' }, { root: true })
        context.commit('addNotification', { message: 'To upload files, you need to Sign Up or In', type: 'info' }, { root: true })
        return
      }
      // check if outside space
      const isOutsideSpace = utils.isPositionOutsideOfSpace(position)
      if (isOutsideSpace) {
        position = utils.cursorPositionInPage(event)
        context.commit('addNotificationWithPosition', { message: 'Outside Space', position, type: 'info', icon: 'cancel', layer: 'app' }, { root: true })
        return
      }
      // check sizeLimit
      const userIsUpgraded = userStore.isUpgraded
      const filesTooBig = files.find(file => {
        return utils.isFileTooBig({ file, userIsUpgraded })
      })
      if (filesTooBig) {
        context.commit('addNotificationWithPosition', { message: 'Too Big', position, type: 'danger', layer: 'space', icon: 'cancel' }, { root: true })
        context.commit('addNotification', { message: 'To upload files over 5mb, upgrade for unlimited size uploads', type: 'danger' }, { root: true })
        return
      }
      // add cards
      const filesPostData = []
      for (const [index, file] of files.entries()) {
        const positionOffset = 20
        const cardId = nanoid()
        cardIds.push(cardId)
        const newCard = {
          position: {
            x: position.x + (index * positionOffset),
            y: position.y + (index * positionOffset)
          },
          name: consts.uploadPlaceholder,
          id: cardId
        }
        context.dispatch('currentCards/add', { card: newCard }, { root: true })
        const fileName = utils.normalizeFileUrl(file.name)
        const key = `${cardIds[index]}/${fileName}`
        filesPostData.push({
          key,
          type: file.type
        })
        console.info('🍡 addCardsAndUploadFiles', file.type, file)
      }
      // add presignedPostData to files
      const multiplePresignedPostData = await context.dispatch('api/createMultiplePresignedPosts', { files: filesPostData }, { root: true })
      files.map((file, index) => {
        file.presignedPostData = multiplePresignedPostData[index]
      })
      // upload files
      await Promise.all(files.map(async (file, index) => {
        const cardId = cardIds[index]
        try {
          await context.dispatch('uploadFile', { file, cardId })
        } catch (error) {
          console.error('🚒', error)
          context.commit('addNotificationWithPosition', { message: error.message, position, type: 'danger', layer: 'space', icon: 'cancel' }, { root: true })
          context.commit('addNotification', { message: error.message, type: 'danger' }, { root: true })
        }
      }))
      // remove placeholders from card names
      files.forEach((file, index) => {
        const cardId = cardIds[index]
        context.dispatch('currentCards/updateNameRemovePlaceholders', cardId, { root: true })
      })
    }
  }
}
