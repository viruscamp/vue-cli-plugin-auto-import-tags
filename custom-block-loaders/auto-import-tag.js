const babel = require("@babel/core");
const babelConfig = babel.loadPartialConfig()

const mapTagPrefixToLibraryName = new Map()
function tryAddTagPrefixToLibraryName (libraryName, opts) {
  if (typeof(opts) === 'object') {
    if (typeof(opts.libraryName) === 'string') {
      libraryName = opts.libraryName
    }
    if (typeof(opts.tagPrefix) === 'string' && libraryName != null) {
      let key = opts.tagPrefix + '-'
      if (mapTagPrefixToLibraryName.has(key)) {
        console.warn(`Duplcate tagPrefix '${opts.tagPrefix}' for libraryName '${mapTagPrefixToLibraryName.get(key)}' and '${libraryName}'.`)
        return
      }
      mapTagPrefixToLibraryName.set(key, libraryName)
    }
  }
}
if (babelConfig.options && babelConfig.options.plugins) {
  babelConfig.options.plugins.forEach(plugin => {
    // https://github.com/ant-design/babel-plugin-import
    // if (/[\\/]babel-plugin-import[\\/]/.test(plugin.key))
    if (plugin.file.request === 'import') {
      let options = plugin.options
      if (!Array.isArray(options)) {
        // babel@7+ options cannot be array
        options = [options]
      }
      for (let opts of options) {
        tryAddTagPrefixToLibraryName(null, opts)
      }
    }
    // https://github.com/viruscamp/babel-plugin-transform-imports/tree/babel-7
    // if (/[\\/]babel-plugin-transform-imports[\\/]/.test(plugin.key))
    if (plugin.file.request === 'transform-imports') {
      for (let [libraryName, opts] of Object.entries(plugin.options)) {
        tryAddTagPrefixToLibraryName(libraryName, opts)
      }
    }
  })
}

function isValidImport (compnentName, libraryName) {
  // TODO 检查 库中是否存在组件
  /* 目前仍然生成了
  import { Abc as AAbc } from 'ant-design-vue'
  */
  return true
}

const tagComponents = new Map()
function getTagComponent (tag, prefix) {
  if (!tag.startsWith(prefix)) {
    return null
  }
  if (tagComponents.has(tag)) {
    return tagComponents.get(tag)
  }
  let compnentName = dash2Camel(tag.substr(prefix.length)) // AutoComplete
  let libraryName = mapTagPrefixToLibraryName.get(prefix)
  if (!isValidImport(compnentName, libraryName)) {
    return null
  }
  const tagComponent = {
    libraryName, // 'ant-design-vue'
    compnentName, // 'AutoComplete'
    fullName: dash2Camel(tag), // 'AAutoComplete'
    tag // 'a-auto-complete'
  }
  tagComponents.set(tag, tagComponent)
  return tagComponent
}

function dash2Camel (_str) {
  let str = _str.replace(/-([a-z])/g, (_, g1) => g1.toUpperCase())
  return str[0].toUpperCase() + str.substr(1)
}

const tagsCache = require('../tagsCache')

function autoImportTagCodeGenerate (source, map, resourcePath) {
  const tags = tagsCache.get(resourcePath)
  const imports = []
  if (tags != null) {
      tags.forEach(tag => {
      for (const prefix of mapTagPrefixToLibraryName.keys()) {
        let tc = getTagComponent(tag, prefix)
        if (tc != null) {
          imports.push(tc)
          break
        }
      }
    })
  }

  let output = ''
  if (imports.length === 0) {
    output = 'export default function (Component) {}\n'
  } else {
    imports.forEach(i => {
      output += `import { ${i.compnentName} as ${i.fullName} } from '${i.libraryName}'\n`
    })
    output += '\nexport default function (Component) {\n'
    output += '  let c = Component.options.components\n'
    output += '  if (c == null) c = Component.options.components = {}\n'
    imports.forEach(i => {
      output += `  if (c.${i.fullName} == null) c.${i.fullName} = ${i.fullName}\n`
    })
    output += '}\n'
  }
  return output
}

const loaderUtils = require('loader-utils')
const path = require('path')
const hash = require('hash-sum')

function getTemplateRequest (loaderContext, source) {
  const resourcePath = loaderContext.resourcePath

  const options = loaderUtils.getOptions(loaderContext) || {}
  const isProduction = options.productionMode || loaderContext.minimize || process.env.NODE_ENV === 'production'
  const context = loaderContext.rootContext || process.cwd()
  // module id for scoped CSS & hot-reload
  const rawShortFilePath = path
    .relative(context, resourcePath)
    .replace(/^(\.\.[\/\\])+/, '')
  const shortFilePath = rawShortFilePath.replace(/\\/g, '/') // + resourceQuery // TODO how to get original resourceQuery
  const id = hash(
    isProduction
      ? (shortFilePath + '\n' + source)
      : shortFilePath
  )
  const idQuery = `&id=${id}`
  const { scopedQuery, attrsQuery, inheritQuery } = loaderUtils.parseQuery(loaderContext.resourceQuery)
  // see https://github.com/vuejs/vue-loader/blob/master/lib/index.js#L118
  return `${resourcePath}?vue&type=template${idQuery}${scopedQuery}${attrsQuery}${inheritQuery}`
}

module.exports = function autoImportTagLoader (source, map) {
  const loaderContext = this
  const callback = loaderContext.async()
  const resourcePath = loaderContext.resourcePath
  loaderContext.loadModule(getTemplateRequest(loaderContext, source), (err, templateSource, templateSourceMap, module) => {
    console.log('auto-import-tag loader async ' + resourcePath)
    const output = autoImportTagCodeGenerate(source, map, resourcePath)
    callback(null, output)
  })
}
