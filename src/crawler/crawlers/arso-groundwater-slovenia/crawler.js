// imports
const CrawlerUtils = require('../../crawlerutils');

/**
 * Class for ARSO Groundwater crawler.
 */
class ArsoGroundwaterSloveniaCrawler {
    /**
     * Responsible for loading state
     */
    constructor() {
        // loading config
        this.config = CrawlerUtils.loadConfig(__dirname);
        // loading state
        this.state = CrawlerUtils.loadState(__dirname);
    }

    /**
     * Responsible for crawling at this step.
     *
     * NOTE: Take care that the crawler is resistant to delays (it crawls
     * also historic data if needed). Crawler should do everything that
     * is needed.
     */
    crawl() {
        // do the crawling here

        // update datalake repository with the crawled data

        // update the state with the last crawled timestamp

        // update state
        state.lastts = new Date('2020-01-01T10:10:10Z').getTime();

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

module.exports = ArsoGroundwaterSloveniaCrawler;
