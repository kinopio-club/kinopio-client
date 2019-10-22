// https://cli.vuejs.org/config/#vue-config-js
module.exports = {
  configureWebpack: {
    output: {
      filename: '[name].[hash].js'
    },
    devServer: {
      disableHostCheck: true,
      host: 'localhost'
    }
  }
}
