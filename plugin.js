import Vue from 'vue'
import VueI18n from 'vue-i18n'
import axios from 'axios'

Vue.use(VueI18n)

function generateUrl(language) {
  const path = '/i18n/<%= options.outputFilePrefix %>' + '-' + language + '.json'

  let url = path
  const host = process.env.HOST || process.env.npm_package_config_nuxt_host || 'localhost'
  const port = process.env.PORT || process.env.npm_package_config_nuxt_port || 3000

  return 'http://' + host + ':' + port + url
}

export default async ({ app, store, beforeNuxtRender }) => {
  const languages = '<%= options.languages %>'.split(',')
  let languagesSrc = {}

  // On server side
  if (process.server) {
    for (const language of languages) {
      const { data } = await axios(generateUrl(language))

      languagesSrc[language] = data
    }

    beforeNuxtRender(({ nuxtState }) => {
      nuxtState.i18n = languagesSrc
    })
  }

  // On client side
  if (process.client) {
    languagesSrc = window.__NUXT__.i18n
  }

  // Set i18n instance on app
  app.i18n = new VueI18n({
    locale: store.state['<%= options.localeNamespaceStore %>'].locale,
    fallbackLocale: '<%= options.fallbackLocale %>',
    messages: languagesSrc
  })
}
