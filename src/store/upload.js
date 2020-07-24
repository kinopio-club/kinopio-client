import utils from '@/utils.js'

export default {
  namespaced: true,
  state: {
    pending: []
    // ? pendingBlobs: [] // todo: add/remvoed in pending commits, try to store in pending directly first and see if dataurl big url size causes issues
  },
  mutations: {
    s3Policy: (state, value) => {
      utils.typeCheck(value, 'object')
      state.s3Policy = value
    }
    // addPending: (state, pending) => {
    // dataurl if img filecontenttype
    //   const fileReader = new FileReader()
    //   pending.dataUrl = fileReader.readAsDataUrl(pending.file)
    //   console.log('💽 pending dataurl', pending.dataUrl)
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

    // updateInProgress: (state, progress) => {
    //   let inProgress = state.pending.filter(upload => upload.cardId !== progress.cardId)
    //   pending.push(progress)
    //   state.pending = pending
    // },
    // chunk , in progress, pieces

  },
  actions: {
    checkIfFileTooBig: (context, file) => {
      const userIsUpgraded = context.rootState.currentUser.isUpgraded
      const sizeLimit = 1024 * 1024 * 20 // 20mb
      if (file.size > sizeLimit && !userIsUpgraded) {
        throw {
          type: 'sizeLimit',
          message: 'To upload files over 20mb, upgrade for unlimited size uploads'
        }
      }
    },
    uploadFile: async (context, { file, cardId }) => {
      const key = `${cardId}/${file.name}`
      const userIsUpgraded = context.rootState.currentUser.isUpgraded

      // 🌷 get policy, todo: if user is anon , return emit an error

      context.dispatch('checkIfFileTooBig', file)

      const presignedPostData = await context.dispatch('api/createPresignedPost', { key, userIsUpgraded }, { root: true })

      console.log('🥦', file, file.size, cardId, presignedPostData)

      const formData = new FormData()
      Object.keys(presignedPostData.fields).forEach(key => {
        formData.append(key, presignedPostData.fields[key])
      })
      formData.append('file', file)
      const request = new XMLHttpRequest()
      request.open('POST', presignedPostData.url)
      request.send(formData)
      request.onprogress = (event) => {
        console.log('🍡 progress', event)
        // todo context.commit('updatePending', {file, cardId, event.loaded, event.total, event.position}) // xmlrequestprogressevent
      }
      request.onload = (event) => {
        console.log('🍒 upload complete', event)
        // todo removePending
      }

      // error handling

      // request.onload = (event) => {
      //   console.log('request loaded', event)
      // }
      // request.onprogress = (event) => {
      //   console.log('progress', event)
      // }

      // have to use XMLHttpRequest, because fetch doesn't currently support progress
      // const request = new XMLHttpRequest()

      // Progress events are a high level feature that won't arrive in fetch for now. You can create your own by looking at the Content-Length header and using a pass-through stream to monitor the bytes received.
      // This means you can explicitly handle responses without a Content-Length differently. And of course, even if Content-Length is there it can be a lie. With streams you can handle these lies however you want.

      // const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
      // const options = {}
    }
  }
}
