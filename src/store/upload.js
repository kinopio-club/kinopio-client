import utils from '@/utils.js'

export default {
  namespaced: true,
  state: {
    s3Policy: {}, // accessKeyId, policy, signature
    inProgress: []
  },
  mutations: {
    s3Policy: (state, value) => {
      utils.typeCheck(value, 'object')
      state.s3Policy = value
    }
  },
  actions: {
    updateS3Policy: async (context) => {
      const s3Policy = await context.dispatch('api/getS3Policy', null, { root: true })
      context.commit('s3Policy', s3Policy)
    },
    uploadFile: async (context, { file, cardId }) => {
      // cardId optional?

      // store loading upload true

      const policy = context.state.s3Policy
      const policyData = JSON.parse(atob(policy.policy)) // conditions.{bucket, acl, [content-length, success_action_status]}, expiration
      // https://kinopio-uploads.us-east-1.linodeobjects.com/43cardIDxyz123/ultraboost-20.png

      // put s3 info in formdata
      // let formData = new formData()
      // formData.append('')

      // const data = {
      //   key: `${cardId}/${file.name}`,
      //   file: file,
      //   'Content-Type': 'binary/octet-stream',
      //   'Cache-Control': '',
      //   AWSAccessKeyId: policy.accessKeyId,
      //   acl: 'public-read',
      //   policy: policy.policy,
      //   signature: policy.signature,
      // }
      // console.log(data)

      const formData = new FormData()
      formData.append('key', `${cardId}/${file.name}`)
      formData.append('file', file)
      formData.append('Content-Type', file.type)
      formData.append('Cache-Control', 'max-age=31536000')
      formData.append('AWSAccessKeyId', policy.accessKeyId)
      formData.append('acl', 'public-read')
      formData.append('policy', policy.policy)
      formData.append('signature', policy.signature)

      console.log(formData.entries())
      // iterate over everything in data and append formdata
      // formData.append('name', file, `${cardId}/${file.name}`)

      // const reader = new FileReader()
      // let blob
      // reader.readAsBinaryString(file)
      // reader.onloadend = event => {
      //   console.log(event)
      //   blob = event.target.result
      // console.log('binary blob', blob)
      const url = 'https://kinopio-uploads.us-east-1.linodeobjects.com'

      console.log('🥦', file, cardId)
      console.log('🍡', utils.clone(policy), policyData, url, policyData.conditions[0], policy.policy, atob(policy.policy))
      // }

      // const options = {
      //   method: 'PUT',
      // body:
      // }

      const response = await fetch(url, {
        method: 'POST',
        body: formData
      })
      console.log('🍒', response)
      // const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
      // const options = {}

      // const response = await fetch(`${host}/operations`, options)

      // var uploadData = { ratio: Observable(0) };
      // self.pendingUploads.push(uploadData);
      // return self.getPolicy()
      //     .then(function (policy) {
      //     return S3Uploader(policy).upload({
      //         key: file.name,
      //         blob: file
      //     }).progress(self.generateUploadProgressEventHandler(uploadData));
      // }).finally(function () {
      //     self.pendingUploads.remove(uploadData);
      //     self.currentProject().updatedAt((new Date()).toISOString());
      //     return self.currentProject().save(self.api());
      // });
    }
  }
}
