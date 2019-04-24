const childprocess = require('child_process')

module.exports = (job, info) => {
  if (job.resolution > 360) throw new UpscaleError('Audio only, skipping higher quality encode.')
  const child = childprocess.spawn('ffmpeg', [
    '-i', job.source_path,
    '-vn', // disable video output
    '-codec:a', 'libmp3lame', '-ac', 2, '-q:a', 5,
    job.dest_path
  ])
  return new Promise((resolve, reject) => {
    child.stdout.on('data', chunk => {
      const line = chunk.toString('utf8')
      console.log(line)
      const m = line.match(/(\d+\.\d+)\s?%/i)
      if (Array.isArray(m) && m[0]) {
        const progress = parseFloat(m[0])
        db.update('UPDATE queue SET percent_complete=?, encoding_lastupdated=NOW() WHERE id=?', progress, job.id).catch(err => console.log(err))
      }
    })
    child.stderr.on('data', chunk => {
      // debug info, unnecessary for now
    })
    child.on('close', (code) => {
      if (code) reject(new Error('HandBrake returned failure code.'))
      else resolve()
    })
  })
}
