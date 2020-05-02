const extractTagsFromAst = require('./extract-tags-from-ast')
const tagsCache = require('./tags-cache')

module.exports = {
  postTransformNode (el, options) {
    if (el.parent == null) {
      console.log('auto-import-tag postTransformNode root ' + options.filename)
      tagsCache.set(options.filename, extractTagsFromAst(el))
    }
  }
}
