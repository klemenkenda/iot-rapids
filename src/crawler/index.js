// imports
const CrawlerUtils = require('./crawlerutils');

// dynamically load all the crawlers
const crawlerConfigs = CrawlerUtils.getCrawlers();

const Crawlers = [];
const crawlers = [];

crawlerConfigs.forEach((crawler, i) => {
    Crawlers.push(require(crawler.dir + '/crawler.js'));
    crawlers.push(new Crawlers[i]());
});

crawlers[1].crawl();
