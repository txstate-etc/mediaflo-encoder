const db = require('txstate-node-utils/lib/mysql')

module.exports = async function () {
  return;
  await db.execute(`DROP TABLE IF EXISTS queue`)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS queue (
	  id VARCHAR(40) NOT NULL,
	  name VARCHAR(255) NOT NULL,
      job_created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(40) NOT NULL DEFAULT 'waiting',
      source_path TEXT NOT NULL,
      dest_path TEXT NOT NULL,
      resolution SMALLINT UNSIGNED NOT NULL,
      final_width SMALLINT UNSIGNED NOT NULL DEFAULT 0,
      final_height SMALLINT UNSIGNED NOT NULL DEFAULT 0,
      encoding_started DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      encoding_completed DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      percent_complete DECIMAL(5,2) NOT NULL DEFAULT 0.0,
      PRIMARY KEY (id),
      INDEX status (status(12))
    ) ENGINE InnoDB
  `)
}
