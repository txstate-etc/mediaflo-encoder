const childprocess = require('child_process')
const util = require('util')
const exec = util.promisify(childprocess.exec)
// const spawn = util.promisify(childprocess.spawn) // handbrake output is a stream

module.exports = async (job) => {
  console.log(await exec(`ls "/video_src"`))
  const output = await exec(`perl /usr/src/app/lib/mediainfo.pl "/video_src/${job.source_path}"`)
  const info = JSON.parse(output.stdout)
  console.log(info)
  return true
}
