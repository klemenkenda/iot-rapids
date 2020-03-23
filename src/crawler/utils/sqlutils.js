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


    // -------------------------------------------------------
    // PLACES
    // -------------------------------------------------------

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

    async insertPlace(uuid, title, x, y) {
        let conn;

        try {
            // create connection
            conn = await this.pool.getConnection();
            // select appropriate database
            conn.query(`use rapidsiot;`);

            // sql
            const sql = `
                insert into places (uuid, title, x, y)
                values('${uuid}', '${title}', ${x}, ${y})
            `;

            conn.query(sql);
            console.log("Inserted place: " + uuid);

            return true;
        } catch (e) {
            // display error and assume the link is down - repeat connecting to DB
            console.log("Error", e);
            return false;
        } finally {
            if (conn) conn.release();
        }
    }


    // -------------------------------------------------------
    // NODES
    // -------------------------------------------------------

    async getNodes() {
        let conn;

        try {
            // create connection
            conn = await this.pool.getConnection();
            // select appropriate database
            conn.query(`use rapidsiot;`);

            // retrieve places
            const sql = `select * from nodes`;
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

    async insertNode(uuid, place_uuid, title) {
        let conn;

        try {
            // create connection
            conn = await this.pool.getConnection();
            // select appropriate database
            conn.query(`use rapidsiot;`);

            // sql
            const sql = `
                insert into nodes (uuid, place_uuid, title)
                values('${uuid}', '${place_uuid}', '${title}')
            `;

            conn.query(sql);
            console.log("Inserted node: " + uuid);

            return true;
        } catch (e) {
            // display error and assume the link is down - repeat connecting to DB
            console.log("Error", e);
            return false;
        } finally {
            if (conn) conn.release();
        }
    }


    // -------------------------------------------------------
    // SENSORS
    // -------------------------------------------------------

    async getSensors() {
        let conn;

        try {
            // create connection
            conn = await this.pool.getConnection();
            // select appropriate database
            conn.query(`use rapidsiot;`);

            // retrieve places
            const sql = `select * from sensors`;
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

    async insertSensor(uuid, node_uuid, sensor_type_uuid, title) {
        let conn;

        try {
            // create connection
            conn = await this.pool.getConnection();
            // select appropriate database
            conn.query(`use rapidsiot;`);

            // sql
            const sql = `
                insert into sensors (uuid, node_uuid, sensor_type_uuid, title)
                values('${uuid}', '${node_uuid}', '${sensor_type_uuid}', '${title}')
            `;

            conn.query(sql);
            console.log("Inserted sensor: " + uuid);

            return true;
        } catch (e) {
            // display error and assume the link is down - repeat connecting to DB
            console.log("Error", e);
            return false;
        } finally {
            if (conn) conn.release();
        }
    }


    // -------------------------------------------------------
    // SENSORS
    // -------------------------------------------------------

    async insertMeasurement(sensor_id, value) {
        let conn;

        try {
            // create connection
            conn = await this.pool.getConnection();
            // select appropriate database
            conn.query(`use rapidsiot;`);

            // sql
            const sql = `
                insert into measuremnts (sensor_id, value)
                values(${sensor_id}, ${value})
            `;

            conn.query(sql);

            return true;
        } catch (e) {
            // display error and assume the link is down - repeat connecting to DB
            console.log("Error", e);
            return false;
        } finally {
            if (conn) conn.release();
        }
    }


}

module.exports = SQLUtils;
