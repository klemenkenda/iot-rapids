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