const db = require('txstate-node-utils/lib/mysql')

module.exports = async function () {
  await db.execute(`DROP TABLE IF EXISTS queue`)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS queue (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      job_created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status TINYTEXT NOT NULL DEFAULT 'waiting',
      source_path TEXT NOT NULL,
      dest_path TEXT NOT NULL,
      resolution SMALLINT UNSIGNED NOT NULL,
      encoding_started DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      percent_complete DECIMAL(5,2) NOT NULL DEFAULT 0.0,
      PRIMARY KEY (id),
      INDEX status (status(12))
    ) ENGINE InnoDB
  `)
}
