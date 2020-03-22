// imports
const CrawlerUtils = require('../../utils/crawlerutils.js');

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
                this.state.last_time = -1;
            }

            const data = await CrawlerUtils.getURL(this.config.url);
            const json = JSON.parse(data);
            console.log(json);
        } catch (e) {
            console.log(e);
        }
        // update datalake repository with the crawled data

        // update the state with the last crawled timestamp

        // update state

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
