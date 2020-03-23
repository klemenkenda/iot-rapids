// imports
const CrawlerUtils = require('../../utils/crawlerutils.js');
const SQLUtils = require('../../utils/sqlutils.js');

// external imports
const moment = require('moment'); // handling time

/**
 * Class for template crawler.
 */
class OpendataSiPrometCrawler {
    /**
     * Responsible for loading state
     */
    constructor() {
        // loading config
        this.config = CrawlerUtils.loadConfig(__dirname);
        // loading state
        this.state = CrawlerUtils.loadState(__dirname);
        // sensor types
        this.sensor_types = [
            "gap", "speed", "number", "class"
        ];

        // connect to DB
        this.SQLUtils = new SQLUtils();
        this.SQLUtils.getPlaces();
    }

    /**
     * Responsible for crawling at one step.
     *
     * NOTE: Take care that the crawler is resistant to delays (it crawls
     * also historic data if needed). Crawler should provide all the steps
     * denoted in the comments of this method.
     */
    async crawl() {
        console.log('Starting crawl: ' + this.config.id);

        // retrieve data from SQL
        const places = await this.SQLUtils.getPlaces();
        const nodes = await this.SQLUtils.getNodes();
        let sensors = await this.SQLUtils.getSensors();

        // do the crawling here
        try {
            if (this.state.last_ts === undefined) {
                this.state.last_ts = -1;
            }

            const data = await CrawlerUtils.getURL(this.config.url);
            const json = JSON.parse(data);

            const ts = json.updated;

            // is this a new record?
            if (ts > this.state.last_ts) {
                // all the items
                const items = json.Contents[0].Data.Items;
                // counter
                let i = -1;
                let insertSQL = "";
                for (const el of items) {
                    i++;
                    // extract node data
                    if (i < 2) { //
                    const node_p = {
                        x: el.x_wgs,
                        y: el.y_wgs,
                        title: el.stevci_cestaOpis + ", " + el.stevci_lokacijaOpis,
                        uuid: (el.stevci_cestaOpis + "-" + el.stevci_lokacijaOpis).replace(/\s+/g, '')
                    }

                    // does this place already exist?
                    const place = places.filter(x => x.uuid === node_p.uuid);
                    if (place.length === 0) {
                        await this.SQLUtils.insertPlace(node_p.uuid, node_p.title, node_p.x, node_p.y);
                    };

                    // create all the nodes in this place
                    for (const counter of el.Data) {
                        // extract last metadata
                        let node_c = node_p;
                        node_c.uuid = counter.Id;
                        node_c.title +=
                            "," + counter.properties.stevci_smerOpis +
                            ", " + counter.properties.stevci_pasOpis;

                        // insert node if needed
                        const node = nodes.filter(x => x.uuid === node_c.uuid);
                        if (node.length === 0) {
                            await this.SQLUtils.insertNode(node_c.uuid, node_p.uuid, node_c.title);
                            // insert also corresponding sensors
                            for (const type of this.sensor_types) {
                                const uuid = node_c.uuid + "-" + type;
                                const title = uuid;
                                console.log("Inserting: ", uuid);
                                await this.SQLUtils.insertSensor(uuid, node_c.uuid, type, title);
                            }
                            console.log("Refreshing sensors");
                            sensors = await this.SQLUtils.getSensors();
                        };

                        // extract data
                        const p = counter.properties;
                        const values = {
                            gap: parseFloat(p.stevci_gap),
                            speed: parseFloat(p.stevci_hit),
                            number: parseInt(p.stevci_stev),
                            class: parseInt(p.stevci_stat)
                        }

                        // insert measurements
                        for (const type of this.sensor_types) {
                            // find sensor id
                            const sensor_uuid = node_c.uuid + "-" + type;
                            const sensor = sensors.filter(x => x.uuid === sensor_uuid);
                            if (sensor.length > 0) {
                                const sensor_id = sensor[0].id;
                                const value = values[type];
                                // console.log("Sensor id:", sensor_id, "value:", value);
                                insertSQL += this.SQLUtils.insertMeasurementSQL(sensor_id, ts, value);
                            } else {
                                console.log("Sensor not found: ", sensor_uuid);
                            }
                        };
                    };
                    } //
                }
                console.log("Inserting measurements.");
                await this.SQLUtils.processSQL(insertSQL);
                console.log("Finishing inserting measurements.")
            } else {
                console.log("No new data.")
            }

            // update datalake repository with the crawled data

            // update the state with the last crawled timestamp
            this.state.last_ts = ts;

            // update state

            // write final state
            CrawlerUtils.saveState(__dirname, this.state);

        } catch (e) {
            console.log("ERROR:", e);
        }
    }

    /**
     * Loads the datalake data into the database.
     */
    load() {
        // load the data from datalake into the db
    }
}

module.exports = OpendataSiPrometCrawler;
