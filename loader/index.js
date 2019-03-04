const service = require('txstate-node-utils/lib/service')
const app = service.app
const migrate = require('./lib/migrate')
const expressbasicauth = require('express-basic-auth')
const ensembledb = require('./lib/ensembledb')
require('./lib/resetjobs')

// health check
app.get('/api/?$', async (req, res) => {
  res.status(200).send('OK')
})

const basicauthusers = {}
basicauthusers[process.env.API_USER || 'apiuser'] = process.env.API_PASS || 'secret'
app.use(expressbasicauth({ users: basicauthusers }))

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
