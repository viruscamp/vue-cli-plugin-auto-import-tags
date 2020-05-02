const VueTemplateCompiler = require('vue-template-compiler')
const { attrsToQuery } = require('vue-loader/lib/codegen/utils')

const extractTagsFromAst = require('./extract-tags-from-ast')
const tagsCache = require('./tags-cache')

module.exports = function createVueTemplateCompilerWrapper (compiler) {
  const innerCompiler = compiler || VueTemplateCompiler
  return {
    ...innerCompiler,
    parseComponent (source, options) {
      const descriptor = innerCompiler.parseComponent(source, options)
      if (descriptor.template != null) {
        // see https://github.com/vuejs/vue-loader/blob/master/lib/index.js#L94
        // const idQuery = `&id=${id}` // TODO generate idQuery
        const hasScoped = descriptor.styles.some(s => s.scoped)
        descriptor.customBlocks.push({
          type: 'auto-import-tags',
          content: '', //source, // TODO generate idQuery , cause we cannot get id here, we must pass source to where id can be calucated
          attrs: {
            idQuery: '', // TODO generate idQuery
            scopedQuery: hasScoped ? `&scoped=true` : ``,
            attrsQuery: attrsToQuery(descriptor.template.attrs),
            inheritQuery: `&` // TODO should be `&${rawQuery}`
          }
        })
      }
      return descriptor
    },
    compile (template, options) {
      console.log('auto-import-tags compile ' + options.filename)
      const compiled = innerCompiler.compile(template, options)
      if (compiled.ast != null) {
        tagsCache.set(options.filename, extractTagsFromAst(compiled.ast))
      }
      return compiled
    },
    ssrCompile (template, options) {
      console.log('auto-import-tags ssrCompile ' + options.filename)
      const compiled = innerCompiler.ssrCompile(template, options)
      if (compiled.ast != null) {
        tagsCache.set(options.filename, extractTagsFromAst(compiled.ast))
      }
      return compiled
    }
  }
}
