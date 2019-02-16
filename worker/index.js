const db = require('txstate-node-utils/lib/mysql')
const _ = require('txstate-node-utils/lib/util')

async function getajob () {
  const jobid = await db.getval('SELECT id FROM queue WHERE status="waiting" ORDER BY id LIMIT 1')
  if (jobid) {
    const mine = await db.update('UPDATE queue SET status="working" WHERE status="waiting" AND id=?', jobid)
    if (mine) {
      console.log('I got a job!', jobid)
      await db.update('UPDATE queue SET status="success" WHERE id=?', jobid)
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
