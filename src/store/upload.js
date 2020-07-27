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
    }
    // addPendingUpload: (state, { file, imageDataUrl }) => {
    //   state.pending.push(pending)
    //   console.log('🌺 add pending',pending)
    // should abort and remove matching / duplicate cardId upload
    // },
    // updatePending: (state, { cardId, progress }) => {
    //   let pending = state.pending.filter(upload => upload.cardId !== cardId)
    //   pending.push({ cardId, progress })
    //   state.pending = pending
    // },
    // removePending: (state, cardId) => {
    //   let pending = state.pending.filter(upload => upload.cardId !== cardId)
    //   state.pending = pending
    // }

  },
  actions: {
    checkIfFileTooBig: (context, file) => {
      const userIsUpgraded = context.rootState.currentUser.isUpgraded
      const sizeLimit = 1024 * 1024 * 10 // 10mb
      if (file.size > sizeLimit && !userIsUpgraded) {
        throw {
          type: 'sizeLimit',
          message: 'To upload files over 10mb, upgrade for unlimited size uploads'
        }
      }
    },
    imageDataUrl: (context, file) => {
      const isImage = file.type.includes('image')
      if (!isImage) { return null }
      const reader = new FileReader()
      console.log(reader, file)
      reader.addEventListener('load', () => {
        return reader.result
      }, false)
      reader.readAsDataURL(file)
    },
    uploadFile: async (context, { file, cardId }) => {
      const key = `${cardId}/${file.name}`
      const userIsUpgraded = context.rootState.currentUser.isUpgraded
      context.dispatch('checkIfFileTooBig', file)
      const presignedPostData = await context.dispatch('api/createPresignedPost', { key, userIsUpgraded, type: file.type }, { root: true })

      const formData = new FormData()
      Object.keys(presignedPostData.fields).forEach(key => {
        formData.append(key, presignedPostData.fields[key])
      })
      formData.append('file', file)
      const request = new XMLHttpRequest()
      request.upload.onprogress = (event) => {
        console.log(`🛫 Uploaded ${event.loaded} of ${event.total}, percent: ${Math.floor(event.loaded / event.total * 100)}`)
        // todo updatePending w progress percent
      }
      request.onload = (event) => {
        console.log('🍡 Upload complete or failed', event)
        // todo removePending
      }
      request.open('POST', presignedPostData.url)
      request.send(formData)
      // const imageDataUrl = context.dispatch('imageDataUrl', file)
      console.log('🥦', file)
      // todo addPendingUpload, { percent, imageDataUrl, key, cardId }
    }
  }
}
