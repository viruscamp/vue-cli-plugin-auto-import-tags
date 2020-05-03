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
    const dashTag = camel2Dash(tag)
    if (dashTag.includes('-')) {
      tags.add(dashTag)
      return true
    }
    return false
  }

  function parseAst (ast) {
    if (ast.type === 1) {
      // ast is ASTElement
      // https://github.com/vuejs/vue/blob/dev/packages/vue-template-compiler/types/index.d.ts#L90:1
      if (ast.tag) {
        tryAddTag(ast.tag)
      }
      if (ast.children) {
        ast.children.forEach(parseAst)
      }
    }
  }

  parseAst(ast)
  return tags
}

module.exports = extractTagsFromAst
