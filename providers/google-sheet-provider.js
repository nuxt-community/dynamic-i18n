const _ = require('lodash')
const fs = require('fs')
const path = require('path')

const { GoogleSpreadsheet } = require('google-spreadsheet')
const KEYS = 'KEYS'
const VARS = 'VARS'

function cb(fn, ...args) {
  return new Promise((resolve, reject) => {
    fn(...args, (err, result) => {
      if (err) return reject(err)
      resolve(result)
    })
  })
}

function checkExportConfigurationFile(conf) {
  const fields = ['providerKey', 'credentials']

  return _.every(fields, _.partial(_.has, conf))
}

function formatCell(cell) {
  if (!cell) return ''

  return cell.replace(/(\r\n|\n|\r)/gm, "", '').replace(/ /g, '').split(',')
}

async function extract({ rows, path, conf }) {
  var i18n = {}

  _.forEach(conf.languages, (language) => {
    i18n[language] = {}
  })

  _.each(rows, (row) => {
    const keys = formatCell(row[KEYS])
    const variables = formatCell(row[VARS])

    if (keys.length > 0) {
      _.forEach(conf.languages, (language) => {
        if (_.has(row, language.toUpperCase())) {
          const value = row[language.toUpperCase()].replace(/  +/g, ' ')

          assignValue(i18n, language, keys, variables, value)
        }
      })
    }
  })

  if (!path) return i18n

  return save(i18n, path, conf)
}

async function save(i18n, directory, conf) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory)
  }

  _.forEach(conf.languages, (language) => {
    const filePath = path.join(directory, `${conf.outputFilePrefix}-${language}.json`)
    const jsonData = JSON.stringify(i18n[language], null, 4)

    try {
      fs.writeFileSync(filePath, jsonData)
    } catch (err) {
      return Promise.reject(err)
    }
  })

  return i18n
}

function assignValue(i18n, language, keys, variables, value) {
  _.each(keys, (key) => {
    if (!_.isEmpty(key)) {
      const tree = key.split('.')
      const object = getObjectFromTree(i18n[language], tree.slice(0, tree.length - 1))
      const val = parseValue(value, variables)
      if (!_.isEmpty(val)) {
        object[tree[tree.length - 1]] = val
      }
    }
  })
}

function parseValue(value, variables) {
  if (_.isEmpty(variables)) return value

  var parsed = value
  _.each(variables, function (variable, index) {
    if (!_.isEmpty(variable)) {
      parsed = parsed.replace(new RegExp('\\[' + (index + 1) + '\\]', 'g'), '{{' + variable + '}}')
    }
  })

  return parsed
}

function getObjectFromTree(object, tree) {
  const key = tree.splice(0, 1)[0]
  if (!object[key]) object[key] = {}

  return (tree.length > 0) ? getObjectFromTree(object[key], tree) : object[key]
}

async function importI18n({ path, conf, log }) {
  if (!checkExportConfigurationFile(conf)) return Promise.reject('Bad configuration file')

  const doc = new GoogleSpreadsheet(conf['providerKey'])

  await doc.useServiceAccountAuth(conf.credentials)
  await doc.loadInfo()

  // If no gid provided we load the first tab
  const worksheet = conf.id ? doc.sheetsById[conf.id] : doc.sheetsByIndex[0]

  if (!worksheet) return Promise.reject(`Unable to find ${conf.id} worksheet tab`)

  const rows = await worksheet.getRows()
  const i18n = await extract({ rows, path, conf, log })

  log(`Extract: ${rows.length} rows`)

  return i18n
}

module.exports = {
  importI18n
}
