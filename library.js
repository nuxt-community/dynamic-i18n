const path = require('path')

function loadProvider(providerName) {
  return require('./providers/' + providerName + '-provider');
}

async function importI18n({ path, conf, log }) {
  const provider = loadProvider(conf.provider)

  return provider.importI18n({ path, conf, log })
}

module.exports = {
  importI18n
}
