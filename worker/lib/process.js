const childprocess = require('child_process')
const util = require('util')
const exec = util.promisify(childprocess.exec)
const fsp = require('fs').promises
const db = require('txstate-node-utils/lib/mysql')
const copy = require('cp-file')
const { UpscaleError } = require('./errors')

function nearest16 (num) {
  num = Math.round(num)
  if (num % 16 < 8) return num - num % 16
  return 16 + num - num % 16
}

function normalizefps (fps) {
  if (!fps) return 30
  if (fps < 22 || fps > 64 || [23.976, 24, 29.97, 30, 59.94, 60].includes(fps)) return fps
  if (fps < 26) return 23.976
  if (fps < 34) return 29.97
  if (fps < 55) return fps
  return 59.94
}

async function mediainfo (path) {
  const output = await exec(`perl /usr/src/app/lib/mediainfo.pl "${path}"`)
  return JSON.parse(output.stdout)
}

function detectcrop (output) {
  const m = output.match(/autocrop\s*=\s*(\d+)\/(\d+)\/(\d+)\/(\d+)/i)
  if (m) {
    return { top: parseInt(m[1]), bottom: parseInt(m[2]), left: parseInt(m[3]), right: parseInt(m[4]) }
  }
  return null
}

async function cropinfo (path) {
  try {
    const output = await exec(`/HandBrakeCLI -i "${path}" --scan --previews 25`)
    return detectcrop(output.stdout) || detectcrop(output.stderr) || { top: 0, bottom: 0, left: 0, right: 0 }
  } catch (e) {
    console.log(e)
  }
  return { top: 0, bottom: 0, left: 0, right: 0 }
}

module.exports = async (job) => {
  const inputpath = job.source_path
  const outputpath = job.dest_path
  const info = await mediainfo(inputpath)
  const targetheight = job.resolution
  const targetwidth = targetheight * 1.7778
  const videowidth = info.video.display_width
  const videoheight = info.video.display_height
  const anamorphicscale = info.video.display_width / info.video.width

  // gather crop information
  const { top, bottom, left, right } = await cropinfo(inputpath)
  const croppedwidth = videowidth - ((left + right) * anamorphicscale)
  const croppedheight = videoheight - top - bottom
  const displayratio = croppedwidth / croppedheight

  const wide = displayratio > 1.7778
  let finalwidth = nearest16(wide ? targetwidth : targetheight * displayratio)
  let finalheight = nearest16(wide ? targetwidth / displayratio : targetheight)
  if (finalheight === 1088 && finalwidth <= 1920) finalheight = 1080
  if (finalheight === 368 && finalwidth <= 640) finalheight = 360

  const finalarea = finalwidth * finalheight
  const originalarea = croppedwidth * croppedheight

  // return error if an upscale was requested
  if (finalarea > originalarea * 1.3 && targetheight !== 360) {
    throw new UpscaleError('Upscaling videos is not supported.')
  } else {
    await db.update('UPDATE queue SET final_width=?, final_height=?, encoding_lastupdated=NOW() WHERE id=?', finalwidth, finalheight, job.id)
  }

  // if video is interlaced, let's figure out whether it is a true interlace or actually a telecine
  // telecine means we should --detelecine and set framerate to 23.976
  // true interlace was recorded at 60i; we'll get best quality if we convert to 60p
  //
  // HandBrake can help us tell the difference if we set it to detelecine with variable frame rate
  // on a telecine video, it will discard every 5th frame and the output video will be near 24fps
  // on a true interlaced video, it will not discard frames and will be near 30fps
  let finalfps = normalizefps(info.video.fps)
  let detelecine = false
  let deinterlace = false
  if (info.video.interlaced && Math.round(info.video.fps) === 30) {
    const testpath = '/tmp/' + job.source_path
    const startat = Math.min(Math.floor(info.duration / 2.0), 60)
    let testinfo
    try {
      await exec('/HandBrakeCLI -i "' + inputpath + '" -o "' + testpath + '" -f mp4 -m --optimize ' +
        '--custom-anamorphic --pixel-aspect 1:1 -w 200 -l 200 -e x264 -q 30 ' +
        `--crop ${top}:${bottom}:${left}:${right} ` +
        '-x "ref=3:weightp=0:b-pyramid=strict:b-adapt=2:me=umh:subme=6:rc-lookahead=40" ' +
        '-a none --no-markers --detelecine --vfr ' +
        '--start-at duration:' + startat + ' --stop-at duration:3')
      testinfo = await mediainfo(testpath)
    } finally {
      await fsp.unlink(testpath)
    }
    if (testinfo.video.fps < 26.0) {
      finalfps = 23.976
      detelecine = true
    } else {
      finalfps = normalizefps(info.video.fps * 2.0)
      deinterlace = true
    }
  }

  await db.update('UPDATE queue SET encoding_started=NOW(), encoding_lastupdated=NOW() WHERE id=?', job.id)
  // determine whether encoding is necessary
  if (detelecine || deinterlace || info.format !== 'mp4' ||
      finalarea * 1.3 < originalarea ||
      info.audio.length > 1 || info.audio[0].format !== 'aac' ||
      !info.streamable || info.video.format !== 'h264' ||
      info.video.bps > 10000000 * (finalarea / (1280 * 720.0))) {
    // encoding is necessary
    const child = childprocess.spawn('/HandBrakeCLI', [
      '-i', inputpath, '-o', outputpath,
      '-f', 'mp4', '-m', '--optimize',
      '--custom-anamorphic', '--pixel-aspect', '1:1', '--crop', `${top}:${bottom}:${left}:${right}`,
      '-w', finalwidth, '-l', finalheight, '--cfr', '--rate', finalfps,
      ...(detelecine ? ['--detelecine'] : []), ...(deinterlace ? ['--deinterlace=bob'] : []),
      '-e', 'x264', '-q', '20', '-x', 'ref=3:weightp=0:b-pyramid=strict:b-adapt=2:me=umh:subme=7:rc-lookahead=40',
      '-a', '1', '-E', 'fdk_aac', '--aq', '2', '-6', 'dpl2',
      '--no-markers'
    ])

    return new Promise((resolve, reject) => {
      child.stdout.on('data', chunk => {
        const line = chunk.toString('utf8')
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
  } else {
    return copy(inputpath, outputpath).on('progress', info => {
      db.update('UPDATE queue SET percent_complete=?, encoding_lastupdated=NOW() WHERE id=?', info.percent * 100.0, job.id)
    })
  }
}
