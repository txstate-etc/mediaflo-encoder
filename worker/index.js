const db = require('txstate-node-utils/lib/mysql')
const _ = require('txstate-node-utils/lib/util')
const processjob = require('./lib/process')

async function getajob () {
  const job = await db.getrow('SELECT * FROM queue WHERE status="waiting" ORDER BY id LIMIT 1')
  if (job) {
    const mine = await db.update('UPDATE queue SET status="working" WHERE status="waiting" AND id=?', job.id)
    if (mine) {
      console.log('I got a job!', job.id)
      try {
        await processjob(job)
        await db.update('UPDATE queue SET status="success" WHERE id=?', job.id)
      } catch (error) {
        await db.update('UPDATE queue SET status="error" WHERE id=?', job.id)
        throw error
      }
    }
  }
}

async function main () {
  while (true) {
    try {
      await getajob()
    } catch (err) {
      console.log(err)
    } finally {
      await _.sleep(1000)
    }
  }
}
main()
