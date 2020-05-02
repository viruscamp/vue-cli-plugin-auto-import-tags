const path = require('path')
const appRoot = require('app-root-path');
const Cache = require('sync-disk-cache')

const cache = new Cache('template-tags', {
  location: path.join(appRoot.path, 'node_modules/.cache/vue-auto-import-tags')
})

//const cache = new Map()

function set (key, tagsSet) {
  cache.set(key, JSON.stringify(Array.from(tagsSet)))
}

function get (key) {
  const content = cache.get(key).value
  return content == null ? content : JSON.parse(content)
}

module.exports.set = set
module.exports.get = get
