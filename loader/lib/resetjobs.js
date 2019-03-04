const db = require('txstate-node-utils/lib/mysql')

setInterval(async () => {
  await db.update("update queue set status='error', error='Reset count exceeded' where status='working' and date_add(encoding_lastupdated, interval 5 minute) < now() and reset_count=2")
  await db.update("update queue set status='waiting', reset_count=reset_count+1 where status='working' and date_add(encoding_lastupdated, interval 5 minute) < now()")
}, 5000)
