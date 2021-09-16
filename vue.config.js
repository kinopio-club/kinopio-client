// https://cli.vuejs.org/config/#vue-config-js
module.exports = {
  // configureWebpack: {
  //   output: {
  //     filename: '[name].[hash].js'
  //   },
  //   devServer: {
  //     disableHostCheck: true,
  //     host: 'localhost'
  //   }
  // },

  chainWebpack: config => {
    config.resolve.alias.set('vue', '@vue/compat')
    config.module
      .rule('vue')
      .use('vue-loader')
      .tap(options => {
        return {
          ...options,
          compilerOptions: {
            compatConfig: {
              MODE: 2
            }
          }
        }
      })
  }

}
