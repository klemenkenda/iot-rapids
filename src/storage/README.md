# postgres server
Creating a local PG server which stores the crawled data.

1. Install postgres on local machine
2. Connect to the server via PSQL client or PGAdmin to check for successful server setup
3. In *common/config.example.json* set the values accordingly and rename the file to *config.json*

# storage
Solution for generating storage.

Install: `npm install`
Create DB: `node upgrade.js`
Destroy DB: `node downgrade.js`

## Schema
Schema is defined in corresponding subfolders. Files:

* `init.1.sql` - creating db
* `init.2.sql` - creating sql user
* `upgrade.N.sql` - nth incremental schema upgrade
* `data.N.sql` - nth incremental data package
* `downgrade.N.sql` - nth incremental schema downgrade
