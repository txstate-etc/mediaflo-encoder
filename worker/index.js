const db = require('mysql2-async/db').default
const { sleep } = require('txstate-utils')
const processjob = require('./lib/process')
const { UpscaleError } = require('./lib/errors')
const fsp = require('fs').promises

async function getajob () {
  const job = await db.getrow('SELECT * FROM queue WHERE status="waiting" ORDER BY job_created LIMIT 1')
  if (job) {
    const mine = await db.update('UPDATE queue SET status="working", encoding_lastupdated=NOW() WHERE status="waiting" AND id=?', [job.id])
    if (mine) {
      console.debug('I got a job!', job.id)
      try {
        await processjob(job)
        await db.update('UPDATE queue SET encoding_lastupdated=NOW(), status="success" WHERE id=?', [job.id])
        const finaljob = await db.getrow('SELECT * FROM queue WHERE id=?', [job.id])
        console.debug('finished processing job', finaljob)
      } catch (error) {
        await db.update('UPDATE queue SET encoding_lastupdated=NOW(), status="error", error=? WHERE id=?', [error.toString(), job.id])
        error.job = job
        throw error
      }
    }
  }
}

async function dbready () {
  let lasterror
  for (let i = 0; i < 5; i++) {
    try {
      await db.getall('SHOW COLUMNS FROM queue')
      return
    } catch (e) {
      lasterror = e
    }
    await sleep(2000)
  }
  throw lasterror
}

async function main () {
  await db.wait()
  if (process.env.NODE_ENV === 'development') {
    try {
      await dbready()
      const testfiles = await fsp.readdir('/video_src', { withFileTypes: true })
      for (const file of testfiles) {
        if (file.isFile() && file.name !== '.DS_Store') {
          const id = file.name.substr(0, 20)
          const filedest = file.name.replace(/\.\w+$/, '.mp4')
          await db.delete('DELETE FROM queue WHERE id=?', [id])
          await db.insert('INSERT INTO queue (id, name, source_path, dest_path, resolution, always_encode) VALUES (?,?,?,?,?,1)',
            [id, file.name, `/video_src/${file.name}`, `/video_dest/${filedest}`, 360])
        }
      }
    } catch (e) {
      console.warn(e)
    }
  }
  while (true) {
    try {
      await getajob()
    } catch (err) {
      if (err instanceof UpscaleError) {
        console.info('abandoned job due to upscale restriction', err.job)
      } else {
        console.error(err)
      }
    } finally {
      await sleep(1000)
    }
  }
}
main()
