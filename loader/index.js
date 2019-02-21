const service = require('txstate-node-utils/lib/service')
const db = require('txstate-node-utils/lib/mysql')
const app = service.app
const migrate = require('./lib/migrate')

// health check
app.get('/api/?$', (req, res) => {
	res.status(200).send("OK");
});

app.use('/api/presets', require('./routes/presets.js'));
app.use('/api/jobs', require('./routes/jobs.js'));

migrate().then(async () => {
  await service.start()
  console.log('Loader started!')
}).catch((err) => {
  console.log('Migration failed', err)
  process.exit()
})
