const mssql = require('mssql')

class Db {
  constructor () {
    var mypool = new mssql.ConnectionPool({
      server: process.env.ENSEMBLEDB_HOST || 'mssql',
      domain: process.env.ENSEMBLEDB_DOMAIN || 'domain',
      user: process.env.ENSEMBLEDB_USER || 'ensemble',
      password: process.env.ENSEMBLEDB_PASS || 'secret',
      database: process.env.ENSEMBLEDB_DATABASE || 'default_database'
    })
    mypool.connect()

    this.pool = mypool
  }

  async dropencodingforjob (jobid) {
      var request = new mssql.Request(this.pool)
      request.input('jobid',jobid)
      await request.query('UPDATE Encodings SET IsDeleted=1 FROM Transcoding.TranscodingJobs tj join ServiceJobs sj on tj.ID = sj.ReferenceID join Encodings e on sj.MediaID=e.EncodingID WHERE tj.TranscoderJobId = @jobid')
  }
}

module.exports = new Db()
