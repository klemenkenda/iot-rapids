// imports
const CrawlerUtils = require('./utils/crawlerutils');
const ActiveCrawlers = require('./config/active_crawlers.json');
const fs = require('fs');

// dynamically load all the crawlers
const crawlerConfigs = CrawlerUtils.getCrawlers();

const Crawlers = [];
const crawlers = [];
j = 0;

let i = 0;
crawlerConfigs.forEach((crawler) => {
    if ( crawler.config.length == undefined) {
        if (ActiveCrawlers.includes(crawler.config.id)) {
            Crawlers.push(require(crawler.dir + '/crawler.js'));
            crawlers.push(new Crawlers[i]());
            i++;
        }
    } else {
        crawler.config.forEach((element) => {
            if (ActiveCrawlers.includes(element.id)) {
                Crawlers.push(require(crawler.dir + '/crawler.js'));
                crawlers.push(new Crawlers[i](id = element.id));
                i++;
            }
        });
    }

    if (!fs.existsSync(__dirname + '/../data/' + crawler.config.id)) {
        fs.mkdirSync(__dirname + '/../data/' + crawler.config.id);
    }
});

// hardcoded loop
function runLoop() {
    crawlers.forEach(async (crawler) => {
        await crawler.crawl();
    });
};

let timeout = setInterval(runLoop, 5 * 1000);