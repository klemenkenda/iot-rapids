// imports
const CrawlerUtils = require('./crawlerutils');
const ActiveCrawlers = require('./active_crawlers.json');
const fs = require('fs');

// dynamically load all the crawlers
const crawlerConfigs = CrawlerUtils.getCrawlers();

const Crawlers = [];
const crawlers = [];

crawlerConfigs.forEach((crawler, i) => {

    if (ActiveCrawlers.includes(crawler.config.id)) {
        Crawlers.push(require(crawler.dir + '/crawler.js'));
        crawlers.push(new Crawlers[i]());

        if (!fs.existsSync(__dirname + '/../data/' + crawler.config.id)) {
            fs.mkdirSync(__dirname + '/../data/' + crawler.config.id);
        }
    }
});

crawlers.forEach((crawler) => {
    crawler.crawl();
});
