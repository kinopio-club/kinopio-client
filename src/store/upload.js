import utils from '@/utils.js'

import nanoid from 'nanoid'

export default {
  namespaced: true,
  state: {
    pendingUploads: []
  },
  mutations: {
    s3Policy: (state, value) => {
      utils.typeCheck(value, 'object')
      state.s3Policy = value
    },
    addPendingUpload: (state, upload) => { // key, fileName, cardId
      upload.percentComplete = 0
      state.pendingUploads = state.pendingUploads.filter(item => item.cardId !== upload.cardId)
      state.pendingUploads.push(upload)
    },
    updatePendingUpload: (state, { cardId, percentComplete, imageDataUrl }) => {
      state.pendingUploads = state.pendingUploads.map(item => {
        if (percentComplete && item.cardId === cardId) {
          item.percentComplete = percentComplete
        }
        if (imageDataUrl && item.cardId === cardId) {
          item.imageDataUrl = imageDataUrl
        }
        return item
      })
    },
    removePendingUpload: (state, cardId) => {
      state.pendingUploads = state.pendingUploads.filter(item => item.cardId !== cardId)
    }
  },
  actions: {
    checkIfFileTooBig: (context, file) => {
      const userIsUpgraded = context.rootState.currentUser.isUpgraded
      const isFileTooBig = utils.isFileTooBig(file, userIsUpgraded)
      if (isFileTooBig) {
        throw {
          type: 'sizeLimit',
          message: 'To upload files over 5mb, upgrade for unlimited size uploads'
        }
      }
    },
    addImageDataUrl: (context, { file, cardId }) => {
      const isImage = file.type.includes('image')
      if (!isImage) { return null }
      const reader = new FileReader()
      reader.onloadend = (event) => {
        context.commit('updatePendingUpload', { cardId,
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
    uploadFile: async (context, { file, cardId }) => {
      const fileName = utils.normalizeFileUrl(file.name)
      const key = `${cardId}/${fileName}`
      const userIsUpgraded = context.rootState.currentUser.isUpgraded
      context.dispatch('checkIfFileTooBig', file)
      const presignedPostData = await context.dispatch('api/createPresignedPost', { key, userIsUpgraded, type: file.type }, { root: true })
      const formData = new FormData()
      Object.keys(presignedPostData.fields).forEach(key => {
        formData.append(key, presignedPostData.fields[key])
      })
      formData.append('file', file)
      return new Promise(resolve => {
        const request = new XMLHttpRequest()
        // progress
        request.upload.onprogress = (event) => {
          const percentComplete = Math.floor(event.loaded / event.total * 100)
          console.log(`🛫 Uploading ${fileName} for card ${cardId}, percent: ${percentComplete}`)
          context.commit('updatePendingUpload', { cardId, percentComplete })
        }
        // end
        request.onload = (event) => {
          console.log('🛬 Upload completed or failed', event)
          context.commit('triggerUploadComplete', {
            cardId,
            url: `${presignedPostData.url}/${key}`
          }, { root: true })
          context.commit('removePendingUpload', cardId)
          resolve(request.response)
        }
        // start
        request.open('POST', presignedPostData.url)
        request.send(formData)
        context.commit('addPendingUpload', { key, fileName, cardId })
        context.dispatch('addImageDataUrl', { file, cardId })
      })
    },
    addCardsAndUploadFiles: async (context, { files, currentCursor }) => {
      const canEditSpace = context.rootGetters['currentUser/canEditSpace'](context.rootState.currentSpace)
      if (!canEditSpace) {
        context.commit('addNotificationWithPosition', { message: 'Space is Read Only', position: currentCursor, type: 'info' }, { root: true })
        context.commit('addNotification', { message: 'You can only upload files on spaces you can edit', type: 'info' }, { root: true })
        return
      }
      let cardIds = []
      const currentUserIsSignedIn = context.rootGetters['currentUser/isSignedIn']
      if (!currentUserIsSignedIn) {
        context.commit('addNotificationWithPosition', { message: 'Sign Up or In', position: currentCursor, type: 'info' }, { root: true })
        context.commit('addNotification', { message: 'To upload files, you need to Sign Up or In', type: 'info' }, { root: true })
        return
      }
      // check sizeLimit
      const filesTooBig = files.find(file => {
        const userIsUpgraded = context.rootState.currentUser.isUpgraded
        return utils.isFileTooBig(file, userIsUpgraded)
      })
      if (filesTooBig) {
        context.commit('addNotificationWithPosition', { message: 'Too Big', position: currentCursor, type: 'danger' }, { root: true })
        context.commit('addNotification', { message: 'To upload files over 5mb, upgrade for unlimited size uploads', type: 'danger' }, { root: true })
        return
      }
      // add cards
      for (const [index] of files.entries()) {
        const positionOffset = 20
        const cardId = nanoid()
        cardIds.push(cardId)
        context.dispatch('currentSpace/addCard', {
          position: {
            x: currentCursor.x + (index * positionOffset),
            y: currentCursor.y + (index * positionOffset)
          },
          name: '⬬⬭',
          id: cardId
        }, { root: true })
      }
      // upload files
      await Promise.all(files.map(async (file, index) => {
        const cardId = cardIds[index]
        try {
          await context.dispatch('uploadFile', { file, cardId })
        } catch (error) {
          console.error('🚒', error)
          context.commit('addNotificationWithPosition', { message: error.message, position: currentCursor, type: 'danger' }, { root: true })
          context.commit('addNotification', { message: error.message, type: 'danger' }, { root: true })
        }
      }))
      // update card names
      files.forEach((file, index) => {
        const cardId = cardIds[index]
        context.dispatch('currentSpace/repaceInCardName', {
          cardId,
          match: '⬬⬭',
          replace: ''
        }, { root: true })
      })
    }
  }
}
