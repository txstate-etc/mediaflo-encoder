const mysql = require('mysql')
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'secret',
  database: process.env.DB_DATABASE || 'mediaflo_encoder'
})

module.exports = function (...args) {
  return new Promise((resolve, reject) => {
    pool.getConnection((error, connection) => {
      if (error) return reject(error)
      connection.query(...args, (error, ...ret) => {
        connection.release()
        if (error) return reject(error)
        resolve(...ret)
      })
    })
  })
}
