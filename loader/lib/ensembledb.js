const db = require('mssql-async/db').default
const mysql = require('txstate-node-utils/lib/mysql')

class Db {
  async dropencodingforjob (jobid) {
    return db.transaction(async db => {
      const { VideoID, EncodingID, IsDefault } = await db.getrow(`
        SELECT e.VideoID, e.EncodingID, e.IsDefault
        FROM Transcoding.TranscodingJobs tj
        JOIN ServiceJobs sj ON tj.ID = sj.ReferenceID
        JOIN Encodings e ON sj.MediaID=e.EncodingID
        WHERE tj.TranscoderJobId = @jobid
      `, { jobid })
      await db.update('UPDATE Encodings SET IsDefault=0, IsDeleted=1 WHERE EncodingID=@EncodingID', { EncodingID })
      if (IsDefault) {
        const otherjobs = await db.getall(`
          SELECT e.EncodingID, tj.TranscoderJobId
          FROM Encodings e
          JOIN ServiceJobs sj ON sj.MediaID=e.EncodingID
          JOIN Transcoding.TranscodingJobs tj ON tj.ID = sj.ReferenceID
          WHERE e.VideoID=@VideoID AND e.IsDeleted!=1 AND e.EncodingID!=@EncodingID
        `, { VideoID, EncodingID })
        const bestJobId = await mysql.getval(`SELECT id FROM queue WHERE id IN (${otherjobs.map(j => '?').join(',')}) ORDER BY resolution DESC LIMIT 1`, ...otherjobs.map(j => j.TranscoderJobId))
        const bestEncodingID = otherjobs.find(j => j.TranscoderJobId === bestJobId).EncodingID
        await db.update('Update Encodings SET IsDefault=1 WHERE EncodingID=@bestEncodingID', { bestEncodingID })
      }
    })
  }
}

module.exports = new Db()
