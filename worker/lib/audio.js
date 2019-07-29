const childprocess = require('child_process')
const db = require('txstate-node-utils/lib/mysql')
const { UpscaleError } = require('./errors')

module.exports = (job, info) => {
  if (!job.always_encode) throw new UpscaleError('Audio only, skipping higher quality encode.')
  const duration = Math.round(info.duration * 100) / 100
  const audiosettings = []
  if (job.dest_path.endsWith('.mp3')) audiosettings.push('-c:a', 'libmp3lame', '-q:a', 5)
  else audiosettings.push('-c:a', 'libfdk_aac', '-vbr', 2)
  const child = childprocess.spawn('/opt/ffmpeg/bin/ffmpeg', [
    '-i', job.source_path,
    '-vn', // disable video output
    '-ac', 2, // keep up to two channels of audio
    ...audiosettings,
    '-y', // overwrite output file if exists
    job.dest_path
  ])
  return new Promise((resolve, reject) => {
    let output = ''
    child.stdout.on('data', chunk => {
      // progress is on stderr, just save stdout for debugging errors
      const line = chunk.toString('utf8')
      output += line
    })
    child.stderr.on('data', chunk => {
      const line = chunk.toString('utf8')
      const m = line.match(/time=(\d+):(\d+):(\d+).(\d+)/i)
      if (Array.isArray(m) && m[0]) {
        const hours = parseInt(m[1])
        const minutes = parseInt(m[2])
        const seconds = parseInt(m[3]) + parseFloat('0.' + m[4])
        const total = hours * 3600 + minutes * 60 + seconds
        const progress = Math.round(10000.0 * total / duration) / 100
        db.update('UPDATE queue SET percent_complete=?, encoding_lastupdated=NOW() WHERE id=?', progress, job.id).catch(err => console.warn(err))
      } else {
        output += line
      }
    })
    child.on('close', (code) => {
      if (code) {
        console.error('ffmpeg error', output, info)
        reject(new Error('ffmpeg returned failure code. see log for details'))
      } else resolve()
    })
  })
}
