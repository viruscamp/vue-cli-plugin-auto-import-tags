const cache = new Map()

function set (key, value) {
  cache.set(key, value)
}

function get (key) {
  return cache.get(key)
}

module.exports.set = set
module.exports.get = get
