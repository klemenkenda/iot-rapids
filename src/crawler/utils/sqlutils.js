// includes
let mariadb = require('mariadb');

/**
 * A class for different utils for working with crawlers in
 * rapids-iot.
 */
class SQLUtils {

    constructor(config) {
        this.config = require('../../common/config.json')['storage']['rapids-iot'];
        this.pool = null;
        this.connectToMariaDB();
    }

    connectToMariaDB() {
        // connect to the database
        this.pool = mariadb.createPool({
            host: this.config.host,
            user: 'root',
            password: this.config.root_password,
            multipleStatements: true
        });
    }

    async getPlaces() {
        let conn;

        try {
            // create connection
            conn = await this.pool.getConnection();
            // select appropriate database
            conn.query(`use rapidsiot;`);

            // retrieve places
            const sql = `select * from places`;
            let data = await conn.query(sql);

            // delete unnecessary data
            delete data.meta;
            return data;
        } catch(e) {
            // display error and assume the link is down - repeat connecting to DB
            console.log("Error", e);
            this.connectToMariaDB();
        } finally {
            if (conn) conn.release();
        }
    }

}

module.exports = SQLUtils;
