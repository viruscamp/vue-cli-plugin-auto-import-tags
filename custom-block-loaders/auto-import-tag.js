const babel = require("@babel/core");
const babelConfig = babel.loadOptions()

const tagPrefixToImportOption = new Map()
if (babelConfig.plugins) {
  babelConfig.plugins.forEach(plugin => {
    // TODO 更好的检查 babel-plugin-import 配置的逻辑
    if (/[\\/]babel-plugin-import[\\/]/.test(plugin.key)) {
      let options = plugin.options
      if (!Array.isArray(options)) {
        options = [options]
      }
      options.forEach(opts => {
        if (typeof(opts) === 'object') {
          let tagPrefix = opts.tagPrefix
          if (typeof(tagPrefix) === 'string' && typeof(opts.libraryName) === 'string') {
            tagPrefixToImportOption.set(tagPrefix + '-', opts)
          }
        }
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
  let opts = tagPrefixToImportOption.get(prefix)
  let compnentName = dash2Camel(tag.substr(prefix.length)) // AutoComplete
  let libraryName = opts.libraryName
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
    for (const prefix of tagPrefixToImportOption.keys()) {
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
      output += `  if (c.${i.fullName} == null && c['${i.tag}'] == null) c.${i.fullName} = ${i.fullName}\n`
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
    if (c[i.fullName] == null && c[i.tag] == null) c[i.fullName] = i.component
  })
}
`
  }
  this.callback(null, output)
}
