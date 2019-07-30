const db = require('txstate-node-utils/lib/mssql')

class Db {
  async dropencodingforjob (jobid) {
    return db.update('UPDATE Encodings SET IsDeleted=1 FROM Transcoding.TranscodingJobs tj join ServiceJobs sj on tj.ID = sj.ReferenceID join Encodings e on sj.MediaID=e.EncodingID WHERE tj.TranscoderJobId = @jobid', {
      jobid: jobid
    })
  }
}

module.exports = new Db()
