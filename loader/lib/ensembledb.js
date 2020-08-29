const db = require('mssql-async/db')

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
        await db.update(`
          WITH ENC AS (
            SELECT TOP 1 * FROM Encodings WHERE VideoID=@VideoID AND NOT IsDeleted ORDER BY Width DESC
          ) UPDATE ENC SET IsDefault=1
        `, { VideoID })
      }
    })
  }
}

module.exports = new Db()
