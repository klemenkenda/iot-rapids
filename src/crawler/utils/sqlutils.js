// includes
const mariadb = require('mariadb');
const { Pool } = require('pg');

/**
 * A class for different utils for working with crawlers in
 * rapids-iot.
 */
class SQLUtils {

    constructor(config) {
        this.config = require('../../common/config.json')['storage']['rapids-iot-pg'];
        this.pool = null;
        // this.connectToMariaDB();
        this.connectToPg();
    }

    connectToPg() {
        this.pool = new Pool({
            host: this.config.host,
            user: this.config.user,
            password: this.config.password,
            database: this.config.db,
        })
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
        try {
            // retrieve places
            const sql = `select * from rapids_iot.places`;
            let data = await this.pool.query(sql);

            // delete unnecessary data
            return data.rows;
        } catch(e) {
            // display error and assume the link is down - repeat connecting to DB
            console.log("Error", e);
        }
    }

    async insertPlace(crawler, uuid, title, x, y) {
        try {
            // sql
            const sql = `
                insert into rapids_iot.places (crawler, uuid, title, x, y)
                values('${crawler}', '${uuid}', '${title}', ${x}, ${y})
            `;

            this.pool.query(sql);
            console.log("Inserted place: " + uuid);

            return true;
        } catch (e) {
            // display error and assume the link is down - repeat connecting to DB
            console.log("Error", e);
            return false;
        }
    }


    // -------------------------------------------------------
    // NODES
    // -------------------------------------------------------

    async getNodes() {
        try {
            // retrieve places
            const sql = `select * from rapids_iot.nodes`;
            let data = await this.pool.query(sql);

            // delete unnecessary data
            return data.rows;
        } catch(e) {
            // display error and assume the link is down - repeat connecting to DB
            console.log("Error", e);
        };
    }

    async insertNode(uuid, place_uuid, title) {
        try {
            // sql
            const sql = `
                insert into rapids_iot.nodes (uuid, place_uuid, title)
                values('${uuid}', '${place_uuid}', '${title}')
            `;

            this.pool.query(sql);
            console.log("Inserted node: " + uuid);

            return true;
        } catch (e) {
            // display error and assume the link is down - repeat connecting to DB
            console.log("Error", e);
            return false;
        }
    }


    // -------------------------------------------------------
    // SENSORS
    // -------------------------------------------------------

    async getSensors() {
        try {
            // retrieve places
            const sql = `select * from rapids_iot.sensors`;
            let data = await this.pool.query(sql);

            return data.rows;
        } catch(e) {
            // display error and assume the link is down - repeat connecting to DB
            console.log("Error", e);
        }
    }

    async insertSensor(uuid, node_uuid, sensor_type_uuid, title) {
        try {
            // sql
            const sql = `
                insert into rapids_iot.sensors (uuid, node_uuid, sensor_type_uuid, title)
                values('${uuid}', '${node_uuid}', '${sensor_type_uuid}', '${title}')
            `;

            this.pool.query(sql);
            console.log("Inserted sensor: " + uuid);

            return true;
        } catch (e) {
            // display error and assume the link is down - repeat connecting to DB
            console.log("Error", e);
            return false;
        };
    }


    // -------------------------------------------------------
    // SENSORS
    // -------------------------------------------------------

    async insertMeasurement(sensor_id, ts, value) {
        try {
            // sql
            const sql = `
                insert into measurements (sensor_id, ts, value)
                values(${sensor_id}, FROM_UNIXTIME(${ts}), ${value})
            `;
            this.pool.query(sql);
            return true;
        } catch (e) {
            // display error and assume the link is down - repeat connecting to DB
            console.log("Error", e);
            return false;
        }
    }

    insertMeasurementSQL(sensor_id, ts, value) {
        return `insert into rapids_iot.measurements (sensor_id, measurement_ts, value) values(${sensor_id}, to_timestamp(${ts}), ${value}); `;
    }


    // -------------------------------------------------------
    // GENERAL
    // -------------------------------------------------------

    async processSQL(sql) {
        try {
            this.pool.query(sql);
            return true;
        } catch (e) {
            // display error and assume the link is down - repeat connecting to DB
            console.log("Error", e);
            return false;
        }
    }

}

module.exports = SQLUtils;
