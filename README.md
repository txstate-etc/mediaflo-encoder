# mediaflo-encoder

Loader and Worker must agree on a set of columns in MySQL:

* table name "queue"
* id: varchar (will be a GUID)
* name: varchar
* job_created: datetime (UTC)
* status: enum('waiting','working','success','error')
* source_path: text
* dest_path: text
* resolution: unsigned smallint (240,480,720,1080,2160)
* final_width: unsigned smallint
* final_height: unsigned smallint
* encoding_started: datetime (UTC)
* encoding_completed: datetime (UTC)
* percent_complete: decimal(5,2)

# Notes
* Loader is responsible for creating the database and managing table schemas
* Loader is responsible for cleaning old jobs from MySQL if necessary
* Worker will return an error when a significant upscale is requested
* Worker will copy the file from source to dest when the source file is acceptable for the given resolution
