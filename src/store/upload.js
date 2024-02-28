import utils from '@/utils.js'
import consts from '@/consts.js'

import { nanoid } from 'nanoid'
import { nextTick } from 'vue'

const placeholder = '⬬⬭'

export default {
  namespaced: true,
  state: {
    pendingUploads: []
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
        if (percentComplete && (item.cardId === cardId || item.spaceId === spaceId)) {
          item.percentComplete = percentComplete
        }
        if (imageDataUrl && (item.cardId === cardId || item.spaceId === spaceId)) {
          item.imageDataUrl = imageDataUrl
        }
        return item
      })
      state.pendingUploads = state.pendingUploads.filter(item => item.percentComplete !== 100)
    },
    removePendingUpload: (state, { cardId, spaceId }) => {
      state.pendingUploads = state.pendingUploads.filter(item => (item.cardId !== cardId || item.spaceId === spaceId))
    }
  },
  actions: {
    checkIfFileTooBig: (context, file) => {
      const userIsUpgraded = context.rootState.currentUser.isUpgraded
      const spaceUserIsUpgraded = context.rootGetters['currentSpace/spaceUserIsUpgraded']
      const isFileTooBig = utils.isFileTooBig({ file, userIsUpgraded, spaceUserIsUpgraded })
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
      const reader = new FileReader()
      reader.onloadend = (event) => {
        context.commit('updatePendingUpload', {
          cardId,
          spaceId,
          imageDataUrl: reader.result
        })
      }
      reader.onerror = (event) => {
        throw {
          type: 'unknownUploadError',
          message: '(シ_ _)シ Something went wrong, Please try again or contact support'
        }
      }
      reader.readAsDataURL(file)
    },
    uploadFile: async (context, { file, cardId, spaceId }) => {
      const uploadId = nanoid()
      const fileName = utils.normalizeFileUrl(file.name)
      let key = `${cardId || spaceId}/${fileName}`
      const userIsUpgraded = context.rootState.currentUser.isUpgraded
      const spaceUserIsUpgraded = context.rootGetters['currentSpace/spaceUserIsUpgraded']
      context.dispatch('checkIfFileTooBig', file)
      // add presignedPostData to upload
      let presignedPostData
      if (file.presignedPostData) {
        presignedPostData = file.presignedPostData
      } else {
        presignedPostData = await context.dispatch('api/createPresignedPost', { key, userIsUpgraded, type: file.type, spaceUserIsUpgraded }, { root: true })
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
          console.log(`🛫 Uploading ${fileName} for ${cardId || spaceId}, percent: ${percentCompleteDisplay}`)
          const updates = {
            cardId,
            spaceId,
            percentComplete: percentCompleteDisplay,
            userId: context.rootState.currentUser.id,
            id: uploadId
          }
          context.commit('updatePendingUpload', updates)
          context.commit('broadcast/updateStore', { updates, type: 'updateRemotePendingUploads' }, { root: true })
          // end
          if (percentComplete >= 100) {
            console.log('🛬 Upload completed or failed', event)
            context.commit('triggerUploadComplete', {
              cardId,
              spaceId,
              url: `${consts.cdnHost}/${key}`
            }, { root: true })
            context.commit('removePendingUpload', { cardId, spaceId })
            resolve(request.response)
            nextTick(() => {
              nextTick(() => {
                context.dispatch('currentCards/updateDimensions', { cardId }, { root: true })
              })
            })
          }
        }
        // start
        request.open('POST', presignedPostData.url)
        request.send(formData)
        context.commit('addPendingUpload', { key, fileName, cardId, spaceId })
        context.dispatch('addImageDataUrl', { file, cardId, spaceId })
      })
    },
    addCardsAndUploadFiles: async (context, { files, event }) => {
      let position = utils.cursorPositionInSpace(event)
      context.dispatch('currentUser/notifyReadOnly', position, { root: true })
      const userIsUpgraded = context.rootState.currentUser.isUpgraded
      const spaceUserIsUpgraded = context.rootGetters['currentSpace/spaceUserIsUpgraded']
      const canEditSpace = context.rootGetters['currentUser/canEditSpace']()
      if (!canEditSpace) {
        context.commit('addNotification', { message: 'You can only upload files on spaces you can edit', type: 'info' }, { root: true })
        return
      }
      let cardIds = []
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
      const filesTooBig = files.find(file => {
        return utils.isFileTooBig({ file, userIsUpgraded, spaceUserIsUpgraded })
      })
      if (filesTooBig) {
        context.commit('addNotificationWithPosition', { message: 'Too Big', position, type: 'danger', layer: 'space', icon: 'cancel' }, { root: true })
        context.commit('addNotification', { message: 'To upload files over 5mb, upgrade for unlimited size uploads', type: 'danger' }, { root: true })
        return
      }
      // add cards
      let filesPostData = []
      for (const [index, file] of files.entries()) {
        const positionOffset = 20
        const cardId = nanoid()
        cardIds.push(cardId)
        context.dispatch('currentCards/add', {
          position: {
            x: position.x + (index * positionOffset),
            y: position.y + (index * positionOffset)
          },
          name: placeholder,
          id: cardId
        }, { root: true })
        const fileName = utils.normalizeFileUrl(file.name)
        const key = `${cardIds[index]}/${fileName}`
        filesPostData.push({
          key,
          type: file.type
        })
        context.commit('addPendingUpload', { key, fileName, cardId })
      }
      // add presignedPostData to files
      const multiplePresignedPostData = await context.dispatch('api/createMultiplePresignedPosts', { files: filesPostData, userIsUpgraded, spaceUserIsUpgraded }, { root: true })
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
      // remove placeholder from card names
      files.forEach((file, index) => {
        const cardId = cardIds[index]
        let card = context.rootGetters['currentCards/byId'](cardId)
        const name = card.name.replace(placeholder, '')
        context.dispatch('currentCards/update', {
          id: cardId,
          name
        }, { root: true })
      })
    }
  }
}
