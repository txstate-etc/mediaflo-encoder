# Mediaflo Encoder Loader

## Docker Environment Variables

### MySQL

These details should match those from the [Worker](../worker/).

* `DB_HOST` -- Hostname of the MySQL database that holds the encode queue. *Defaults to `mysql`.*
* `DB_USER` -- Username to connect to MySQL as. *Defaults to `root`, but seriously, don't do that.*
* `DB_PASS` -- Password to connect to MySQL as. *Defaults to `secret`.*
* `DB_DATABASE` -- Database to use to store the encode queue. *Defaults to `default_database`.*

### Ensemble

* `ENSEMBLEDB_HOST` -- Database server host of the MSSQL Ensemble database. Append with `\instance` for a named instance. *Defaults to `mssql`.*
* `ENSEMBLEDB_USER` -- Username to connect to MSSQL as. *Defaults to `ensemble`.*
* `ENSEMBLEDB_DOMAIN` -- Domain of the user acccount. You should be able to set this to an empty string to log in with a simple account but that is untested. *Defaults to `domain`.*
* `ENSEMBLEDB_PASS` -- Password to connect to MSSQL as. *Defaults to `secret`.*
* `ENSEMBLEDB_DATABASE` -- Database where the Ensemble data is kept. *Defaults to `default_database`.*

### API

* `API_USER` -- User to require for basic auth to the most of the API calls. *Defaults to `apiuser`.*
* `API_PASS` -- Password to for basic auth. *Defaults to `secret`.*

## SSL/TLS Key

Unless you use `--env NODE_ENV=development` or `--env SERVE_HTTP=true` (but you know you're a bad person if you do that, right?) this image listens on 443. A self-signed key is generated as part of the image build. Volume mount to */securekeys/private.key* and */securekeys/cert.pem* if you want to use your own.
