let GenerateSchema = require('./generateschema.mariadb.js');

let g = new GenerateSchema([
    { name: 'rapids-iot-pg', items: [ 'init.1.sql', 'init.2.sql', 'upgrade.1.sql', 'data.1.sql' ] }
]);
g.execute();