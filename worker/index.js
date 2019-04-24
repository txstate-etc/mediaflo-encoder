const db = require('txstate-node-utils/lib/mysql')
const _ = require('txstate-node-utils/lib/util')
const processjob = require('./lib/process')
const { UpscaleError } = require('./lib/errors')
const fsp = require('fs').promises

async function getajob () {
  const job = await db.getrow('SELECT * FROM queue WHERE status="waiting" ORDER BY job_created LIMIT 1')
  if (job) {
    const mine = await db.update('UPDATE queue SET status="working", encoding_lastupdated=NOW() WHERE status="waiting" AND id=?', job.id)
    if (mine) {
      console.log('I got a job!', job.id)
      try {
        await processjob(job)
        await db.update('UPDATE queue SET encoding_lastupdated=NOW(), status="success" WHERE id=?', job.id)
        const finaljob = await db.getrow('SELECT * FROM queue WHERE id=?', job.id)
        console.log('finished processing job', finaljob)
      } catch (error) {
        await db.update('UPDATE queue SET encoding_lastupdated=NOW(), status="error", error=? WHERE id=?', error.toString(), job.id)
        error.job = job
        throw error
      }
    }
  }
}

async function main () {
  if (process.env.NODE_ENV === 'development') {
    try {
      const testfiles = await fsp.readdir('/video_src', { withFileTypes: true })
      for (const file of testfiles) {
        if (file.isFile()) {
          const filedest = file.name.endsWith('.wav') ? file.name.replace(/\.\w+$/, '.mp3') : file.name.replace(/\.\w+$/, '.mp4')
          await db.execute('DELETE FROM queue WHERE id=?', file.name)
          await db.insert('INSERT INTO queue (id, name, source_path, dest_path, resolution) VALUES (?,?,?,?,?)',
            file.name, file.name, `/video_src/${file.name}`, `/video_dest/${filedest}`, 360)
        }
      }
    } catch (e) {
      console.log(e)
    }
  }
  while (true) {
    try {
      await getajob()
    } catch (err) {
      if (err instanceof UpscaleError) {
        console.log('abandoned job due to upscale restriction', err.job)
      } else {
        console.log(err)
      }
    } finally {
      await _.sleep(1000)
    }
  }
}
main()
