const createVueTemplateCompilerWrapper = require('./create-vue-template-compiler-wrapper')

module.exports = (api, projectOptions) => {
  api.chainWebpack(webpackConfig => {
    webpackConfig.module
      .rule('vue')
      .use('vue-loader')
        .loader('vue-loader')
        .tap(options => {
          options.compiler = createVueTemplateCompilerWrapper(options.compiler)
          return options
        })

    webpackConfig.module
      .rule('auto-import-tag')
        .resourceQuery(/blockType=auto-import-tag/)
        .use('vue-loader')
          .loader(require.resolve('./custom-block-loaders/auto-import-tag'))
          .end()
  })
}
