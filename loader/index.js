const service = require('txstate-node-utils/lib/service')
const app = service.app
const migrate = require('./lib/migrate')
const expressbasicauth = require('express-basic-auth')
require('./lib/resetjobs')

// health check
app.get('/api/?$', async (req, res) => {
  res.status(200).send('OK')
})
app.use('/api/stats', require('./routes/stats.js'))

const basicauthusers = {}
basicauthusers[process.env.API_USER || 'apiuser'] = process.env.API_PASS || 'secret'
app.use(expressbasicauth({ users: basicauthusers }))

app.use('/api/presets', require('./routes/presets.js'))
app.use('/api/jobs', require('./routes/jobs.js'))

Promise.all([
  migrate()
]).then(async () => {
  await service.start()
  console.info('Loader started!')
}).catch((err) => {
  console.error('Migration failed', err)
  process.exit()
})
