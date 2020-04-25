const VueTemplateCompiler = require('vue-template-compiler')
const tagsCache = require('./tagsCache')

function looseStringParse (str) {
  /* eslint-disable no-new-func */
  return Function(`'use strict';return (${str});`)()
}

function isValidComponentTag (tag) {
  // It is build-time now, the imported Vue is not the runtime one.
  // Function isUnknownElement of build-time always returns true.
  // if (Vue.config.isUnknownElement(tag))
  // Can I get Vue of output platform (weex or web or other).
  // if (Vue.config.isReservedTag(tag))
  // A tag contains '-' and [A-Z] must be invalid
  if (tag.indexOf('-') >= 0 && /[A-Z]/.test(tag)) {
    return false
  }
  return true
}

/*
 * Copy from 'babel-plugin-import/lib/Plugin.js'
 *  a-button -> a-button
 *  AButton -> a-button
*/
function camel2Dash (_str) {
  const str = _str[0].toLowerCase() + _str.substr(1);
  return str.replace(/([A-Z])/g, $1 => `-${$1.toLowerCase()}`);
}

function extractTagsFromAst (ast) {
  const tags = new Set()

  function tryAddTag (tag) {
    if (isValidComponentTag(tag)) {
      tags.add(camel2Dash(tag))
      return true
    }
    return false
  }

  function parseAst (ast) {
    if (ast.type === 1) {
      // ast is ASTElement
      // https://github.com/vuejs/vue/blob/dev/packages/vue-template-compiler/types/index.d.ts#L90:1
      if (ast.component) {
        // for <component is="a-input" /> or <component :is="'a-input'" />
        // will fail on <component :is="dynamicComponent" />
        // may be dangerous, maybe useless
        try {
          let componentName = looseStringParse(ast.component)
          if (typeof(componentName) === 'string') {
            tryAddTag(componentName)
          }
        } catch (ex) {
          // do nothing
        }
      } else {
        tryAddTag(ast.tag)
      }
      if (ast.children) {
        ast.children.forEach(child => parseAst(child))
      }
    }
  }

  parseAst(ast)
  return tags
}

const { attrsToQuery } = require('vue-loader/lib/codegen/utils')

module.exports = function createVueTemplateCompilerWrapper (compiler) {
  const innerCompiler = compiler || VueTemplateCompiler
  return {
    parseComponent (source, options) {
      const descriptor = innerCompiler.parseComponent(source, options)
      if (descriptor.template != null) {
        // see https://github.com/vuejs/vue-loader/blob/master/lib/index.js#L94
        // const idQuery = `&id=${id}` // TODO generate idQuery
        const hasScoped = descriptor.styles.some(s => s.scoped)
        descriptor.customBlocks.push({
          type: 'auto-import-tag',
          content: source, // TODO generate idQuery , cause I cannot get id here, I must pass source to where id can be calucated
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
      console.log('auto-import-tag compile ' + options.filename)
      const compiled = innerCompiler.compile(template, options)
      if (compiled.ast != null) {
        tagsCache.set(options.filename, extractTagsFromAst(compiled.ast))
      }
      return compiled
    },
    ssrCompile (template, options) {
      console.log('auto-import-tag ssrCompile ' + options.filename)
      const compiled = innerCompiler.ssrCompile(template, options)
      if (compiled.ast != null) {
        tagsCache.set(options.filename, extractTagsFromAst(compiled.ast))
      }
      return compiled
    }
  }
}
