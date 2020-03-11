<<<<<<< HEAD
// imports
const CrawlerUtils = require('./crawlerutils');

// dynamically load all the crawlers
let crawler_configs = CrawlerUtils.getCrawlers();

let Crawlers = [];
let crawlers = [];

crawler_configs.forEach((crawler, i) => {

    Crawlers.push(require(crawler.dir + "/crawler.js"));
    crawlers.push(new Crawlers[i]());

});

crawlers[1].crawl();
=======
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
>>>>>>> 9b477b654450cdf3f7a648e590d5f077acddabf0
