const xml2js = require('xml2js')

module.exports = (xml) => new Promise((resolve, reject) => {
  xml2js.parseString(xml, (err, result) => {
    if (err) {
      reject(err)
    } else {
      resolve(result)
    }
  })
})
