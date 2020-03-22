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

                items.forEach((el, i) => {
                    // extract node data
                    if (i === 0) {
                        const node_p = {
                            x: el.x_wgs,
                            y: el.y_wgs,
                            title: el.stevci_cestaOpis + ", " + el.stevci_lokacijaOpis
                        }

                        el.Data.forEach((counter, j) => {
                            // extract last metadata
                            let node_c = node_p;
                            node_c.uuid = counter.Id;
                            node_c.title +=
                                "," + counter.properties.stevci_smerOpis +
                                ", " + counter.properties.stevci_pasOpis;

                            // extract data
                            const p = counter.properties;
                            const gap = parseFloat(p.stevci_gap);
                            const speed = parseFloat(p.stevci_hit);
                            const num = parseInt(p.stevci_stev);
                            const stat = parseInt(p.stevci_stat);

                            console.log(gap, speed, num, stat);
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
