const db = require('txstate-node-utils/lib/mysql')

module.exports = async function () {
  const tables = await db.getall('show tables')
  if (tables.length === 0) {
    console.log('initializing database')
    await db.execute(`
      CREATE TABLE IF NOT EXISTS queue (
        id VARCHAR(40) NOT NULL,
        name VARCHAR(255) NOT NULL,
        job_created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(40) NOT NULL DEFAULT 'waiting',
        error TEXT,
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
    await db.execute(`
      CREATE TABLE IF NOT EXISTS version (
        id INT NOT NULL
      ) ENGINE InnoDB
    `)
    await db.insert('INSERT INTO version values (1)')
  }

  let version = await db.getrow('select id from version')
  version = version.id

  if (version === 1) {
    version++
    console.log('updating database to version ' + version)
    await db.execute(`ALTER TABLE queue CHANGE encoding_completed encoding_lastupdated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`)
    await db.update('UPDATE version set id=?', version)
  }

  // if (version === 2) {
  //   version++
  //   console.log('updating database to version ' + version)
  //   await db.execute(`ALTER TABLE queue ...`)
  //   await db.update('UPDATE version set id=?', version)
  // }

  console.log('database version is ' + version)
}
