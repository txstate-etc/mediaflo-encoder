const db = require('txstate-node-utils/lib/mysql')

async function main () {
  const jobid = await db.getval("SELECT id FROM queue WHERE status='waiting' ORDER BY id LIMIT 1")
  const mine = await db.execute("UPDATE queue SET status='working' WHERE status='waiting' AND id=?", jobid)
  if (mine) {
    console.log('I got a job!')
  }
}