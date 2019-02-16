const service = require('txstate-node-utils/lib/service')
const db = require('txstate-node-utils/lib/mysql')
const app = service.app
const migrate = require('./lib/migrate')

app.get('/', async (req, res) => {
  await db.insert('INSERT INTO queue(job_created, source_path, dest_path, resolution) VALUES (NOW(), ?, ?, ?)',
    'source', 'dest', 480)
  res.send('Done!')
})

migrate().then(async () => {
  await service.start()
  console.log('Loader started!')
}).catch((err) => {
  console.log('Migration failed', err)
  process.exit()
})
