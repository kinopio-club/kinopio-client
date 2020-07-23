import utils from '@/utils.js'

export default {
  namespaced: true,
  state: {
    s3Policy: undefined
  },
  mutations: {
    s3Policy: (state, value) => {
      utils.typeCheck(value, 'object')
      state.s3Policy = value
    }
  },
  actions: {
    updateS3Policy: async (context, options) => {
      const s3Policy = await context.dispatch('api/getS3Policy', null, { root: true })
      console.log('🍡', s3Policy)
      context.commit('s3Policy', s3Policy)
    }
  }
}
