// imports
const CrawlerUtils = require('./crawlerutils');
const ActiveCrawlers = require('./config/active_crawlers.json');
const fs = require('fs');

// dynamically load all the crawlers
const crawlerConfigs = CrawlerUtils.getCrawlers();

const Crawlers = [];
const crawlers = [];
j = 0

crawlerConfigs.forEach((crawler, i) => {
    if (ActiveCrawlers.includes(crawler.config.id)) {
        Crawlers.push(require(crawler.dir + '/crawler.js'));
        crawlers.push(new Crawlers[j]());

        Crawlers.push(require(crawler.dir + '/crawler.js'));
        crawlers.push(new Crawlers[j]());

        if (!fs.existsSync(__dirname + '/../data/' + crawler.config.id)) {
            fs.mkdirSync(__dirname + '/../data/' + crawler.config.id);
        }

        j++;
    }
});

crawlers.forEach((crawler) => {
    crawler.crawl();
});
