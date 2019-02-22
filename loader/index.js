const service = require('txstate-node-utils/lib/service')
const app = service.app
const migrate = require('./lib/migrate')
const expressbasicauth = require('express-basic-auth')
const ensembledb = require('./lib/ensembledb')

// health check
app.get('/api/?$', async (req, res) => {
  res.status(200).send('OK')
})

app.use(expressbasicauth({
  users: {
    'SqueezeAdmin': process.env.API_PASS || 'changeme'
  }
}))

app.use('/api/presets', require('./routes/presets.js'))
app.use('/api/jobs', require('./routes/jobs.js'))

Promise.all([
  migrate(),
  ensembledb.wait()
]).then(async () => {
  await service.start()
  console.log('Loader started!')
}).catch((err) => {
  console.log('Migration failed', err)
  process.exit()
})
