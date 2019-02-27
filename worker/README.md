# Mediaflo Encoder Worker

## Docker Environment Variables

### MySQL

These details should match those from the [Loader](../loader/).

* `DB_HOST` -- Hostname of the MySQL database that holds the encode queue. *Defaults to `mysql`.*
* `DB_USER` -- Username to connect to MySQL as. *Defaults to `root`, but seriously, don't do that.*
* `DB_PASS` -- Password to connect to MySQL as. *Defaults to `secret`.*
* `DB_DATABASE` -- Database to use to store the encode queue. *Defaults to `default_database`.*

## Volumes

Ensemble will start the job with a *file://* path. The [Loader](../loader/) will translate that path into */media/*. ie., `file:///host/path/file.mp4` becomes `/media/host/path/file.mp4`. It is left to the implementor to identify where the videos are and **--volume** mount them into the */media/* directory appropriately.
