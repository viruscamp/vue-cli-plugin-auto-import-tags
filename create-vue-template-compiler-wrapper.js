//import { parse } from 'vue/src/compiler/parser'
//const compile = require('vue-template-compiler').compile
//import * as VueTemplateCompiler from 'vue-template-compiler'
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
    if (ast.component) {
      try {
        let componentName = looseStringParse(ast.component)
        if (typeof(componentName) === 'string') {
          tryAddTag(componentName)
        }
      } catch (ex) {
        // do nothing
      }
    } else if (typeof(ast.tag) === 'string') {
      tryAddTag(ast.tag)
    }
    if (ast.children) {
      ast.children.forEach(child => parseAst(child))
    }
  }
  parseAst(ast)
  return tags
}

module.exports = function createVueTemplateCompilerWrapper (compiler) {
  const innerCompiler = compiler || VueTemplateCompiler
  return {
    parseComponent (source, options) {
      const descriptor = innerCompiler.parseComponent(source, options)
      descriptor.customBlocks.push({
        type: 'auto-import-tag',
        content: '',
        attrs: {},
        start: 0,
        end: 0
      })
      return descriptor
    },
    compile (template, options) {
      const compiled = innerCompiler.compile(template, options)
      const ast = compiled.ast
      console.log('key in compile ' + options.filename)
      tagsCache.set(options.filename, extractTagsFromAst(ast))
      return compiled
    },
    ssrCompile (template, options) {
      const compiled = innerCompiler.ssrCompile(template, options)
      const ast = compiled.ast
      console.log('key in ssrCompile ' + options.filename)
      tagsCache.set(options.filename, extractTagsFromAst(ast))
      return compiled
    }
  }
}
