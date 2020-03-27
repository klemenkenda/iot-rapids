let GenerateSchema = require('./generateschema.pg.js');

let g = new GenerateSchema([
    { name: 'rapids-iot-pg', items: [ 'upgrade.1.sql' ] }
]);
g.execute();