import utils from '@/utils.js'

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
    updateCardName: (context, cardId) => {
      const card = context.rootGetters['currentSpace/cardById'](cardId)
      console.log('🍄', card, card.id)
      // then remove '⬬⬭' from name
      // const card = this.updateCard
    },
    uploadFile: async (context, { file, cardId, shouldUpdateCardName }) => {
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

      // return new Promise(resolve => {
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
        if (!shouldUpdateCardName) { return }
        context.dispatch('updateCardName', cardId)
        // resolve(request.response)
      }
      // start upload
      request.open('POST', presignedPostData.url)
      request.send(formData)
      context.commit('addPendingUpload', { key, fileName, cardId })
      context.dispatch('addImageDataUrl', { file, cardId })
      // })
    }
  }
}
