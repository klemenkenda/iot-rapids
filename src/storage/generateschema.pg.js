let config = require('../common/config.json')['storage'];
let { Pool, Client } = require('pg');
let fs = require('fs');

class GenerateSchema {
    constructor(branches) {
        this.branches = branches;
    }

    async file_sql(pool, name, item) {
        let sql = fs.readFileSync('./' + name + '/' + item).toString('utf8');
        try {
            await pool.query(sql);
        } catch (err) {
            console.log(err);
            throw err;
        } finally {
            console.log('Finishing file: ' + name + '@' + item);
        }

    }

    async generate(branch) {
        let lConfig = config[branch.name];
        console.log('Generating branch ' + branch.name + ' Postgres@' + lConfig.host);
        // connect to the database
        let pool = new Pool({
            host: lConfig.host,
            user: lConfig.user,
            password: lConfig.password,
            database: lConfig.db,
            multipleStatements: true
        });

        let conn;

        try {
            for (const item of branch.items) {
                await this.file_sql(pool, branch.name, item);
            }
        } finally {
            console.log('Ending connection.');
            if (pool) pool.end();
        }
    }

    async execute() {
        for (let i in this.branches) {
            let branch = this.branches[i];
            try {
                await this.generate(branch)
                    .catch((err) => { console.log('Error', err); });
            } finally {
                console.log('Finishing.');
            }
        }
    }
}

module.exports = GenerateSchema;