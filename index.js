const path = require('path')
const library = require('./library')

const defaults = {
  provider: 'google-sheet',
  languages: ['en'],
  fallbackLocale: 'en',
  outputFilePrefix: 'locale',
  maxAge: 1000 * 60 * 60,
  localeNamespaceStore: 'i18n',
  staticFolder: 'i18n'
}

async function importI18n({ conf, log, error }) {
  return library.importI18n({
    path: conf.path,
    conf,
    log,
    error
  })
}

module.exports = async function nuxtDynamicI18n(_moduleOptions) {
  // Set default translate path into static directory
  defaults.path = path.join(this.nuxt.options.srcDir, this.nuxt.options.dir.static, defaults.staticFolder)
  // Get options from module injection
  const conf = Object.assign(defaults, this.options.dynamicI18n, _moduleOptions)

  const importOptions = {
    conf,
    log: console.log,
    error: console.error
  }

  // Load translates from provider
  await importI18n(importOptions)

  this.addPlugin({
    src: path.resolve(__dirname, 'plugin.js'),
    options: conf
  })

  if (conf.maxAge) setInterval(() => importI18n(importOptions), conf.maxAge)
}

module.exports.meta = require('./package.json')
