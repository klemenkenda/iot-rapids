// imports
const CrawlerUtils = require('../../crawlerutils');

// external imports
// const cheerio = require('cheerio'); // handling DOM
// const moment = require('moment'); // handling time

/**
 * Class for template crawler.
 */
class TemplateCrawler {
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
    crawl() {
        // do the crawling here

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

module.exports = TemplateCrawler;
