const mssql = require('mssql')
const _ = require('txstate-node-utils/lib/util')

class Db {
  constructor () {
    this.pool = new mssql.ConnectionPool({
      server: process.env.ENSEMBLEDB_HOST || 'mssql',
      domain: process.env.ENSEMBLEDB_DOMAIN || 'domain',
      user: process.env.ENSEMBLEDB_USER || 'ensemble',
      password: process.env.ENSEMBLEDB_PASS || 'secret',
      database: process.env.ENSEMBLEDB_DATABASE || 'default_database'
    })
  }

  async wait () {
    while (true) {
      try {
        await this.pool.connect()
        return
      } catch (error) {
        // sleep and try again
        console.warn('Unable to connect to Ensemble Database, trying again in 2 seconds.')
        await _.sleep(2000)
      }
    }
  }

  async query (sql, bindvalues) {
    const req = this.pool.request()
    for (const [key, val] of Object.entries(bindvalues)) {
      req.input(key, val)
    }
    return req.query(sql)
  }

  async dropencodingforjob (jobid) {
    return this.query('UPDATE Encodings SET IsDeleted=1 FROM Transcoding.TranscodingJobs tj join ServiceJobs sj on tj.ID = sj.ReferenceID join Encodings e on sj.MediaID=e.EncodingID WHERE tj.TranscoderJobId = @jobid', {
      jobid: jobid
    })
  }
}

module.exports = new Db()
