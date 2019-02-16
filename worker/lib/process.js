const childprocess = require('child_process')
const util = require('util')
const exec = util.promisify(childprocess.exec)
const db = require('txstate-node-utils/lib/mysql')

function nearest16 (num) {
  num = Math.round(num)
  if (num % 16 < 8) return num - num % 16
  return 16 + num - num % 16
}

module.exports = async (job) => {
  const inputpath = '/video_src/' + job.source_path
  const outputpath = '/video_dest/' + job.dest_path
  const output = await exec(`perl /usr/src/app/lib/mediainfo.pl "${inputpath}"`)
  const info = JSON.parse(output.stdout)
  const targetheight = job.resolution
  const targetwidth = targetheight * 1.7778
  const wide = 1.0 * info.video.display_width / info.video.display_height > 1.7778
  const finalwidth = nearest16(wide ? targetwidth : targetheight * 1.7778)
  const finalheight = nearest16(wide ? targetwidth / 1.7778 : targetheight)

  await db.update('UPDATE queue SET encoding_started=NOW() WHERE id=?', job.id)
  const child = childprocess.spawn('/HandBrakeCLI', [
    '-i', inputpath, '-o', outputpath,
    '-f', 'mp4', '-m', '--optimize',
    '--custom-anamorphic', '--pixel-aspect', '1:1',
    '-w', finalwidth, '-l', finalheight,
    '-e', 'x264', '-q', '20', '-x', 'ref=3:weightp=0:b-pyramid=strict:b-adapt=2:me=umh:subme=7:rc-lookahead=40',
    '-a', '1', '-E', 'fdk_aac', '--aq', '2', '6', 'dpl2',
    '--no-markers'
  ])

  return new Promise((resolve, reject) => {
    child.stdout.on('data', chunk => {
      const line = chunk.toString('utf8')
      const m = line.match(/(\d+\.\d+)\s?%/i)
      if (Array.isArray(m) && m[0]) {
        const progress = parseFloat(m[0])
        db.update('UPDATE queue SET percent_complete=? WHERE id=?', progress, job.id).catch(err => console.log(err))
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
