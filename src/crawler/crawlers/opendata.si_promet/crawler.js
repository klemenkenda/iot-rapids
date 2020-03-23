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
        console.log(sensors);

        // do the crawling here
        try {
            if (this.state.last_record === undefined) {
                this.state.last_ts = -1;
            }

            const data = await CrawlerUtils.getURL(this.config.url);
            const json = JSON.parse(data);

            const ts = json.updated;

            // is this a new record?
            if (ts > this.state.last_ts) {
                // all the items
                const items = json.Contents[0].Data.Items;

                items.forEach(async (el, i) => {
                    // extract node data
                    if (i < 2) {
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
                        } else {
                            console.log("Place exists");
                        }

                        el.Data.forEach(async (counter, j) => {
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
                                this.sensor_types.forEach(async (type) => {
                                    const uuid = node_c.uuid + "-" + type;
                                    const title = uuid;
                                    await this.SQLUtils.insertSensor(uuid, node_c.uuid, type, title);
                                    console.log("inserting" + uuid);
                                });
                                console.log("Refreshing sensors");
                                sensors = await this.SQLUtils.getSensors();
                            } else {
                                console.log("Node exists");
                            }

                            // extract data
                            const p = counter.properties;
                            const values = {
                                gap: parseFloat(p.stevci_gap),
                                speed: parseFloat(p.stevci_hit),
                                num: parseInt(p.stevci_stev),
                                stat: parseInt(p.stevci_stat)
                            }

                            // insert measurements
                            for

                            console.log(values);
                        });
                    }
                })

            }

        } catch (e) {
            console.log("ERROR:", e);
        }
        // update datalake repository with the crawled data

        // update the state with the last crawled timestamp

        // update state
        let state = this.state;

        // write final state
        CrawlerUtils.saveState(__dirname, state);
    }

    /**
     * Loads the datalake data into the database.
     */
    load() {
        // load the data from datalake into the db
    }
}

module.exports = OpendataSiPrometCrawler;
