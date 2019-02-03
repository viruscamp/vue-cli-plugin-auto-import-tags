const babel = require("@babel/core");
const babelConfig = babel.loadOptions()

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
if (babelConfig.plugins) {
  babelConfig.plugins.forEach(plugin => {
    // TODO 更好的检查 babel-plugin-* 配置的逻辑
    // https://github.com/ant-design/babel-plugin-import
    if (/[\\/]babel-plugin-import[\\/]/.test(plugin.key)) {
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
    if (/[\\/]babel-plugin-transform-imports[\\/]/.test(plugin.key)) {
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

module.exports = function autoImportTemplateLoader (source, map) {
  const imports = []
  const tags = JSON.parse(source)
  tags.forEach(tag => {
    for (const prefix of mapTagPrefixToLibraryName.keys()) {
      let tc = getTagComponent(tag, prefix)
      if (tc != null) {
        imports.push(tc)
        break
      }
    }
  })

  let output = ''
  if (imports.length === 0) {
    output = 'export default function (Component) {}\n'
  } else if (imports.length < 10) {
    // 生成的代码 已经展开 不用循环
    imports.forEach(i => {
      output += `import { ${i.compnentName} as ${i.fullName} } from '${i.libraryName}'\n`
    })
    output += '\nexport default function (Component) {\n'
    output += '  const c = Component.options.components\n'
    imports.forEach(i => {
      output += `  if (c.${i.fullName} == null) c.${i.fullName} = ${i.fullName}\n`
    })
    output += '}\n'
  } else {
    // 生成的代码 使用循环
    output = 'const autoImports = []\n'
    imports.forEach(i => {
      output += `import { ${i.compnentName} as ${i.fullName} } from '${i.libraryName}'\n`
      output += `autoImports.push({fullName: '${i.fullName}', tag: '${i.tag}', component: ${i.fullName}})\n`
    })
    output +=
`
export default function (Component) {
  const c = Component.options.components
  autoImports.forEach(i => {
    if (c[i.fullName] == null) c[i.fullName] = i.component
  })
}
`
  }
  this.callback(null, output)
}
