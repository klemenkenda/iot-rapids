// imports
const CrawlerUtils = require('../../crawlerutils');

class GorivaSiCrawler {

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
    async crawl() {
        // do the crawling here
        const html = await CrawlerUtils.getURL(this.config.start);
        console.log(html);
        // update datalake repository with the crawled data

        // update the state with the last crawled timestamp

        // update state
        this.state.lastts = new Date("2020-01-01T10:10:10Z").getTime();

        // write final state
        CrawlerUtils.saveState(__dirname, this.state);

    }

    /**
     * Loads the datalake data into the database.
     */
    load() {
        // load the data from datalake into the db
        return this.config.id;
    }

}

module.exports = GorivaSiCrawler;