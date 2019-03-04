const db = require('txstate-node-utils/lib/mysql')

setInterval(async () => {
  await db.update("update queue set status='waiting' where status='working' and date_add(encoding_lastupdated, interval 5 minute) < now()")
}, 60000)
