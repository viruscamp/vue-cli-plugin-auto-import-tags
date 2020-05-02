const createVueTemplateCompilerWrapper = require('./create-vue-template-compiler-wrapper')
//const collectTagsCompilerModule = require('./collect-tags-compiler-module')

module.exports = (api, projectOptions) => {
  api.chainWebpack(webpackConfig => {
    webpackConfig.module
      .rule('vue')
        .use('vue-loader')
          .loader('vue-loader')
          .tap(options => {
            options.compiler = createVueTemplateCompilerWrapper(options.compiler)
            /*
            if (options.compilerOptions == null) options.compilerOptions = {}
            if (options.compilerOptions.modules == null) options.compilerOptions.modules = []
            options.compilerOptions.modules.push(collectTagsCompilerModule)
            */
            return options
          })

    webpackConfig.module
      .rule('vue-custom-block-auto-import-tags')
        .resourceQuery(/blockType=auto-import-tags/)
        .use('babel-loader')
          .loader('babel-loader')
          .end()
        .use('auto-import-tags')
          .loader(require.resolve('./auto-import-tags-loader'))
          .end()
  })
}
