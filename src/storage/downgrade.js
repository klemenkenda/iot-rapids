let GenerateSchema = require('./generateschema.js');

let g = new GenerateSchema([
    { name: 'rapids-iot', items: [ 'downgrade.1.sql'] }
]);
g.execute();