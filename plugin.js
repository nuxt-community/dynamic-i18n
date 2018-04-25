const path = require('path')

import Vue from 'vue'
import VueI18n from 'vue-i18n'

Vue.use(VueI18n)

export default ({ app, store }) => {
  const languages = '<%= options.languages %>'.split(',')
  const languagesSrc = {}

  languages.forEach((language) => {
    languagesSrc[language] = require('<%= options.path  %>' + '/' + '<%= options.outputFilePrefix %>' + '-' + language + '.json')
  })
  // Set i18n instance on app
  app.i18n = new VueI18n({
    locale: store.state['<%= options.localeNamespaceStore %>'].locale,
    fallbackLocale: '<%= options.fallbackLocale %>',
    messages: languagesSrc
  })
}
