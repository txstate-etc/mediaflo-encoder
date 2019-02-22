const express = require('express')
const presets = require('../presets.json')
const xmlbuilder = require('xmlbuilder')
const bodyparser = require('body-parser')
const xmlparsestring = require('../lib/xml-parsepromise.js')
const db = require('txstate-node-utils/lib/mysql')
const uuidv4 = require('uuid/v4')

var router = express.Router()

router.use('/?$', bodyparser.text({ type: 'application/xml' }))
router.post('/?$', async (req, res) => {
  var jobdetails = await xmlparsestring(req.body)

  var data = {
    jobid: uuidv4(),
    name: jobdetails.JobCreateInfo.Name[0],
    presetid: jobdetails.JobCreateInfo.JobMediaInfo[0].CompressionPresetList[0].CompressionPreset[0].PresetId[0],
    source: jobdetails.JobCreateInfo.JobMediaInfo[0].SourceMediaList[0].SourceMediaInfo[0].FileUri[0],
    destination: jobdetails.JobCreateInfo.JobMediaInfo[0].DestinationList[0].DestinationInfo[0].FileUri[0]
  }
  var preset = presets.filter((preset) => preset.id === data.presetid)
  data.preset = preset[0]

  data.destination = data.destination.replace(/%JOBID%/, data.jobid)
  data.source = data.source.replace(/^file:\/\//, '/media/')
  data.destination = data.destination.replace(/^file:\/\//, '/media/')

  await db.insert('INSERT INTO queue(id, name, source_path, dest_path, resolution) values (?,?,?,?,?)',
    data.jobid,
    data.name,
    data.source,
    data.destination,
    data.preset.height
  )

  var root = xmlbuilder.create('JobIdInfo')
  root.ele('JobId').text(data.jobid)

  res.status(200).contentType('application/xml').send(root.end({ pretty: true }))
})

router.get('/status/:id/$', async (req, res) => {
  var job = await db.getrow('SELECT * FROM queue WHERE id=? ORDER BY id LIMIT 1', req.params.id)

  if (!job) {
    res.status(404).send()
    return
  }

  var root = xmlbuilder.create('JobStatusInfo')
  root.ele('Name').text(job.name)
  root.ele('QueueId').text('00000000-0000-0000-0000-000000000000')
  var status = root.ele('Status')
  status.ele('Created').text(new Date().toISOString())
  if (job.status === 'working') {
    status.ele('Progress').text(job.percent_complete)
  }
  var statusmap = {
    waiting: 'Waiting',
    working: 'Compressing',
    success: 'Finished',
    error: 'Error'
  }
  status.ele('Status').text(statusmap[job.status])
  if (job.status === 'error') {
    status.ele('StatusMessage').text(job.error)
  }
  root.ele('TimeSubmitted').text(job.job_created.toISOString())

  res.status(200).contentType('application/xml').send(root.end({ pretty: true }))
})

module.exports = router
